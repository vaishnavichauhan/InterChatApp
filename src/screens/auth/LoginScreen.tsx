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
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppInput } from '../../components/common/AppInput';
import {
  UserIcon,
  LockIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckIcon,
} from '../../components/icons/SvgIcons';
import { loginUser } from '../../api/authApi';
import { getDeviceId } from '../../utils/device';
import { useAuthStore } from '../../store/authStore';
import { EpoxyHouseBrandLogo } from '../../components/common/EpoxyHouseBrandLogo';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((state) => state.login);
  const setLoginSuccessNotice = useAuthStore((state) => state.setLoginSuccessNotice);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    // Clear previous feedback
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both your username and password.');
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

        setErrorMessage(response.data.message || 'Invalid username or password.');
        return;
      }

      const { user, token } = response.data;
      setSuccessMessage('Sign in successfully');
      setLoginSuccessNotice('Sign in successfully');

      // Brief smooth transition before navigating to main screen
      setTimeout(async () => {
        await login(user, token);
      }, 500);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Unable to connect to the server.';
      setErrorMessage(msg);
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
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Top Navigation Bar ── */}
        <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
          {navigation.canGoBack?.() ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeftIcon size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
        </View>

        {/* ── Only Logo at Top ── */}
        <View style={styles.logoContainer}>
          <EpoxyHouseBrandLogo size="lg" variant="dark" />
        </View>

        {/* ── Login Form Card ── */}
        <View style={styles.formContainer}>
          <View style={[styles.formCard, shadows.sm]}>
            <View style={styles.formTitleRow}>
              <View style={styles.titleAccentBar} />
              <Text style={styles.formTitle}>Welcome Back</Text>
            </View>
            <Text style={styles.formSubtitle}>
              Enter your credentials to access your Chats and Groups messages.
            </Text>

            <AppInput
              label="Username"
              placeholder="Write your username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errorMessage) setErrorMessage(null);
              }}
              leftIcon={<UserIcon size={18} color={colors.primary} />}
              autoCapitalize="none"
            />

            <AppInput
              label="Password"
              placeholder="Write your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              isPassword
              leftIcon={<LockIcon size={18} color={colors.primary} />}
            />

            {/* Error Message banner above Sign In button */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <View style={styles.errorIconWrap}>
                  <AlertCircleIcon size={16} color="#DC2626" />
                </View>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Success Message banner above Sign In button */}
            {successMessage ? (
              <View style={styles.successBox}>
                <View style={styles.successIconWrap}>
                  <CheckIcon size={14} color="#15803D" />
                </View>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <View style={styles.submitWrapper}>
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  shadows.lg,
                  (loading || !!successMessage) && { opacity: 0.92 },
                ]}
                onPress={handleLogin}
                disabled={loading || !!successMessage}
                activeOpacity={0.88}
              >
                {/* SVG Gradient inside the pill button matching WelcomeScreen */}
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="loginBtnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop
                        offset="0%"
                        stopColor={successMessage ? '#16A34A' : colors.buttonGradientStart}
                      />
                      <Stop
                        offset="100%"
                        stopColor={successMessage ? '#15803D' : colors.buttonGradientEnd}
                      />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" rx={28} fill="url(#loginBtnGrad)" />
                </Svg>

                {loading ? (
                  <View style={styles.buttonInnerContent}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.signInButtonText}>Signing In...</Text>
                  </View>
                ) : successMessage ? (
                  <View style={styles.buttonInnerContent}>
                    <CheckIcon size={18} color="#ffffff" />
                    <Text style={styles.signInButtonText}>Signed In!</Text>
                  </View>
                ) : (
                  <View style={styles.buttonInnerContent}>
                    <Text style={styles.signInButtonText}>Sign In</Text>
                    <View style={styles.arrowCircle}>
                      <ArrowRightIcon size={16} color={colors.buttonPrimary} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonPlaceholder: {
    height: 38,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  /* Form Section */
  formContainer: {
    paddingHorizontal: spacing.lg,
  },
  formCard: {
    // backgroundColor: '#ffffff',
    // borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    // borderWidth: 0.4,
    // borderColor: '#e8e8e8',
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  titleAccentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  formTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
  },
  formSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  submitWrapper: {
    marginTop: spacing.md,
  },
  signInButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: spacing.md,
    gap: 8,
  },
  errorIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#DC2626',
    fontWeight: fontWeights.medium,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: spacing.md,
    gap: 8,
  },
  successIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#15803D',
    fontWeight: fontWeights.semibold,
  },
});


