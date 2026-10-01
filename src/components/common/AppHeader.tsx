import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { ArrowLeftIcon } from '../icons/SvgIcons';
import { useAuthStore } from '../../store/authStore';
import { EpoxyHouseBrandLogo } from './EpoxyHouseBrandLogo';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showLogo?: boolean;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode | boolean;
  showUserInfo?: boolean;
  onPressUser?: () => void;
  titleAlign?: 'center' | 'left';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  showLogo = false,
  leftAction,
  rightAction,
  showUserInfo,
  onPressUser,
  titleAlign = 'center',
}) => {
  const insets = useSafeAreaInsets();
  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const topInset = Math.max(insets.top, androidStatusHeight);

  const user = useAuthStore((state) => state.user);
  const displayUserInfo = showUserInfo ?? (!title && !showBack && !showLogo && !leftAction);

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
            <Image
              source={require('../../assets/epoxy-emblem.png')}
              style={styles.headerEmblemImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.userInfoCol}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.userRoleRow}>
              <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
                <Text style={[styles.roleBadgeText, isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextUser]}>
                  {roleDisplay}
                </Text>
              </View>
            </View>
          </View>
        </UserContainer>
      ) : (
        <>
          {/* Left Action: Back Button, Custom Left, Brand Logo, or Emblem */}
          <View style={styles.leftActionArea}>
            {showBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ArrowLeftIcon size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : leftAction ? (
              leftAction
            ) : showLogo ? (
              <EpoxyHouseBrandLogo size="sm" variant="dark" />
            ) : (
              <View style={styles.logoBadge}>
                <Image
                  source={require('../../assets/epoxy-emblem.png')}
                  style={styles.headerEmblemImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>

          {/* Title Area (Centered or Left-aligned) */}
          {title ? (
            <View
              style={[
                styles.titleCenterContainer,
                { top: topInset, height: 58 },
                titleAlign === 'left'
                  ? [
                      styles.titleLeftContainer,
                      {
                        left: showBack || leftAction || showLogo ? 58 : 16,
                        right: React.isValidElement(rightAction) ? 125 : 40,
                      },
                    ]
                  : React.isValidElement(rightAction) && styles.titleWithRightAction,
              ]}
              pointerEvents="box-none"
            >
              <Text
                style={[
                  styles.customTitle,
                  titleAlign === 'left' && styles.customTitleLeft,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitleText,
                    titleAlign === 'left' && styles.subtitleTextLeft,
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : !showLogo && !leftAction ? (
            <View
              style={[styles.titleCenterContainer, { top: topInset, height: 58 }]}
              pointerEvents="box-none"
            >
              <View style={styles.brandRow}>
                <Text style={styles.brandTitle}>
                  Inter<Text style={styles.brandAccent}>Chat</Text>
                </Text>
                <View style={styles.enterprisePill}>
                  <Text style={styles.enterpriseText}>ENTERPRISE</Text>
                </View>
              </View>
              {subtitle ? (
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      {/* Right Area */}
      <View style={styles.rightContainer}>
        {React.isValidElement(rightAction) ? (
          rightAction
        ) : typeof rightAction === 'boolean' && rightAction ? (
          <View style={styles.rightPlaceholder} />
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
    position: 'relative',
  },
  leftActionArea: {
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  titleCenterContainer: {
    position: 'absolute',
    left: 56,
    right: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  titleLeftContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  customTitleLeft: {
    textAlign: 'left',
  },
  subtitleTextLeft: {
    textAlign: 'left',
  },
  titleWithRightAction: {
    left: 48,
    right: 120,
    alignItems: 'center',
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
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  rightContainer: {
    minWidth: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  rightPlaceholder: {
    width: 36,
    height: 36,
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
  headerEmblemImage: {
    width: 24,
    height: 24,
  },
  interchatIconBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: '#fef2f2',
    borderBottomColor: '#fca5a5',
  },
  roleBadgeUser: {
    backgroundColor: '#f0fdf4',
    borderBottomColor: '#bbf7d0',
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleDotAdmin: {
    backgroundColor: colors.primary,
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
    color: colors.primary,
  },
  roleBadgeTextUser: {
    color: '#16a34a',
  },
});

