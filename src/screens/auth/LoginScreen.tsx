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
              Enter your enterprise credentials to access your channels and chat messages.
            </Text>

            <AppInput
              label="Username"
              placeholder="Write your username"
              value={username}
              onChangeText={setUsername}
              leftIcon={<UserIcon size={18} color={colors.primary} />}
              autoCapitalize="none"
            />

            <AppInput
              label="Password"
              placeholder="Write your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<LockIcon size={18} color={colors.primary} />}
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
                      <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                      <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
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
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
});

