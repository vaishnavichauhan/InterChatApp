import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { useCall } from '../../context/CallContext';
import { PhoneIcon, PhoneOffIcon, VideoIcon } from '../icons/SvgIcons';
import { fontSizes, fontWeights, borderRadius, spacing } from '../../theme';

export const IncomingCallModal: React.FC = () => {
  const { callStatus, callType, callPeer, acceptCall, rejectCall } = useCall();

  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const opacityAnim1 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim2 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (callStatus === 'INCOMING') {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 1.5,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim1, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim1, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(pulseAnim2, {
              toValue: 1.8,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(opacityAnim2, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim2, {
              toValue: 0.3,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      loop.start();

      return () => {
        loop.stop();
        pulseAnim1.setValue(1);
        pulseAnim2.setValue(1);
      };
    }
  }, [callStatus, pulseAnim1, pulseAnim2, opacityAnim1, opacityAnim2]);

  const [isAnswering, setIsAnswering] = React.useState(false);

  useEffect(() => {
    if (callStatus !== 'INCOMING') {
      setIsAnswering(false);
    }
  }, [callStatus]);

  const handleAnswer = async () => {
    if (isAnswering) return;
    setIsAnswering(true);
    await acceptCall();
  };

  if (callStatus !== 'INCOMING' || !callPeer) {
    return null;
  }

  const initials = (callPeer.name || 'U')
    .replace(/^[#@\s]+/, '')
    .trim()
    .substring(0, 2)
    .toUpperCase();

  const isVideo = callType === 'video';

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Ambient Glow */}
          <View style={styles.ambientGlow} />

          {/* Call Type Pill */}
          <View style={styles.typeBadge}>
            {isVideo ? (
              <VideoIcon size={14} color="#34D399" />
            ) : (
              <PhoneIcon size={14} color="#34D399" />
            )}
            <Text style={styles.typeBadgeText}>
              {isVideo ? 'Incoming Video Call' : 'Incoming Voice Call'}
            </Text>
          </View>

          {/* Caller Avatar with Animated Concentric Rings */}
          <View style={styles.avatarContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim2 }],
                  opacity: opacityAnim2,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim1 }],
                  opacity: opacityAnim1,
                },
              ]}
            />
            <View style={styles.avatarCircle}>
              {callPeer.avatar ? (
                <Image
                  source={{ uri: callPeer.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
          </View>

          {/* Caller Information */}
          <Text style={styles.callerName} numberOfLines={1}>
            {callPeer.name}
          </Text>
          {Boolean(callPeer.username) && (
            <Text style={styles.callerUsername} numberOfLines={1}>
              @{callPeer.username}
            </Text>
          )}

          <Text style={styles.ringingStatus}>Ringing...</Text>

          {/* Action Buttons: Decline & Accept */}
          <View style={styles.actionsRow}>
            {/* Decline Button */}
            <View style={styles.actionItem}>
              <TouchableOpacity
                style={styles.declineBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                onPress={() => rejectCall('declined')}
              >
                <PhoneOffIcon size={26} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Decline</Text>
            </View>

            {/* Answer Button */}
            <View style={styles.actionItem}>
              <TouchableOpacity
                style={[styles.acceptBtn, isAnswering && styles.acceptBtnDisabled]}
                activeOpacity={0.7}
                disabled={isAnswering}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                onPress={handleAnswer}
              >
                {isVideo ? (
                  <VideoIcon size={26} color="#FFFFFF" />
                ) : (
                  <PhoneIcon size={26} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <Text style={[styles.actionLabel, styles.acceptLabel]}>
                {isAnswering ? 'Connecting...' : 'Answer'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  ambientGlow: {
    position: 'absolute',
    top: -60,
    width: 200,
    height: 120,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 100,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    marginBottom: spacing.xl,
  },
  typeBadgeText: {
    color: '#34D399',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
  },
  callerName: {
    color: '#F8FAFC',
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  callerUsername: {
    color: '#94A3B8',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    marginTop: 2,
    textAlign: 'center',
  },
  ringingStatus: {
    color: '#34D399',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginTop: spacing.xxl,
  },
  actionItem: {
    alignItems: 'center',
  },
  declineBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  acceptBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  acceptBtnDisabled: {
    opacity: 0.6,
  },
  actionLabel: {
    color: '#94A3B8',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    marginTop: 8,
  },
  acceptLabel: {
    color: '#34D399',
    fontWeight: fontWeights.bold,
  },
});
