import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import {
  MessagesSquareIcon,
  UserIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BuildingIcon,
  LayersIcon,
} from '../../components/icons/SvgIcons';
import { useAuthStore } from '../../store/authStore';

interface UserHomeScreenProps {
  navigation: any;
}

export const UserHomeScreen: React.FC<UserHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  // Exact same proportions and organic curve as AdminDashboard
  const bannerHeight = 280;
  const curveLeftY = bannerHeight - 34;
  const curveRightY = bannerHeight - 64;
  const mainWavePath = `M 0 0 L ${width} 0 L ${width} ${curveRightY} C ${width * 0.70} ${curveRightY - 18}, ${width * 0.35} ${bannerHeight + 10}, 0 ${curveLeftY} Z`;
  const backWavePath = `M 0 0 L ${width} 0 L ${width} ${curveRightY + 22} C ${width * 0.68} ${curveRightY + 6}, ${width * 0.32} ${bannerHeight + 26}, 0 ${curveLeftY + 14} Z`;

  const departmentName = user?.departments?.[0]?.department_name || 'All Organization';
  const roleName = user?.user_type_name || (user?.role === 'admin' ? 'Admin' : 'Member');

  const actionList = [
    {
      id: 'chat',
      name: 'Team Channels & Chat',
      desc: 'Chat with coworkers, share photos and files, and participate in company broadcasts.',
      icon: MessagesSquareIcon,
      iconColor: colors.primary,
      bgColor: colors.primarySubtle,
      onPress: () => navigation.navigate('ChatTab'),
    },
    {
      id: 'profile',
      name: 'Your Profile & Security',
      desc: 'View authorized device status, contact details, and role permissions.',
      icon: UserIcon,
      iconColor: '#059669',
      bgColor: '#ecfdf5',
      onPress: () => navigation.navigate('ProfileTab'),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Welcome Banner: Edge-to-Edge Linear Gradient & Wave (Identical to Admin Dashboard) ── */}
        <View style={[styles.welcomeBanner, { height: bannerHeight, width }]}>
          <Svg
            width={width}
            height={bannerHeight + 30}
            viewBox={`0 0 ${width} ${bannerHeight + 30}`}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id="dashBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.heroGradientStart} />
                <Stop offset="50%" stopColor={colors.heroGradientMid} />
                <Stop offset="100%" stopColor={colors.heroGradientEnd} />
              </LinearGradient>
              <LinearGradient id="dashBackWave" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
                <Stop offset="100%" stopColor="rgba(255, 120, 126, 0.22)" />
              </LinearGradient>
            </Defs>
            {/* Depth back-wave */}
            <Path d={backWavePath} fill="url(#dashBackWave)" />
            {/* Main foreground wave */}
            <Path d={mainWavePath} fill="url(#dashBgGrad)" />
          </Svg>

          {/* Banner content */}
          <View style={styles.bannerContent}>
            {/* Top Row: App Logo + Username + Role */}
            <View style={styles.bannerUserRow}>
              <View style={styles.bannerAppIcon}>
                <MessagesSquareIcon size={20} color="#ffffff" />
              </View>
              <View style={styles.bannerUserInfo}>
                <Text style={styles.bannerUserName} numberOfLines={1}>
                  {user?.name || user?.username || 'Teammate'}
                </Text>
                <View style={styles.bannerRoleBadge}>
                  <View style={styles.bannerRoleDot} />
                  <Text style={styles.bannerRoleText}>
                    {roleName.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Greeting Heading */}
            <Text style={styles.bannerHeading}>
              Welcome back, {user?.name || user?.username || 'Teammate'}!
            </Text>

            {/* Subtitle */}
            <Text style={styles.bannerSubtitle}>
              Welcome to the InterChat collaboration suite. Access channels, media transfers, and profile details below.
            </Text>
          </View>
        </View>

        {/* ── 4 Status Cards (Matching Admin Dashboard KPI Grid) ── */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity
            style={[styles.kpiCard, shadows.sm]}
            onPress={() => navigation.navigate('ChatTab')}
            activeOpacity={0.7}
          >
            <View style={[styles.kpiIconWrap, { backgroundColor: '#e0efff' }]}>
              <MessagesSquareIcon size={20} color={colors.primary} />
            </View>
            <View style={styles.kpiTextCol}>
              <Text style={styles.kpiLabel}>TEAM CHAT</Text>
              <Text style={[styles.kpiValue, { color: colors.primary }]}>Active</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.kpiCard, shadows.sm]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#dcfce7' }]}>
              <ShieldCheckIcon size={20} color={colors.success} />
            </View>
            <View style={styles.kpiTextCol}>
              <Text style={styles.kpiLabel}>DEVICE STATUS</Text>
              <Text style={[styles.kpiValue, { color: colors.success }]}>Linked</Text>
            </View>
          </View>
        </View>

        {/* ── Collaboration Actions Section (Identical to Admin Dashboard Masters Section) ── */}
        <View style={styles.mastersSectionWrap}>
          <View style={styles.dropdownTitleRow}>
            <View style={styles.dropdownHeaderIconWrap}>
              <LayersIcon size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionHeader}>Workspace Collaboration Services</Text>
          </View>

          <View style={styles.dropdownMenuList}>
            {actionList.map((item) => {
              const ItemIcon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.masterCard, shadows.sm]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.masterIcon, { backgroundColor: item.bgColor }]}>
                    <ItemIcon size={22} color={item.iconColor} />
                  </View>
                  <View style={styles.masterMeta}>
                    <Text style={styles.masterTitle}>{item.name}</Text>
                    <Text style={styles.masterDesc}>{item.desc}</Text>
                  </View>
                  <ArrowRightIcon size={18} color={colors.textLight} />
                </TouchableOpacity>
              );
            })}
          </View>
       
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
    paddingTop: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
  },

  /* ── Welcome Banner: Full-bleed edge-to-edge (Matches Admin Dashboard) ── */
  welcomeBanner: {
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.lg,
    marginLeft: -spacing.lg,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  /* Top row: app icon + user info */
  bannerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.20)',
  },
  bannerAppIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerUserInfo: {
    justifyContent: 'center',
  },
  bannerUserName: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  bannerRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 5,
  },
  bannerRoleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  bannerRoleText: {
    fontSize: 10.5,
    fontWeight: fontWeights.extrabold,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },

  /* Greeting text */
  bannerHeading: {
    fontSize: 20,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: 26,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13.5,
    fontWeight: fontWeights.medium,
    color: 'rgba(255, 255, 255, 0.90)',
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 10,
  },

  /* ── 4 KPI Status Cards Grid ── */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiIconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  kpiTextCol: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    marginTop: 2,
  },

  /* ── Collaboration Actions Section (Matches Admin Dashboard Masters) ── */
  mastersSectionWrap: {
    marginBottom: spacing.xl,
  },
  dropdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
    flex: 1,
  },
  dropdownHeaderIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#e0efff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionHeader: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  dropdownMenuList: {
    marginTop: 2,
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  masterIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  masterMeta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  masterTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  masterDesc: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
