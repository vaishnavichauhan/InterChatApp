import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import {
  UsersIcon,
  ShieldCheckIcon,
  MobileIcon,
  BuildingIcon,
  MessagesSquareIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CloudIcon,
  LayersIcon,
} from '../../components/icons/SvgIcons';
import { getDashboardStats } from '../../api/adminApi';
import { useAuthStore } from '../../store/authStore';

interface AdminDashboardScreenProps {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMastersOpen, setIsMastersOpen] = useState(true);

  // Banner height — same proportions as WelcomeScreen upper section
  const bannerHeight = 300;
  const curveLeftY  = bannerHeight - 38;
  const curveRightY = bannerHeight - 72;
  const mainWavePath = `M 0 0 L ${width} 0 L ${width} ${curveRightY} C ${width * 0.70} ${curveRightY - 20}, ${width * 0.35} ${bannerHeight + 10}, 0 ${curveLeftY} Z`;
  const backWavePath = `M 0 0 L ${width} 0 L ${width} ${curveRightY + 24} C ${width * 0.68} ${curveRightY + 6}, ${width * 0.32} ${bannerHeight + 28}, 0 ${curveLeftY + 16} Z`;

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      if (res.data?.success && res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalUsers = stats?.users?.total ?? '—';
  const activeUsers = stats?.users?.active ?? '—';
  const pendingDevices = stats?.devices?.pending ?? 0;
  const totalUserTypes = stats?.userTypes?.totalTypes ?? stats?.userTypes?.distribution?.length ?? '—';

  // Master items dropdown list (Same list as Frontend Navbar)
  const masterList = [
    {
      id: 'department',
      name: 'Department Master',
      desc: 'Manage departments & organizational units',
      icon: BuildingIcon,
      iconColor: '#2563eb',
      bgColor: '#eff6ff',
      onPress: () => navigation.navigate('DepartmentMaster'),
    },
    {
      id: 'user',
      name: 'User Master',
      desc: 'Manage user profiles & account statuses',
      icon: UsersIcon,
      iconColor: '#059669',
      bgColor: '#ecfdf5',
      onPress: () => navigation.navigate('UserMaster'),
    },
    {
      id: 'user_type',
      name: 'User Types Master',
      desc: 'Configure access roles & permissions',
      icon: ShieldCheckIcon,
      iconColor: '#7c3aed',
      bgColor: '#f3e8ff',
      onPress: () => navigation.navigate('UserTypeMaster'),
    },
    {
      id: 'cloud_storage',
      name: 'Cloud Storage Master',
      desc: 'Configure Google Cloud Storage bucket & keys',
      icon: CloudIcon,
      iconColor: '#d97706',
      bgColor: '#fffbeb',
      onPress: () => navigation.navigate('CloudStorageMaster'),
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchStats}
            tintColor={colors.primary}
          />
        }
      >
        <View style={[styles.welcomeBanner, { height: bannerHeight, width: width }]}>
          {/* SVG: Same gradient + organic S-curve wave as WelcomeScreen */}
          <Svg
            width={width}
            height={bannerHeight + 30}
            viewBox={`0 0 ${width} ${bannerHeight + 30}`}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id="dashBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%"   stopColor="#0284c7" />
                <Stop offset="42%"  stopColor="#2563eb" />
                <Stop offset="100%" stopColor="#3730a3" />
              </LinearGradient>
              <LinearGradient id="dashBackWave" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%"   stopColor="rgba(56, 189, 248, 0.30)" />
                <Stop offset="100%" stopColor="rgba(99, 102, 241, 0.30)" />
              </LinearGradient>
            </Defs>
            {/* Depth back-wave */}
            <Path d={backWavePath} fill="url(#dashBackWave)" />
            {/* Main foreground wave */}
            <Path d={mainWavePath} fill="url(#dashBgGrad)" />
          </Svg>

          {/* Banner content */}
          <View style={styles.bannerContent}>
            {/* Top Row: App Logo + Username + Role on left */}
            <View style={styles.bannerUserRow}>
              <View style={styles.bannerAppIcon}>
                <MessagesSquareIcon size={20} color="#ffffff" />
              </View>
              <View style={styles.bannerUserInfo}>
                <Text style={styles.bannerUserName} numberOfLines={1}>
                  {user?.name || user?.username || 'Administrator'}
                </Text>
                <View style={styles.bannerRoleBadge}>
                  <Text style={styles.bannerRoleText}>
                    {(user?.user_type_name || (user?.role === 'admin' || user?.username?.toLowerCase() === 'admin' ? 'Admin' : user?.role || 'Member')).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Admin heading */}
            <Text style={styles.bannerHeading}>
              Welcome, {user?.name || user?.username || 'Administrator'}!
            </Text>

            {/* Subtitle */}
            <Text style={styles.bannerSubtitle}>
              Manage user accounts, role-based permissions, internal enterprise communications, and cloud storage drivers from a single portal.
            </Text>
          </View>
        </View>

        {/* 4 KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, shadows.sm]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#e0efff' }]}>
              <UsersIcon size={20} color={colors.primary} />
            </View>
            <View style={styles.kpiTextCol}>
              <Text style={styles.kpiLabel}>TOTAL USERS</Text>
              <Text style={styles.kpiValue}>{totalUsers}</Text>
            </View>
          </View>

          <View style={[styles.kpiCard, shadows.sm]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#dcfce7' }]}>
              <ShieldCheckIcon size={20} color={colors.success} />
            </View>
            <View style={styles.kpiTextCol}>
              <Text style={styles.kpiLabel}>ACTIVE USERS</Text>
              <Text style={[styles.kpiValue, { color: colors.success }]}>{activeUsers}</Text>
            </View>
          </View>

          <View style={[styles.kpiCard, shadows.sm]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#fef3c7' }]}>
              <MobileIcon size={20} color={colors.warning} />
            </View>
            <View style={styles.kpiTextCol}>
              <Text style={styles.kpiLabel}>PENDING DEVICES</Text>
              <Text style={[styles.kpiValue, { color: colors.warning }]}>{pendingDevices}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.kpiCard, shadows.sm]}
            onPress={() => navigation.navigate('UserTypeMaster')}
            activeOpacity={0.7}
          >
            <View style={[styles.kpiIconWrap, { backgroundColor: '#f3e8ff' }]}>
              <ShieldCheckIcon size={20} color="#7c3aed" />
            </View>
            <View style={styles.kpiTextCol}>
              <Text style={styles.kpiLabel}>USER ROLES</Text>
              <Text style={[styles.kpiValue, { color: '#7c3aed' }]}>{totalUserTypes}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Enterprise Administration Masters — Dropdown Container */}
        <View style={styles.mastersSectionWrap}>
          {/* <TouchableOpacity
            style={styles.dropdownHeaderTrigger}
            onPress={() => setIsMastersOpen(!isMastersOpen)}
            activeOpacity={0.8}
          > */}
            <View style={styles.dropdownTitleRow}>
              <View style={styles.dropdownHeaderIconWrap}>
                <LayersIcon size={18} color="#0056cf" />
              </View>
              <Text style={styles.sectionHeader}>Enterprise Administration Masters</Text>
            </View>
         
            <View style={styles.dropdownMenuList}>
              {masterList?.map((item) => {
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
  /* ── Welcome Banner: Full-bleed edge-to-edge ── */
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
  /* Top row: app icon + user info, left-aligned */
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
  /* Hero icon — same sizes as WelcomeScreen InterChatHeroIcon */
  heroIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    position: 'relative',
  },
  heroIconAura: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroLogoTile: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Brand title — Inter<Chat> same as WelcomeScreen */
  bannerBrandTitle: {
    fontSize: 27,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  bannerBrandAccent: {
    color: '#93c5fd',
  },
  /* Admin greeting */
  bannerHeading: {
    fontSize: 20,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: 26,
    marginBottom: 6,
  },
  /* Subtitle */
  bannerSubtitle: {
    fontSize: 13.5,
    fontWeight: fontWeights.medium,
    color: 'rgba(255, 255, 255, 0.90)',
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 10,
  },
  /* Feature badges — identical to WelcomeScreen featureBadge */
  bannerFeaturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  bannerFeatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bannerFeatureText: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
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
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  mastersSectionWrap: {
    marginBottom: spacing.xl,
  },
  dropdownHeaderTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop:spacing.md,
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
  dropdownChevronWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownBadge: {
    backgroundColor: '#e0efff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  dropdownBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: '#1d4ed8',
    letterSpacing: 0.5,
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

