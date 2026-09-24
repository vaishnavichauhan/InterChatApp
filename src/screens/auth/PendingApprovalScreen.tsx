import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { getDeviceId } from '../../utils/device';

interface PendingApprovalScreenProps {
  route: any;
  navigation: any;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [deviceId, setDeviceId] = useState(route.params?.deviceId || '');

  useEffect(() => {
    if (!deviceId) {
      getDeviceId().then((id) => setDeviceId(id));
    }
  }, [deviceId]);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Approval Pending"
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
          {/* Centered Amber Authorization Badge with Ambient Aura */}
          <View style={styles.iconCircleWrapper}>
            <View style={styles.iconAura} />
            <View style={[styles.iconCircle, shadows.sm]}>
              <Svg
                width={34}
                height={34}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d97706"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Circle cx={12} cy={12} r={10} />
                <Path d="M12 6v6l4 2" />
              </Svg>
            </View>
          </View>

          <Text style={styles.title}>Awaiting Admin Approval</Text>
          <Text style={styles.subtitle}>
            Your device registration request has been submitted. Please wait for your company administrator to authorize this device before you can sign in.
          </Text>

          <View style={styles.deviceBox}>
            <Text style={styles.deviceLabel}>YOUR DEVICE SIGNATURE</Text>
            <Text style={styles.deviceIdText}>{deviceId || 'Loading device identifier...'}</Text>
          </View>

          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.backSignInButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.backSignInText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
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
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#fde68a',
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
    lineHeight: 21,
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  deviceBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  deviceLabel: {
    fontSize: 11,
    fontWeight: fontWeights.extrabold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  deviceIdText: {
    fontSize: 13.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.textPrimary,
    lineHeight: 19,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: spacing.xs,
  },
  backSignInButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSignInText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
});

