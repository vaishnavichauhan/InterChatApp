import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppInput } from '../../components/common/AppInput';
import {
  LogOutIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  ShieldUserIcon,
  BuildingIcon,
  CrownIcon,
  EditIcon,
  CheckIcon,
  XMarkIcon,
  MobileIcon,
  UsersIcon,
  ShieldCheckIcon,
  MessagesSquareIcon,
  ArrowRightIcon,
  CloudIcon,
  LayersIcon,
} from '../../components/icons/SvgIcons';
import { useAuthStore, isUserAdminRole } from '../../store/authStore';
import { updateProfile } from '../../api/authApi';
import { getDashboardStats } from '../../api/adminApi';
import { getInitials } from '../../utils/formatters';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const { user, logout, updateUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobNo, setMobNo] = useState(user?.mob_no || '');
  const [saving, setSaving] = useState(false);

  // Admin Dashboard stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const topInset = Math.max(insets.top, androidStatusHeight);

  const isAdmin = isUserAdminRole(user);
  const initials = getInitials(user?.name || user?.username || 'U');

  // Dashboard wave banner geometry (same for Admin & User)
  const bannerHeight = 300;
  const curveLeftY = bannerHeight - 38;
  const curveRightY = bannerHeight - 72;
  const mainWavePath = `M 0 0 L ${width} 0 L ${width} ${curveRightY} C ${width * 0.70} ${curveRightY - 20}, ${width * 0.35} ${bannerHeight + 10}, 0 ${curveLeftY} Z`;
  const backWavePath = `M 0 0 L ${width} 0 L ${width} ${curveRightY + 24} C ${width * 0.68} ${curveRightY + 6}, ${width * 0.32} ${bannerHeight + 28}, 0 ${curveLeftY + 16} Z`;

  const departmentsDisplay =
    user?.departments && user.departments.length > 0
      ? user.departments.map((d) => d.department_name).join(', ')
      : 'All Organization';

  // Fetch admin stats
  const fetchStats = async () => {
    if (!isAdmin) return;
    try {
      setLoadingStats(true);
      const res = await getDashboardStats();
      if (res.data?.success && res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Failed to load dashboard stats in profile:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      setIsEditing(false);
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setMobNo(user.mob_no || '');
      }
      if (isUserAdminRole(user)) {
        fetchStats();
      }
    }, [user])
  );

  const totalUsers = stats?.users?.total ?? '—';
  const activeUsers = stats?.users?.active ?? '—';
  const pendingDevices = stats?.devices?.pending ?? 0;
  const totalUserTypes = stats?.userTypes?.totalTypes ?? stats?.userTypes?.distribution?.length ?? '—';

  // Enterprise Administration Masters list
  const masterList = [
    {
      id: 'department',
      name: 'Department Master',
      desc: 'Manage departments & organizational units',
      icon: BuildingIcon,
      iconColor: colors.primary,
      bgColor: colors.primarySubtle,
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
    },
  ];

  const handleCancelEdit = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setMobNo(user?.mob_no || '');
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

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
      setIsEditing(false);
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingStats}
            onRefresh={() => {
              if (isAdmin) fetchStats();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── TOP PART: S-Curve Wave Hero Banner (Consistent for Admin & User) ── */}
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
            {/* Top Row: User Avatar + Name + Role + Top Right Logout Button */}
            <View style={styles.bannerUserRow}>
              <View style={styles.bannerAvatarBox}>
                <Text style={styles.bannerAvatarText}>{initials}</Text>
                <View style={styles.bannerAvatarDot} />
              </View>
              <View style={styles.bannerUserInfo}>
                <Text style={styles.bannerUserName} numberOfLines={1}>
                  {user?.name || user?.username || (isAdmin ? 'Administrator' : 'User')}
                </Text>
                <View style={styles.bannerRoleBadge}>
                  <Text style={styles.bannerRoleText}>
                    {(user?.user_type_name || (isAdmin ? 'ADMIN' : 'USER')).toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Top Right Logout Button */}
              <TouchableOpacity
                style={styles.bannerLogoutBtn}
                onPress={handleLogout}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <LogOutIcon size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Greeting heading */}
            <Text style={styles.bannerHeading}>
              Welcome, {user?.name || user?.username || (isAdmin ? 'Administrator' : 'User')}!
            </Text>

            {/* Subtitle */}
            <Text style={styles.bannerSubtitle}>
              {isAdmin
                ? 'Manage user accounts, role-based permissions, internal enterprise communications, and cloud storage drivers from a single portal.'
                : 'Manage your profile details, department assignments, and enterprise communications from your personal account.'}
            </Text>
          </View>
        </View>

        {/* ── BOTTOM PART: MERGE DASHBOARD & PROFILE ── */}
        <View style={[styles.bodyContainer, { width }]}>
          {isAdmin && (
            <>
              {/* 1. Dashboard 4 KPI Grid */}
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

                <TouchableOpacity
                  onPress={() => navigation.navigate('UserMaster')}
                  style={[styles.kpiCard, shadows.sm]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#fef3c7' }]}>
                    <MobileIcon size={20} color={colors.warning} />
                  </View>
                  <View style={styles.kpiTextCol}>
                    <Text style={styles.kpiLabel}>PENDING DEVICES</Text>
                    <Text style={[styles.kpiValue, { color: colors.warning }]}>{pendingDevices}</Text>
                  </View>
                </TouchableOpacity>

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

              {/* 2. Enterprise Administration Masters Section */}
              <View style={styles.mastersSectionWrap}>
                <View style={styles.dropdownTitleRow}>
                  <View style={styles.dropdownHeaderIconWrap}>
                    <LayersIcon size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.sectionHeader}>Enterprise Administration Masters</Text>
                </View>

                <View style={styles.dropdownMenuList}>
                  {masterList.map((item) => {
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
            </>
          )}

          {/* 3. Personal Details Section */}
          {!isEditing ? (
            <View style={styles.infoCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderTitleCol}>
                  <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
                  <Text style={styles.sectionSubtitle}>Verified organization account data</Text>
                </View>

                <TouchableOpacity
                  style={styles.editProfileBtn}
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.7}
                >
                  <EditIcon size={14} color={colors.primary} />
                  <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailsList}>
                {/* Full Name */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: colors.primarySubtle }]}>
                    <UserIcon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>FULL NAME</Text>
                    <Text style={styles.detailValue}>{user?.name || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Username */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#fffbeb' }]}>
                    <ShieldUserIcon size={18} color="#d97706" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>USERNAME</Text>
                    <Text style={styles.detailValue}>@{user?.username}</Text>
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#f0fdf4' }]}>
                    <MailIcon size={18} color="#059669" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
                    <Text style={styles.detailValue}>{user?.email || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Mobile Number */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#faf5ff' }]}>
                    <PhoneIcon size={18} color="#7c3aed" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>MOBILE NUMBER</Text>
                    <Text style={styles.detailValue}>{user?.mob_no || 'Not linked'}</Text>
                  </View>
                </View>

                {/* Assigned Department */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#ecfeff' }]}>
                    <BuildingIcon size={18} color="#0891b2" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>DEPARTMENT</Text>
                    <Text style={styles.detailValue}>{departmentsDisplay}</Text>
                  </View>
                </View>

                {/* Account Role / User Type */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#fdf2f8' }]}>
                    <CrownIcon size={18} color="#db2777" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>ORGANIZATIONAL ROLE</Text>
                    <Text style={styles.detailValue}>
                      {user?.user_type_name || (isAdmin ? 'System Administrator' : 'Standard Member')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.editFormCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editFormTitle}>Edit Profile Information</Text>
                  <Text style={styles.editFormSub}>Update your personal information below</Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelRoundBtn}
                  onPress={handleCancelEdit}
                  activeOpacity={0.7}
                >
                  <XMarkIcon size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              <AppInput
                label="Full Name"
                placeholder="Your full name"
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

              <View style={styles.formActionsRow}>
                <TouchableOpacity
                  style={styles.formCancelBtn}
                  onPress={handleCancelEdit}
                  activeOpacity={0.7}
                >
                  <Text style={styles.formCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formUpdateBtn, saving && { opacity: 0.7 }]}
                  onPress={handleUpdate}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <View style={styles.formUpdateBtnInner}>
                    {saving ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <CheckIcon size={14} color="#ffffff" />
                        <Text style={styles.formUpdateBtnText}>Update Profile</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 4. Logout Button */}
          <TouchableOpacity
            style={[styles.logoutCardBtn, shadows.sm]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOutIcon size={18} color={colors.danger} />
            <Text style={styles.logoutCardBtnText}>Sign Out of Device</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Inter_Chat Version 1.29.09</Text>
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
    paddingBottom: spacing.xxl,
  },

  /* ── ADMIN WELCOME BANNER (Edge-to-edge wave) ── */
  welcomeBanner: {
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.lg,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  bannerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.20)',
  },
  bannerAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  bannerAvatarText: {
    fontSize: 18,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  bannerAvatarDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: colors.primary,
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
    flex: 1,
  },
  bannerLogoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
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
  bannerRoleText: {
    fontSize: 10.5,
    fontWeight: fontWeights.extrabold,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
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

  /* ── BODY CONTAINER ── */
  bodyContainer: {
    paddingHorizontal: spacing.lg,
  },

  /* ── 4 KPI CARDS (DASHBOARD) ── */
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

  /* ── MASTERS SECTION (DASHBOARD) ── */
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

  /* ── PERSONAL DETAILS SECTION ── */
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: spacing.sm,
  },
  sectionHeaderTitleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.extrabold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  detailsList: {
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },

  /* ── EDIT FORM ── */
  editFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  editFormTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  editFormSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  cancelRoundBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.md,
  },
  formCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formCancelBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  formUpdateBtn: {
    flex: 2,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formUpdateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  formUpdateBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },

  /* ── LOGOUT BUTTON ── */
  logoutCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: borderRadius.xl,
    paddingVertical: 14,
    gap: 8,
    marginTop: spacing.sm,
  },
  logoutCardBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8ea4c4ff',
    marginTop: 20,
  },
});
export default ProfileScreen;
