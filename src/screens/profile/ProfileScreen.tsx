import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { AppAvatar } from '../../components/common/AppAvatar';
import { AppBadge } from '../../components/common/AppBadge';
import { LogOutIcon, ShieldCheckIcon } from '../../components/icons/SvgIcons';
import { useAuthStore } from '../../store/authStore';
import { updateProfile } from '../../api/authApi';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, deviceId, logout, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobNo, setMobNo] = useState(user?.mob_no || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const res = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        mob_no: mobNo.trim(),
      });

      if (res.data?.user) {
        await updateUser(res.data.user);
      }
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Your Profile"
        rightAction={
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LogOutIcon size={16} color={colors.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {/* User Card */}
        <View style={[styles.profileCard, shadows.sm]}>
          <AppAvatar name={user?.name || user?.username} size={64} />
          <Text style={styles.userName}>{user?.name || user?.username}</Text>
          <Text style={styles.userUsername}>@{user?.username}</Text>

          <View style={styles.badgeRow}>
            <AppBadge
              label={user?.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'TEAM MEMBER'}
              variant={user?.role === 'admin' ? 'broadcast' : 'primary'}
            />
            {user?.user_type_name && (
              <AppBadge label={user.user_type_name} variant="success" />
            )}
          </View>
        </View>

        {/* Security & Device Box */}
        <View style={[styles.securityCard, shadows.sm]}>
          <View style={styles.securityHeader}>
            <ShieldCheckIcon size={20} color={colors.success} />
            <Text style={styles.securityTitle}>Authorized Hardware Device</Text>
          </View>
          <Text style={styles.deviceSignature} numberOfLines={2}>
            {deviceId || 'Signature Verified'}
          </Text>
          <Text style={styles.securityHint}>
            This phone is cryptographically matched and authorized with enterprise access.
          </Text>
        </View>

        {/* Edit Form */}
        <View style={[styles.formCard, shadows.sm]}>
          <Text style={styles.formHeader}>Edit Personal Information</Text>

          <AppInput
            label="Full Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
          />

          <AppInput
            label="Email Address"
            placeholder="name@company.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <AppInput
            label="Mobile Number"
            placeholder="+91 9876543210"
            value={mobNo}
            onChangeText={setMobNo}
            keyboardType="phone-pad"
          />

          <AppButton
            title="Save Profile"
            onPress={handleUpdate}
            loading={saving}
            size="md"
            style={{ marginTop: spacing.xs }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.lg,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dangerBg,
    gap: 4,
  },
  logoutText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    color: colors.danger,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  userName: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  userUsername: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  securityCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  securityTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  deviceSignature: {
    fontSize: fontSizes.tiny,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  securityHint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formHeader: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
});
