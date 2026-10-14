import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  XMarkIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ShieldAlertIcon,
} from '../../components/icons/SvgIcons';
import { EpoxyHouseBrandLogo } from '../../components/common/EpoxyHouseBrandLogo';
import { changeFirstPassword } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

export const ChangeFirstPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout, updateSession, setLoginSuccessNotice } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Close action: directly logout and return to Login screen without alert popup
  const handleDirectClose = useCallback(async () => {
    if (loading || loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
    } catch (err) {
      console.error('Logout error on close:', err);
    } finally {
      setLoggingOut(false);
    }
  }, [loading, loggingOut, logout]);

  // Intercept Android hardware back button
  useEffect(() => {
    const backAction = () => {
      handleDirectClose();
      return true; // prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [handleDirectClose]);

  // Handle password submission
  const handleSubmit = async () => {
    setError(null);

    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanNew || !cleanConfirm) {
      setError('Please fill in both password fields.');
      return;
    }

    if (cleanNew.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (cleanNew.toLowerCase() === 'password123!') {
      setError('You cannot reuse the default password. Please choose a new, secure password.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('Passwords do not match. Please verify both inputs.');
      return;
    }

    setLoading(true);
    try {
      const res = await changeFirstPassword({
        newPassword: cleanNew,
        confirmPassword: cleanConfirm,
      });

      if (res.data?.success) {
        const updatedUser = {
          ...(user || {}),
          ...(res.data.user || {}),
          must_change_password: false,
        };

        const refreshedToken = res.data?.token || undefined;
        await updateSession(updatedUser, refreshedToken);

        setLoginSuccessNotice('Password successfully updated! Welcome to InterChat.');
      } else {
        setError(res.data?.message || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      console.error('Password update error:', err);
      const msg =
        err.response?.data?.message ||
        'An error occurred while updating your password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isFormReady =
    !loading &&
    !loggingOut &&
    newPassword.trim().length >= 6 &&
    confirmPassword.trim().length >= 6 &&
    newPassword.trim() === confirmPassword.trim() &&
    newPassword.trim().toLowerCase() !== 'password123!';

  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const topInset = Math.max(insets.top, androidStatusHeight);

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" />

      {/* ── Top Navigation Bar with Logo ── */}
      <View style={[styles.topBar, { paddingTop: topInset + 10 }]}>
        <View style={styles.topBarLogo}>
          <EpoxyHouseBrandLogo size="sm" variant="dark" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.centerWrapper}>
            <View style={[styles.card, shadows.lg]}>
              {/* ── Header Banner ── */}
              <View style={styles.headerBanner}>
                {/* SVG Gradient Background */}
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="firstPwdScrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#DC2626" />
                      <Stop offset="50%" stopColor="#E11D48" />
                      <Stop offset="100%" stopColor="#B91C1C" />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#firstPwdScrGrad)" />
                </Svg>

                {/* Shield Emblem */}
                <View style={styles.shieldIconWrap}>
                  <ShieldAlertIcon size={28} color="#ffffff" />
                </View>

                {/* Title */}
                <Text style={styles.headerTitle}>First-Time Password Change</Text>

                {/* Subtitle */}
                <Text style={styles.headerSubtitle}>
                  Welcome,{' '}
                  <Text style={styles.headerUserName}>
                    {user?.name || user?.username || 'Team Member'}
                  </Text>
                  . For your account security, you must replace your default password before accessing your chats.
                </Text>
              </View>

              {/* ── Form Body ── */}
              <View style={styles.formBody}>
                {/* Error Banner */}
                {error ? (
                  <View style={styles.errorBox}>
                    <View style={styles.errorIconWrap}>
                      <AlertCircleIcon size={16} color="#DC2626" />
                    </View>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* 1. New Password Input */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.inputLabel}>
                    NEW PASSWORD <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputLeftIcon}>
                      <LockIcon size={18} color={colors.primary} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter new password (min 6 chars)"
                      placeholderTextColor="#94a3b8"
                      value={newPassword}
                      onChangeText={(t) => {
                        setNewPassword(t);
                        if (error) setError(null);
                      }}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? (
                        <EyeIcon size={18} color={colors.primary} />
                      ) : (
                        <EyeOffIcon size={18} color="#94a3b8" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Confirm Password Input */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.inputLabel}>
                    RE-ENTER NEW PASSWORD <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputLeftIcon}>
                      <LockIcon size={18} color={colors.primary} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Re-type new password to confirm"
                      placeholderTextColor="#94a3b8"
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        if (error) setError(null);
                      }}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeIcon size={18} color={colors.primary} />
                      ) : (
                        <EyeOffIcon size={18} color="#94a3b8" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Real-time Match & Criteria Hint */}
                {newPassword.length > 0 && confirmPassword.length > 0 ? (
                  <View style={styles.matchHintRow}>
                    {newPassword === confirmPassword ? (
                      <View style={styles.matchSuccess}>
                        <CheckIcon size={14} color="#16A34A" />
                        <Text style={styles.matchSuccessText}>Passwords match perfectly</Text>
                      </View>
                    ) : (
                      <View style={styles.matchWarning}>
                        <AlertCircleIcon size={14} color="#D97706" />
                        <Text style={styles.matchWarningText}>Passwords do not match yet</Text>
                      </View>
                    )}
                  </View>
                ) : null}

                {/* Minimum characters notice if typed < 6 */}
                {newPassword.length > 0 && newPassword.length < 6 ? (
                  <Text style={styles.criteriaHint}>
                    • Password must be at least 6 characters ({newPassword.length}/6)
                  </Text>
                ) : null}

                {/* Submit Button */}
                <View style={styles.submitContainer}>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      shadows.md,
                      (!isFormReady || loading) && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!isFormReady || loading}
                    activeOpacity={0.88}
                  >
                    {/* Button SVG Gradient */}
                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                      <Defs>
                        <LinearGradient id="firstPwdScrBtnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <Stop
                            offset="0%"
                            stopColor={isFormReady ? colors.buttonGradientStart : '#94A3B8'}
                          />
                          <Stop
                            offset="100%"
                            stopColor={isFormReady ? colors.buttonGradientEnd : '#64748B'}
                          />
                        </LinearGradient>
                      </Defs>
                      <Rect width="100%" height="100%" rx={26} fill="url(#firstPwdScrBtnGrad)" />
                    </Svg>

                    {loading ? (
                      <View style={styles.buttonInner}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.submitButtonText}>Updating Password...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonInner}>
                        <Text style={styles.submitButtonText}>Set New Password &amp; Proceed</Text>
                        <View style={styles.arrowCircle}>
                          <ArrowRightIcon size={14} color={colors.buttonPrimary} />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Close button with close icon below Set New Password */}
                  <TouchableOpacity
                    style={styles.closeActionButton}
                    onPress={handleDirectClose}
                    disabled={loading || loggingOut}
                    activeOpacity={0.7}
                  >
                    {loggingOut ? (
                      <View style={styles.closeActionInner}>
                        <ActivityIndicator size="small" color="#DC2626" />
                        <Text style={styles.closeActionButtonText}>Returning to Login...</Text>
                      </View>
                    ) : (
                      <View style={styles.closeActionInner}>
                        <View style={styles.closeActionIconCircle}>
                          <XMarkIcon size={14} color="#DC2626" />
                        </View>
                        <Text style={styles.closeActionButtonText}>Close</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Mandatory Step Note */}
                <Text style={styles.mandatoryNote}>
                  Mandatory step: this screen cannot be skipped until a new password is set. Tapping Close will return to the login screen.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topBarLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  centerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },

  /* ── Header Banner ── */
  headerBanner: {
    backgroundColor: '#DC2626',
    width: '100%',
    paddingTop: spacing.xl,
    paddingBottom: 22,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shieldIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 4,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: fontSizes.xs,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
  },
  headerUserName: {
    fontWeight: fontWeights.bold,
    textDecorationLine: 'underline',
  },

  /* ── Form Body ── */
  formBody: {
    padding: spacing.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
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
    fontSize: fontSizes.xs,
    lineHeight: 17,
    color: '#DC2626',
    fontWeight: fontWeights.medium,
  },

  /* Input Fields */
  fieldContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#334155',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  asterisk: {
    color: '#DC2626',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputLeftIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: '#0F172A',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Match Hint */
  matchHintRow: {
    marginBottom: spacing.sm,
  },
  matchSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchSuccessText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: '#16A34A',
  },
  matchWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchWarningText: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    color: '#D97706',
  },
  criteriaHint: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: fontWeights.medium,
    marginBottom: spacing.sm,
  },

  /* Submit Button */
  submitContainer: {
    marginTop: spacing.sm,
  },
  submitButton: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Close Action Button */
  closeActionButton: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeActionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closeActionIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeActionButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#DC2626',
    letterSpacing: 0.2,
  },

  /* Mandatory Note */
  mandatoryNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing.md,
  },
});
