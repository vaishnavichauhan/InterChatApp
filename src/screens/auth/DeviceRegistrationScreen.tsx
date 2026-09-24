import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { LockIcon, ArrowRightIcon } from '../../components/icons/SvgIcons';
import { requestDeviceRegistration } from '../../api/authApi';

interface DeviceRegistrationScreenProps {
  route: any;
  navigation: any;
}

export const DeviceRegistrationScreen: React.FC<DeviceRegistrationScreenProps> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { username, password, deviceId } = route.params || {};

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password || !deviceId) {
      Alert.alert('Missing Info', 'Required authentication details are missing.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await requestDeviceRegistration({
        username,
        password,
        deviceId,
      });

      if (response.data.success || response.data.status === 'PENDING_APPROVAL') {
        navigation.navigate('PendingApproval', { deviceId });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit device for approval.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit device registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Device Verification"
        showBack
        rightAction
        onBack={() => navigation.navigate('Login')}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 28) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Centered Lock Badge with Ambient Aura */}
          <View style={styles.iconCircleWrapper}>
            <View style={styles.iconAura} />
            <View style={[styles.iconCircle, shadows.sm]}>
              <LockIcon size={28} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Register Device</Text>
          <Text style={styles.subtitle}>
            This mobile device needs administrator authorization before you can log into your workspace.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{username || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Device Signature</Text>
            <View style={styles.deviceSignatureBox}>
              <Text style={styles.deviceSignatureText} numberOfLines={2}>
                {deviceId || 'Resolving hardware signature...'}
              </Text>
            </View>
            <Text style={styles.hintText}>
              A unique persistent hardware signature generated for this installation.
            </Text>
          </View>

          {/* Submit Button styled identically to Auth gradient pill button */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[styles.submitButton, shadows.lg]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.88}
            >
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="regBtnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#4f46e5" />
                    <Stop offset="50%" stopColor="#2563eb" />
                    <Stop offset="100%" stopColor="#06b6d4" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx={28} fill="url(#regBtnGrad)" />
              </Svg>

              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.buttonInnerContent}>
                  <Text style={styles.submitButtonText}>Submit for Admin Approval</Text>
                  <View style={styles.arrowCircle}>
                    <ArrowRightIcon size={16} color="#2563eb" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  iconCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  iconAura: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0, 86, 207, 0.1)',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  fieldGroup: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  readOnlyBox: {
    height: 48,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  readOnlyText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  deviceSignatureBox: {
    minHeight: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    padding: spacing.md,
  },
  deviceSignatureText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLink: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
});

