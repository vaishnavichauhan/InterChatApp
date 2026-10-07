import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RTCView } from 'react-native-webrtc';
import { useCall } from '../../context/CallContext';
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  SwitchCameraIcon,
  PhoneOffIcon,
  MinimizeIcon,
} from '../icons/SvgIcons';
import { fontSizes, fontWeights, borderRadius, spacing } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ActiveCallModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    callStatus,
    callType,
    callPeer,
    isMuted,
    isVideoOff,
    isFrontCamera,
    isSwitchingCamera,
    isMinimized,
    duration,
    localStream,
    remoteStream,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    toggleMinimize,
  } = useCall();

  const isVisible =
    (callStatus === 'CALLING' ||
      callStatus === 'CONNECTING' ||
      callStatus === 'CONNECTED' ||
      callStatus === 'ENDED') &&
    !isMinimized;

  const isConnected = callStatus === 'CONNECTED';
  const isVideo = callType === 'video';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${pad(hrs)}:${pad(remMins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const hasRemoteVideoTrack = useMemo(() => {
    if (!remoteStream) return false;
    const tracks = remoteStream.getVideoTracks();
    return tracks.length > 0 && tracks[0].enabled;
  }, [remoteStream]);

  if (!isVisible || !callPeer) {
    return null;
  }

  const initials = (callPeer.name || 'U')
    .replace(/^[#@\s]+/, '')
    .trim()
    .substring(0, 2)
    .toUpperCase();

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);
  const bottomInset = Math.max(insets.bottom, 20);

  return (
    <Modal
      visible={true}
      transparent={false}
      animationType="slide"
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* VIDEO MODE */}
        {isVideo ? (
          <View style={StyleSheet.absoluteFill}>
            {/* Remote Video Stream if connected */}
            {hasRemoteVideoTrack && remoteStream ? (
              <RTCView
                streamURL={remoteStream.toURL()}
                style={styles.fullVideo}
                objectFit="cover"
                mirror={false}
                zOrder={0}
              />
            ) : (
              /* Fallback / Connecting State */
              <View style={styles.videoConnectingContainer}>
                <View style={styles.ambientVoiceGlow} />
                <View style={styles.avatarCircleLarge}>
                  {callPeer.avatar ? (
                    <Image
                      source={{ uri: callPeer.avatar }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarInitialsLarge}>{initials}</Text>
                  )}
                </View>
                <Text style={styles.peerName}>{callPeer.name}</Text>
                <Text style={styles.connectingStatus}>
                  {isConnected
                    ? 'Waiting for video stream...'
                    : callStatus === 'CONNECTING'
                    ? 'Connecting...'
                    : 'Calling...'}
                </Text>
              </View>
            )}

            {/* Local Video Picture-in-Picture Preview */}
            <View style={[styles.pipContainer, { top: topInset + 60 }]}>
              {localStream && !isVideoOff ? (
                <RTCView
                  streamURL={localStream.toURL()}
                  style={styles.pipVideo}
                  objectFit="cover"
                  mirror={isFrontCamera}
                  zOrder={1}
                />
              ) : (
                <View style={styles.pipOffState}>
                  <VideoOffIcon size={18} color="#94A3B8" />
                  <Text style={styles.pipOffText}>Camera off</Text>
                </View>
              )}
              <View style={styles.pipBadge}>
                <Text style={styles.pipBadgeText}>You</Text>
              </View>
            </View>
          </View>
        ) : (
          /* VOICE MODE */
          <View style={styles.voiceContainer}>
            <View style={styles.ambientVoiceGlow} />

            <View style={styles.avatarVoiceWrap}>
              <View style={styles.avatarCircleLarge}>
                {callPeer.avatar ? (
                  <Image
                    source={{ uri: callPeer.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitialsLarge}>{initials}</Text>
                )}
              </View>
            </View>

            <Text style={styles.peerNameLarge}>{callPeer.name}</Text>
            {Boolean(callPeer.username) && (
              <Text style={styles.peerUsername}>@{callPeer.username}</Text>
            )}

            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>
                {callStatus === 'ENDED'
                  ? 'Call ended'
                  : isConnected
                  ? formatDuration(duration)
                  : callStatus === 'CONNECTING'
                  ? 'Connecting...'
                  : 'Calling...'}
              </Text>
            </View>
          </View>
        )}

        {/* Top Header Bar Overlay */}
        <View style={[styles.topHeader, { paddingTop: topInset + 10 }]}>
          <TouchableOpacity
            style={styles.iconBtnHeader}
            onPress={toggleMinimize}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MinimizeIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTypePill}>
              {isVideo ? '📹 Video Call' : '📞 Voice Call'}
            </Text>
            {isVideo && isConnected && (
              <Text style={styles.headerDuration}>{formatDuration(duration)}</Text>
            )}
          </View>

          <View style={styles.iconBtnHeaderSpacer} />
        </View>

        {/* Bottom Call Controls Bar */}
        <View style={[styles.controlsBar, { paddingBottom: bottomInset + 10 }]}>
          {/* Mute Mic */}
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActiveAlert]}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            {isMuted ? (
              <MicOffIcon size={22} color="#EF4444" />
            ) : (
              <MicIcon size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Toggle Camera */}
          <TouchableOpacity
            style={[styles.controlBtn, isVideoOff && styles.controlBtnActiveAlert]}
            onPress={toggleVideo}
            activeOpacity={0.8}
          >
            {isVideoOff ? (
              <VideoOffIcon size={22} color="#EF4444" />
            ) : (
              <VideoIcon size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Switch Front/Rear Camera (Video Call Only) */}
          {isVideo && (
            <TouchableOpacity
              style={[
                styles.controlBtn,
                (isVideoOff || isSwitchingCamera || !isConnected) && styles.controlBtnDisabled,
              ]}
              onPress={switchCamera}
              disabled={isVideoOff || isSwitchingCamera || !isConnected}
              activeOpacity={0.8}
            >
              <SwitchCameraIcon
                size={22}
                color={isVideoOff || isSwitchingCamera || !isConnected ? '#64748B' : '#FFFFFF'}
              />
            </TouchableOpacity>
          )}

          {/* Hang Up / End Call */}
          <TouchableOpacity
            style={styles.endCallBtn}
            onPress={() => endCall(true)}
            activeOpacity={0.8}
          >
            <PhoneOffIcon size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  fullVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoConnectingContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  ambientVoiceGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  pipContainer: {
    position: 'absolute',
    right: 16,
    width: 105,
    height: 155,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 10,
  },
  pipVideo: {
    width: '100%',
    height: '100%',
  },
  pipOffState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    gap: 6,
  },
  pipOffText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: fontWeights.medium,
  },
  pipBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pipBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 9,
    fontWeight: fontWeights.semibold,
  },
  voiceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  avatarVoiceWrap: {
    marginBottom: spacing.lg,
  },
  avatarCircleLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsLarge: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: fontWeights.bold,
  },
  peerName: {
    color: '#F8FAFC',
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    marginTop: spacing.md,
  },
  peerNameLarge: {
    color: '#F8FAFC',
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  peerUsername: {
    color: '#94A3B8',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    marginTop: 2,
  },
  connectingStatus: {
    color: '#94A3B8',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    marginTop: spacing.xs,
  },
  timerBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
  },
  timerText: {
    color: '#34D399',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 20,
  },
  iconBtnHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnHeaderSpacer: {
    width: 40,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTypePill: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerDuration: {
    color: '#34D399',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: 'rgba(10, 15, 29, 0.85)',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 20,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  controlBtnActiveAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  controlBtnDisabled: {
    opacity: 0.4,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  endCallBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});
