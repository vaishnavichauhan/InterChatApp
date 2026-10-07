import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Platform,
  PermissionsAndroid,
  Vibration,
  Alert,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
} from 'react-native-webrtc';
import { getSocket } from '../utils/socket';
import { useAuthStore } from '../store/authStore';

// Patch MediaStreamTrack.prototype._switchCamera to safely handle async errors and return promises
if (MediaStreamTrack && (MediaStreamTrack as any).prototype) {
  const originalSwitchCamera = (MediaStreamTrack as any).prototype._switchCamera;
  (MediaStreamTrack as any).prototype._switchCamera = function () {
    try {
      const constraints = { ...(this._settings || {}) };
      delete constraints.deviceId;
      constraints.facingMode = this._settings?.facingMode === 'user' ? 'environment' : 'user';
      if (typeof this.applyConstraints === 'function') {
        return this.applyConstraints(constraints).catch((err: any) => {
          console.warn('[WebRTC] Caught error switching camera:', err?.message || err);
        });
      }
      if (typeof originalSwitchCamera === 'function') {
        const res = originalSwitchCamera.call(this);
        if (res && typeof res.catch === 'function') {
          res.catch((err: any) => console.warn('[WebRTC] _switchCamera rejected:', err?.message || err));
        }
        return res;
      }
    } catch (err: any) {
      console.warn('[WebRTC] switchCamera sync exception suppressed:', err?.message || err);
    }
  };
}

export type CallStatus = 'IDLE' | 'CALLING' | 'INCOMING' | 'CONNECTING' | 'CONNECTED' | 'ENDED';
export type CallType = 'audio' | 'video';

export interface CallPeer {
  id: number | string;
  name: string;
  username?: string;
  avatar?: string;
}

interface CallContextType {
  callStatus: CallStatus;
  callType: CallType;
  callPeer: CallPeer | null;
  callId: string | null;
  isCaller: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  isSwitchingCamera: boolean;
  isMinimized: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (params: { toUserId: number | string; peerInfo: Partial<CallPeer>; type?: CallType }) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: (reason?: string) => void;
  endCall: (notifyPeer?: boolean) => void;
  cleanupCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  toggleMinimize: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const requestCallPermissions = async (type: CallType): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const hasAudio = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    let audioGranted = hasAudio;
    if (!hasAudio) {
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone Permission',
        message: 'This app needs access to your microphone to make audio and video calls.',
        buttonPositive: 'Allow',
      });
      audioGranted = res === PermissionsAndroid.RESULTS.GRANTED;
    }

    if (!audioGranted) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required to make and receive calls. Please enable microphone access in device settings.'
      );
      return false;
    }

    if (type === 'video') {
      const hasCamera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      let cameraGranted = hasCamera;
      if (!hasCamera) {
        const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to make video calls.',
          buttonPositive: 'Allow',
        });
        cameraGranted = res === PermissionsAndroid.RESULTS.GRANTED;
      }
      if (!cameraGranted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to make video calls. Please enable camera access in device settings.'
        );
        return false;
      }
    }

    return true;
  } catch (err) {
    console.warn('Error requesting permissions:', err);
    return false;
  }
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('IDLE');
  const [callType, setCallType] = useState<CallType>('audio');
  const [callPeer, setCallPeer] = useState<CallPeer | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [isCaller, setIsCaller] = useState(false);

  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const isSwitchingCameraRef = useRef(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [duration, setDuration] = useState(0);

  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const pendingOfferRef = useRef<any>(null);
  const isCallAcceptedRef = useRef(false);
  const isAcceptingCallRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const incomingOfferRef = useRef<any>(null);
  const callTimeoutRef = useRef<any>(null);
  const isVibratingRef = useRef(false);

  // Synchronous state refs to prevent stale closure race conditions
  const callStatusRef = useRef<CallStatus>(callStatus);
  callStatusRef.current = callStatus;

  const callPeerRef = useRef<CallPeer | null>(callPeer);
  callPeerRef.current = callPeer;

  const callIdRef = useRef<string | null>(callId);
  callIdRef.current = callId;

  const callTypeRef = useRef<CallType>(callType);
  callTypeRef.current = callType;

  const durationRef = useRef<number>(duration);
  durationRef.current = duration;

  localStreamRef.current = localStream;
  remoteStreamRef.current = remoteStream;

  const stopVibration = useCallback(() => {
    if (!isVibratingRef.current) return;
    isVibratingRef.current = false;
    try {
      Vibration.cancel();
    } catch {
      // Ignore vibration cancel errors on unsupported devices
    }
  }, []);

  const startVibration = useCallback(() => {
    try {
      Vibration.vibrate([500, 1000, 500, 1000], true);
      isVibratingRef.current = true;
    } catch {
      // Ignore vibration errors if permission or hardware is unavailable
    }
  }, []);

  const cleanupCall = useCallback(() => {
    stopVibration();

    isCallAcceptedRef.current = false;
    isAcceptingCallRef.current = false;
    pendingOfferRef.current = null;
    incomingOfferRef.current = null;
    pendingCandidatesRef.current = [];

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setDuration(0);
    durationRef.current = 0;
    setIsMuted(false);
    setIsVideoOff(false);
    setIsSpeakerOn(false);
    setIsFrontCamera(true);
    isSwitchingCameraRef.current = false;
    setIsSwitchingCamera(false);
    setIsMinimized(false);
    setIsCaller(false);
    setCallStatus('IDLE');
    callStatusRef.current = 'IDLE';
    setCallPeer(null);
    callPeerRef.current = null;
    setCallId(null);
    callIdRef.current = null;
  }, [stopVibration]);

  const endCall = useCallback(
    (notifyPeer = true) => {
      const socket = getSocket();
      const currentPeer = callPeerRef.current;
      const currentCallId = callIdRef.current;
      if (notifyPeer && socket?.connected) {
        socket.emit('call:end', {
          toUserId: currentPeer?.id || null,
          callId: currentCallId || null,
          duration: durationRef.current || 0,
        });
      }
      stopVibration();
      setCallStatus('ENDED');
      callStatusRef.current = 'ENDED';
      setTimeout(() => {
        cleanupCall();
        setCallStatus('IDLE');
        callStatusRef.current = 'IDLE';
        setCallPeer(null);
        callPeerRef.current = null;
        setCallId(null);
        callIdRef.current = null;
      }, 800);
    },
    [cleanupCall, stopVibration]
  );

  const createPeerConnection = useCallback(
    (targetUserId: number | string, currentCallId: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Handle remote stream tracks
      (pc as any).ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Handle ICE candidates
      (pc as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          const socket = getSocket();
          if (socket?.connected) {
            socket.emit('call:signal', {
              toUserId: targetUserId,
              callId: currentCallId,
              signal: {
                type: 'candidate',
                candidate: event.candidate,
              },
            });
          }
        }
      };

      const checkConnected = () => {
        const cState = pc.connectionState;
        const iceState = pc.iceConnectionState;
        if (cState === 'connected' || iceState === 'connected' || iceState === 'completed') {
          setCallStatus('CONNECTED');
          callStatusRef.current = 'CONNECTED';
          stopVibration();
          if (!timerIntervalRef.current) {
            setDuration(0);
            durationRef.current = 0;
            timerIntervalRef.current = setInterval(() => {
              setDuration((prev) => {
                durationRef.current = prev + 1;
                return prev + 1;
              });
            }, 1000);
          }
        } else if (cState === 'closed' || iceState === 'closed') {
          endCall(false);
        } else if (cState === 'failed' || iceState === 'failed') {
          endCall(false);
        } else if (cState === 'disconnected' || iceState === 'disconnected') {
          setTimeout(() => {
            if (pc.connectionState === 'disconnected' || pc.iceConnectionState === 'disconnected') {
              endCall(false);
            }
          }, 2500);
        }
      };

      (pc as any).onconnectionstatechange = checkConnected;
      (pc as any).oniceconnectionstatechange = checkConnected;

      return pc;
    },
    [endCall, stopVibration]
  );

  const handleSignal = useCallback(
    async (signal: any) => {
      const pc = pcRef.current;
      if (!pc) {
        if (signal.type === 'offer') {
          pendingOfferRef.current = signal;
          incomingOfferRef.current = signal;
        } else if (signal.type === 'candidate' && signal.candidate) {
          pendingCandidatesRef.current.push(signal.candidate);
        }
        return;
      }

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          while (pendingCandidatesRef.current.length > 0) {
            const c = pendingCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {
              console.warn('Error adding buffered candidate:', e);
            }
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const socket = getSocket();
          const targetPeer = callPeerRef.current;
          if (socket?.connected && targetPeer?.id) {
            socket.emit('call:signal', {
              toUserId: targetPeer.id,
              callId: callIdRef.current || '',
              signal: answer,
            });
          }
        } else if (signal.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            while (pendingCandidatesRef.current.length > 0) {
              const c = pendingCandidatesRef.current.shift();
              try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (e) {
                console.warn('Error adding buffered candidate:', e);
              }
            }
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            pendingCandidatesRef.current.push(signal.candidate);
          }
        }
      } catch (err) {
        console.warn('WebRTC Signaling Error:', err);
      }
    },
    []
  );

  const startCall = useCallback(
    async ({
      toUserId,
      peerInfo,
      type = 'audio',
    }: {
      toUserId: number | string;
      peerInfo: Partial<CallPeer>;
      type?: CallType;
    }) => {
      if (!toUserId) return;
      const currentAuthUser = useAuthStore.getState().user;
      const socket = getSocket(currentAuthUser?.id);
      if (!socket || !socket.connected) {
        Alert.alert('Connection Error', 'Chat server is connecting. Please try again in a moment.');
        return;
      }

      const hasPermissions = await requestCallPermissions(type);
      if (!hasPermissions) return;

      try {
        cleanupCall();
        const newCallId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setCallId(newCallId);
        callIdRef.current = newCallId;
        setCallType(type);
        callTypeRef.current = type;
        const peerObj = {
          id: toUserId,
          name: peerInfo?.name || 'User',
          username: peerInfo?.username || '',
          avatar: peerInfo?.avatar || '',
        };
        setCallPeer(peerObj);
        callPeerRef.current = peerObj;
        setIsCaller(true);
        setCallStatus('CALLING');
        callStatusRef.current = 'CALLING';

        // Capture local camera / microphone stream
        const mediaConstraints =
          type === 'video'
            ? { audio: true, video: { facingMode: 'user' } }
            : { audio: true };
        const stream = await mediaDevices.getUserMedia(mediaConstraints);
        setLocalStream(stream as any);

        const pc = createPeerConnection(toUserId, newCallId);
        stream.getTracks().forEach((track: any) => {
          pc.addTrack(track, stream as any);
        });

        const activeUser = useAuthStore.getState().user;
        const callerInfo = {
          id: activeUser?.id,
          name: activeUser?.name || activeUser?.username || 'Colleague',
          username: activeUser?.username || '',
          avatar: activeUser?.profile_photo || '',
        };

        socket.emit('call:initiate', {
          toUserId,
          callType: type,
          callerInfo,
          callId: newCallId,
        });

        // 45s ringing timeout
        callTimeoutRef.current = setTimeout(() => {
          Alert.alert('No Answer', 'The user did not answer the call.');
          endCall(true);
        }, 45000);
      } catch (err: any) {
        console.warn('Failed to initiate call:', err);
        cleanupCall();
        setCallStatus('IDLE');
        Alert.alert('Call Error', err?.message || 'Could not access camera or microphone.');
      }
    },
    [createPeerConnection, cleanupCall, endCall]
  );

  const rejectCall = useCallback(
    (reason = 'declined') => {
      stopVibration();
      const socket = getSocket();
      if (socket?.connected && callPeer?.id) {
        socket.emit('call:reject', {
          toUserId: callPeer.id,
          reason,
          callId,
        });
      }
      cleanupCall();
      setCallStatus('IDLE');
      setCallPeer(null);
      setCallId(null);
    },
    [callPeer, callId, cleanupCall, stopVibration]
  );

  const acceptCall = useCallback(async () => {
    if (isAcceptingCallRef.current || callStatusRef.current !== 'INCOMING') {
      return;
    }
    isAcceptingCallRef.current = true;
    isCallAcceptedRef.current = true;

    stopVibration();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Immediately switch status to CONNECTING so incoming modal closes and active screen opens
    setCallStatus('CONNECTING');
    callStatusRef.current = 'CONNECTING';

    const currentAuthUser = useAuthStore.getState().user;
    const socket = getSocket(currentAuthUser?.id);
    const targetPeer = callPeerRef.current;
    const currentCallId = callIdRef.current;
    const currentType = callTypeRef.current;

    if (!socket?.connected || !targetPeer?.id) {
      cleanupCall();
      setCallStatus('IDLE');
      return;
    }

    const hasPermissions = await requestCallPermissions(currentType);
    if (!hasPermissions) {
      rejectCall('permissions_denied');
      return;
    }

    try {
      const mediaConstraints =
        currentType === 'video'
          ? { audio: true, video: { facingMode: 'user' } }
          : { audio: true };
      const stream = await mediaDevices.getUserMedia(mediaConstraints);
      setLocalStream(stream as any);

      const pc = createPeerConnection(targetPeer.id, currentCallId || '');
      stream.getTracks().forEach((track: any) => {
        pc.addTrack(track, stream as any);
      });

      socket.emit('call:accept', {
        toUserId: targetPeer.id,
        callId: currentCallId,
        callType: currentType,
      });

      // If an offer was already buffered while answering/requesting permissions
      const bufferedOffer = pendingOfferRef.current || incomingOfferRef.current;
      if (bufferedOffer) {
        pendingOfferRef.current = null;
        incomingOfferRef.current = null;
        await handleSignal(bufferedOffer);
      }
    } catch (err: any) {
      console.warn('Failed to accept call:', err);
      cleanupCall();
      setCallStatus('IDLE');
      Alert.alert('Call Error', err?.message || 'Could not access camera or microphone.');
    }
  }, [
    createPeerConnection,
    cleanupCall,
    handleSignal,
    rejectCall,
    stopVibration,
  ]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, [localStream]);

  const toggleVideo = useCallback(async () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    } else if (callType === 'audio') {
      try {
        const hasCamera = await requestCallPermissions('video');
        if (!hasCamera) return;
        const videoStream = await mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        const newTrack = videoStream.getVideoTracks()[0];
        if (newTrack && pcRef.current) {
          pcRef.current.addTrack(newTrack, localStream);
          localStream.addTrack(newTrack);
          setCallType('video');
          setIsVideoOff(false);
        }
      } catch (err: any) {
        Alert.alert('Camera Error', err?.message || 'Could not turn on camera.');
      }
    }
  }, [localStream, callType]);

  const switchCamera = useCallback(async () => {
    if (isSwitchingCameraRef.current) return;
    if (callStatusRef.current !== 'CONNECTED') {
      console.log('Cannot switch camera: call is not connected yet.');
      return;
    }
    if (isVideoOff || !localStream) {
      console.log('Cannot switch camera: video is disabled or localStream is missing.');
      return;
    }

    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack || !videoTrack.enabled || videoTrack.readyState !== 'live') {
      console.log('Cannot switch camera: video track is not active.');
      return;
    }

    isSwitchingCameraRef.current = true;
    setIsSwitchingCamera(true);

    try {
      const currentFacing = isFrontCamera ? 'user' : 'environment';
      const targetFacing = currentFacing === 'user' ? 'environment' : 'user';

      if (typeof (videoTrack as any).applyConstraints === 'function') {
        await (videoTrack as any).applyConstraints({
          facingMode: targetFacing,
        });
        setIsFrontCamera(targetFacing === 'user');
      } else if (typeof (videoTrack as any)._switchCamera === 'function') {
        await (videoTrack as any)._switchCamera();
        setIsFrontCamera((prev) => !prev);
      }
    } catch (err: any) {
      console.warn('Could not switch camera:', err?.message || err);
    } finally {
      setTimeout(() => {
        isSwitchingCameraRef.current = false;
        setIsSwitchingCamera(false);
      }, 500);
    }
  }, [localStream, isVideoOff, isFrontCamera]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const user = useAuthStore((state) => state.user);

  // Listen for socket call events continuously without tearing down on every status change
  useEffect(() => {
    const socket = getSocket(user?.id);
    if (!socket) return;

    const handleIncoming = (data: any) => {
      if (callStatusRef.current !== 'IDLE') {
        socket.emit('call:reject', {
          toUserId: data.callerUserId,
          reason: 'busy',
          callId: data.callId,
        });
        return;
      }

      isCallAcceptedRef.current = false;
      isAcceptingCallRef.current = false;
      pendingOfferRef.current = null;
      incomingOfferRef.current = null;
      pendingCandidatesRef.current = [];

      setCallStatus('INCOMING');
      callStatusRef.current = 'INCOMING';
      setCallType(data.callType || 'audio');
      callTypeRef.current = data.callType || 'audio';
      setCallId(data.callId);
      callIdRef.current = data.callId;
      const peerObj = {
        id: data.callerUserId,
        name: data.callerInfo?.name || data.callerInfo?.username || 'Colleague',
        username: data.callerInfo?.username || '',
        avatar: data.callerInfo?.avatar || '',
      };
      setCallPeer(peerObj);
      callPeerRef.current = peerObj;

      startVibration();

      // Auto-decline after 40 seconds
      callTimeoutRef.current = setTimeout(() => {
        rejectCall('timeout');
      }, 40000);
    };

    const handleAccepted = async () => {
      stopVibration();
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      setCallStatus('CONNECTING');
      callStatusRef.current = 'CONNECTING';

      const pc = pcRef.current;
      const targetPeer = callPeerRef.current;
      if (pc && targetPeer?.id) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callTypeRef.current === 'video',
          });
          await pc.setLocalDescription(offer);
          socket.emit('call:signal', {
            toUserId: targetPeer.id,
            callId: callIdRef.current || '',
            signal: offer,
          });
        } catch (e) {
          console.warn('Failed to create offer:', e);
        }
      }
    };

    const handleSignalEvent = async (data: any) => {
      const signal = data?.signal;
      if (!signal) return;

      // If call is still incoming and user hasn't pressed Answer yet
      if (!isCallAcceptedRef.current && callStatusRef.current === 'INCOMING') {
        if (signal.type === 'offer') {
          pendingOfferRef.current = signal;
          incomingOfferRef.current = signal;
        } else if (signal.type === 'candidate' && signal.candidate) {
          pendingCandidatesRef.current.push(signal.candidate);
        }
        return;
      }

      // If call is answered or we are caller, but pc is still being initialized
      const pc = pcRef.current;
      if (!pc) {
        if (signal.type === 'offer') {
          pendingOfferRef.current = signal;
          incomingOfferRef.current = signal;
        } else if (signal.type === 'candidate' && signal.candidate) {
          pendingCandidatesRef.current.push(signal.candidate);
        }
        return;
      }

      // pc is ready: process signal immediately
      await handleSignal(signal);
    };

    const handleRejected = (data: any) => {
      stopVibration();
      const msg = data.reason === 'busy' ? 'User is busy on another call.' : 'Call declined.';
      Alert.alert('Call', msg);
      cleanupCall();
      setCallStatus('IDLE');
      callStatusRef.current = 'IDLE';
      setCallPeer(null);
      callPeerRef.current = null;
    };

    const handleUnavailable = (data: any) => {
      stopVibration();
      const msg = data.reason === 'busy' ? 'User is busy on another call.' : 'User is currently offline.';
      Alert.alert('Call Unavailable', msg);
      cleanupCall();
      setCallStatus('IDLE');
      callStatusRef.current = 'IDLE';
      setCallPeer(null);
      callPeerRef.current = null;
    };

    const handleEnded = () => {
      stopVibration();
      setCallStatus('ENDED');
      callStatusRef.current = 'ENDED';
      setTimeout(() => {
        cleanupCall();
        setCallStatus('IDLE');
        callStatusRef.current = 'IDLE';
        setCallPeer(null);
        callPeerRef.current = null;
      }, 800);
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:signal', handleSignalEvent);
    socket.on('call:rejected', handleRejected);
    socket.on('call:unavailable', handleUnavailable);
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:signal', handleSignalEvent);
      socket.off('call:rejected', handleRejected);
      socket.off('call:unavailable', handleUnavailable);
      socket.off('call:ended', handleEnded);
    };
  }, [
    user?.id,
    cleanupCall,
    handleSignal,
    rejectCall,
    startVibration,
    stopVibration,
  ]);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callType,
        callPeer,
        callId,
        isCaller,
        isMuted,
        isVideoOff,
        isSpeakerOn,
        isFrontCamera,
        isSwitchingCamera,
        isMinimized,
        duration,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        cleanupCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        toggleMinimize,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
