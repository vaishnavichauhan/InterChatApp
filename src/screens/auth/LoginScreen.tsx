import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppInput } from '../../components/common/AppInput';
import {
  UserIcon,
  LockIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '../../components/icons/SvgIcons';
import { loginUser } from '../../api/authApi';
import { getDeviceId } from '../../utils/device';
import { useAuthStore } from '../../store/authStore';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter both your username and password.');
      return;
    }

    try {
      setLoading(true);
      const deviceId = await getDeviceId();
      const response = await loginUser({
        username: username.trim(),
        password: password.trim(),
        deviceId,
      });

      if (!response.data.success) {
        if (response.data.status === 'DEVICE_REGISTRATION_REQUIRED') {
          navigation.navigate('DeviceRegistration', {
            username: username.trim(),
            password: password.trim(),
            deviceId,
          });
          return;
        }

        if (response.data.status === 'PENDING_APPROVAL') {
          navigation.navigate('PendingApproval', { deviceId });
          return;
        }

        Alert.alert('Login Failed', response.data.message || 'Invalid credentials');
        return;
      }

      const { user, token } = response.data;
      await login(user, token);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Unable to connect to the server.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const topInset = Math.max(insets.top, androidStatusHeight);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: topInset + 12, paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.topNavigation}>
          {navigation.canGoBack?.() ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, shadows.sm]}
              activeOpacity={0.7}
            >
              <ArrowLeftIcon size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
        </View>

        {/* Brand Hero Header: App Logo and "InterChat" */}
        <View style={styles.brandHeroContainer}>
          {/* Logo Badge with Aura */}
          <View style={styles.logoBadgeWrapper}>
            <View style={styles.logoAura} />
            <View style={[styles.logoTile, shadows.md]}>
              <Svg
                width={36}
                height={36}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                <Path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
              </Svg>
            </View>
          </View>

          {/* InterChat Branding */}
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitleText}>
              Inter<Text style={styles.brandTitleAccent}>Chat</Text>
            </Text>
            
          </View>
        </View>

        {/* Login Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSubtitle}>
            Please enter your credentials to access your workspace.
          </Text>

          <AppInput
            label="Username"
            placeholder="Write your username"
            value={username}
            onChangeText={setUsername}
            leftIcon={<UserIcon size={18} color={colors.textLight} />}
            autoCapitalize="none"
          />

          <AppInput
            label="Password"
            placeholder="Write your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<LockIcon size={18} color={colors.textLight} />}
          />

          <View style={styles.submitWrapper}>
            <TouchableOpacity
              style={[styles.signInButton, shadows.lg]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {/* SVG Gradient inside the pill button matching WelcomeScreen */}
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="loginBtnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#4f46e5" />
                    <Stop offset="50%" stopColor="#2563eb" />
                    <Stop offset="100%" stopColor="#06b6d4" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx={28} fill="url(#loginBtnGrad)" />
              </Svg>

              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.buttonInnerContent}>
                  <Text style={styles.signInButtonText}>Sign In</Text>
                  <View style={styles.arrowCircle}>
                    <ArrowRightIcon size={16} color="#2563eb" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-start',
  },
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    height: 40,
  },

  /* Brand Hero */
  brandHeroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoBadgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  logoAura: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0, 86, 207, 0.1)',
  },
  logoTile: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brandTitleText: {
    fontSize: 26,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  brandTitleAccent: {
    color: colors.primary,
  },
  enterprisePill: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  enterprisePillText: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: colors.primary,
    letterSpacing: 0.5,
  },

  /* Form Section */
  formCard: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  submitWrapper: {
    marginTop: spacing.lg,
  },
  signInButton: {
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
  signInButtonText: {
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
});

