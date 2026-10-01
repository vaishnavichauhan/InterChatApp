import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { CheckIcon } from '../icons/SvgIcons';
import { fontSizes, fontWeights, shadows } from '../../theme';

export const ToastBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const notice = useAuthStore((state) => state.loginSuccessNotice);
  const setNotice = useAuthStore((state) => state.setLoginSuccessNotice);

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!notice) return;

    // Slide down and fade in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      dismiss();
    }, 3200);

    return () => clearTimeout(timer);
  }, [notice]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNotice(null);
    });
  };

  if (!notice) return null;

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 20) + 8;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toastCard, shadows.md]}
        onPress={dismiss}
        activeOpacity={0.9}
      >
        <Animated.View style={styles.iconCircle}>
          <CheckIcon size={14} color="#ffffff" />
        </Animated.View>
        <Text style={styles.toastText}>{notice}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 10,
    maxWidth: '92%',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});
