import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCall } from '../../context/CallContext';
import { MaximizeIcon, PhoneOffIcon, VideoIcon, PhoneIcon } from '../icons/SvgIcons';
import { fontSizes, fontWeights, borderRadius, spacing } from '../../theme';

export const MinimizedCallBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    callStatus,
    callType,
    callPeer,
    isMinimized,
    duration,
    toggleMinimize,
    endCall,
  } = useCall();

  const isVisible =
    isMinimized &&
    callPeer &&
    (callStatus === 'CALLING' ||
      callStatus === 'CONNECTING' ||
      callStatus === 'CONNECTED' ||
      callStatus === 'ENDED');

  if (!isVisible || !callPeer) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(mins)}:${pad(secs)}`;
  };

  const initials = (callPeer.name || 'U')
    .replace(/^[#@\s]+/, '')
    .trim()
    .substring(0, 2)
    .toUpperCase();

  const isConnected = callStatus === 'CONNECTED';
  const isVideo = callType === 'video';
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);

  return (
    <View style={[styles.wrapper, { top: topInset + 8 }]}>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.9}
        onPress={toggleMinimize}
      >
        {/* Peer Avatar & Status Indicator */}
        <View style={styles.avatarWrap}>
          {callPeer.avatar ? (
            <Image source={{ uri: callPeer.avatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitialText}>{initials}</Text>
            </View>
          )}
          <View style={[styles.dotIndicator, isConnected && styles.dotConnected]} />
        </View>

        {/* Call Info */}
        <View style={styles.infoCol}>
          <Text style={styles.peerNameText} numberOfLines={1}>
            {callPeer.name}
          </Text>
          <View style={styles.statusRow}>
            {isVideo ? (
              <VideoIcon size={12} color="#34D399" />
            ) : (
              <PhoneIcon size={12} color="#34D399" />
            )}
            <Text style={styles.statusDurationText}>
              {isConnected
                ? formatDuration(duration)
                : callStatus === 'CONNECTING'
                ? 'Connecting...'
                : 'Calling...'}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.maximizeBtn}
            onPress={toggleMinimize}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaximizeIcon size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hangupBtn}
            onPress={() => endCall(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <PhoneOffIcon size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  container: {
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  dotIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  dotConnected: {
    backgroundColor: '#10B981',
  },
  infoCol: {
    flex: 1,
  },
  peerNameText: {
    color: '#FFFFFF',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDurationText: {
    color: '#34D399',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maximizeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangupBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
