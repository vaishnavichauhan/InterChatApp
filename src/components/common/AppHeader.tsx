import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { MessagesSquareIcon, ArrowLeftIcon } from '../icons/SvgIcons';
import { useAuthStore } from '../../store/authStore';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showUserInfo?: boolean;
  onPressUser?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  showUserInfo,
  onPressUser,
}) => {
  const insets = useSafeAreaInsets();
  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const topInset = Math.max(insets.top, androidStatusHeight);

  const user = useAuthStore((state) => state.user);
  const displayUserInfo = showUserInfo ?? (!title && !showBack);

  const isAdmin = user?.role === 'admin' || user?.username?.toLowerCase() === 'admin';
  const displayName = user?.name || user?.username || 'User';
  const roleDisplay = (
    user?.user_type_name ||
    (isAdmin ? 'Admin' : (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member'))
  ).toUpperCase();

  const UserContainer = onPressUser ? TouchableOpacity : View;
  const userContainerProps = onPressUser
    ? { onPress: onPressUser, activeOpacity: 0.7 }
    : {};

  return (
    <View style={[styles.container, { paddingTop: topInset, height: 58 + topInset }]}>
      {displayUserInfo ? (
        <UserContainer {...(userContainerProps as any)} style={styles.userHeaderLeft}>
          <View style={styles.interchatIconBadge}>
            <MessagesSquareIcon size={20} color="#ffffff" />
          </View>
          <View style={styles.userInfoCol}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.userRoleRow}>
              <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
                {/* <View style={[styles.roleDot, isAdmin ? styles.roleDotAdmin : styles.roleDotUser]} /> */}
                <Text style={[styles.roleBadgeText, isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextUser]}>
                  {roleDisplay}
                </Text>
              </View>
            </View>
          </View>
        </UserContainer>
      ) : (
        <View style={styles.leftContainer}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeftIcon size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoBadge}>
              <MessagesSquareIcon size={18} color="#ffffff" />
            </View>
          )}

          <View style={styles.titleWrapper}>
            {title ? (
              <Text style={styles.customTitle} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <View style={styles.brandRow}>
                <Text style={styles.brandTitle}>
                  Inter<Text style={styles.brandAccent}>Chat</Text>
                </Text>
                <View style={styles.enterprisePill}>
                  <Text style={styles.enterpriseText}>ENTERPRISE</Text>
                </View>
              </View>
            )}

            {subtitle ? (
              <Text style={styles.subtitleText} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.rightContainer}>
        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.statusPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>LIVE</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleWrapper: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: colors.primary,
  },
  enterprisePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.primarySubtle,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    marginLeft: spacing.xs,
  },
  enterpriseText: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  customTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  subtitleText: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    marginTop: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  userHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  interchatIconBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfoCol: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  userRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: borderRadius.xs,
    borderBottomWidth: 2,
    gap: 4,
  },
  roleBadgeAdmin: {
    borderBottomColor: '#bfdbfe',
  },
  roleBadgeUser: {
    borderBottomColor: '#bbf7d0',
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleDotAdmin: {
    backgroundColor: '#0056cf',
  },
  roleDotUser: {
    backgroundColor: '#16a34a',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    letterSpacing: 0.4,
  },
  roleBadgeTextAdmin: {
    color: '#0056cf',
  },
  roleBadgeTextUser: {
    color: '#16a34a',
  },
});

