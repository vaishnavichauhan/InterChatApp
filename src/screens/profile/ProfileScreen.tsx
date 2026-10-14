import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  KeyboardAvoidingView,
  Keyboard,
  LayoutAnimation,
  UIManager,
  type ScrollViewInstance,
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
  CityIcon,
  FileSpreadsheetIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  DownloadIcon,
  RefreshIcon,
} from '../../components/icons/SvgIcons';
import { useAuthStore, isUserAdminRole } from '../../store/authStore';
import { useAppUpdateStore } from '../../store/useAppUpdateStore';
import { CURRENT_APP_VERSION, triggerApkDownload } from '../../api/appUpdateApi';
import { updateProfile } from '../../api/authApi';
import { getDashboardStats } from '../../api/adminApi';
import { getInitials } from '../../utils/formatters';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const { user, logout, updateUser } = useAuthStore();
  const { updateInfo, checkForUpdates, checkingUpdate, hasUpdateAvailable } = useAppUpdateStore();
  const scrollViewRef = useRef<ScrollViewInstance>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobNo, setMobNo] = useState(user?.mob_no || '');
  const [saving, setSaving] = useState(false);

  const handleCheckUpdate = async (isManual = true) => {
    try {
      const res = await checkForUpdates();
      if (isManual) {
        if (res?.updateRequired) {
          Alert.alert(
            'Update Required',
            `Update is compulsory. A new version (${res.latestVersion || 'latest'}) is available. Please update the application to continue.`,
            [
              { text: 'Close', style: 'cancel' },
              {
                text: 'Update Now',
                onPress: () =>
                  triggerApkDownload(
                    res.downloadUrl,
                    res.apkAvailable,
                    res.latestVersion
                  ),
              },
            ]
          );
        } else if (res?.success) {
          Alert.alert(
            'App Up to Date',
            `You are already using the latest version of InterChat (v${CURRENT_APP_VERSION}).`
          );
        } else {
          Alert.alert(
            'Update Check Failed',
            'Could not retrieve update information from the server. Please check your network connection.'
          );
        }
      }
    } catch (err: any) {
      if (isManual) {
        Alert.alert('Update Check Failed', err?.message || 'Something went wrong.');
      }
    }
  };

  // Admin Dashboard stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isMastersOpen, setIsMastersOpen] = useState(false);

  const toggleMasters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsMastersOpen((prev) => !prev);
  };

  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const topInset = Math.max(insets.top, androidStatusHeight);

  const isAdmin = isUserAdminRole(user);
  const initials = getInitials(user?.name || user?.username || 'U');

  // Dashboard wave banner geometry (same for Admin & User)
  const bannerHeight = 290;
  const curveLeftY = bannerHeight - 34;
  const curveRightY = bannerHeight - 64;
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
      checkForUpdates();
    }, [user, checkForUpdates])
  );

  const totalUsers = stats?.users?.total ?? '—';
  const activeUsers = stats?.users?.active ?? '—';
  const pendingDevices = stats?.devices?.pending ?? 0;
  const totalUserTypes = stats?.userTypes?.totalTypes ?? stats?.userTypes?.distribution?.length ?? '—';

  // Enterprise Administration Masters list
  const masterList = [
    {
      id: 'company',
      name: 'Company Master',
      desc: 'Manage corporate entities & company boundaries',
      icon: CityIcon,
      iconColor: '#2563eb',
      bgColor: '#eff6ff',
      onPress: () => navigation.navigate('CompanyMaster'),
    },
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
      id: 'bulk_import',
      name: 'Bulk Employee Import',
      desc: 'Import users in bulk from Excel / CSV spreadsheet',
      icon: FileSpreadsheetIcon,
      iconColor: '#059669',
      bgColor: '#ecfdf5',
      onPress: () => navigation.navigate('BulkUserImport'),
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
    Keyboard.dismiss();
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

    Keyboard.dismiss();
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* ── FIXED TOP SECTION (NON-SCROLLING HERO BANNER & AVATAR) ── */}
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
        <View style={[styles.bannerContent, { paddingTop: topInset + 16 }]}>
          {/* Center Avatar (Enlarged) */}
          <View style={styles.bannerAvatarBox}>
            <Text style={styles.bannerAvatarText}>{initials}</Text>
            <View style={styles.bannerAvatarDot} />
          </View>

          {/* Greeting heading */}
          <Text style={styles.bannerHeading}>
            Welcome, {user?.name || user?.username || (isAdmin ? 'Administrator' : 'User')}!
          </Text>

          {/* Role Badge */}
          <View style={styles.bannerRoleBadge}>
            <Text style={styles.bannerRoleText}>
              {(user?.user_type_name || (isAdmin ? 'ADMIN' : 'USER')).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* ── SCROLLABLE BOTTOM HALF (HALF SCROLL) ── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + (isEditing ? 280 : spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          !isEditing && isAdmin ? (
            <RefreshControl
              refreshing={loadingStats}
              onRefresh={fetchStats}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {/* ── BOTTOM PART: MERGE DASHBOARD & PROFILE ── */}
        <View style={[styles.bodyContainer, { width }]}>
          {isAdmin && !isEditing && (
            <>
              {/* 1. Dashboard 4 KPI Horizontal Swipe */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.kpiScrollView}
                contentContainerStyle={styles.kpiScrollContent}
              >
                {/* 1. Total Users (Blue) */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('UserMaster')}
                  style={[styles.kpiCard, styles.kpiCardBlue, shadows.sm]}
                  activeOpacity={0.75}
                >
                  <View style={styles.kpiIconWrap}>
                    <UsersIcon size={24} color="#2563EB" />
                  </View>
                  <View style={styles.kpiTextCol}>
                    <Text style={[styles.kpiValue, { color: '#1E3A8A' }]}>{totalUsers}</Text>
                    <Text style={[styles.kpiLabel, { color: '#3B82F6' }]} numberOfLines={1}>
                      TOTAL USERS
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Active Users (Green) */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('UserMaster')}
                  style={[styles.kpiCard, styles.kpiCardGreen, shadows.sm]}
                  activeOpacity={0.75}
                >
                  <View style={styles.kpiIconWrap}>
                    <ShieldCheckIcon size={24} color="#059669" />
                  </View>
                  <View style={styles.kpiTextCol}>
                    <Text style={[styles.kpiValue, { color: '#064E3B' }]}>{activeUsers}</Text>
                    <Text style={[styles.kpiLabel, { color: '#10B981' }]} numberOfLines={1}>
                      ACTIVE USERS
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Pending Devices (Amber) */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('UserMaster')}
                  style={[styles.kpiCard, styles.kpiCardAmber, shadows.sm]}
                  activeOpacity={0.75}
                >
                  <View style={styles.kpiIconWrap}>
                    <MobileIcon size={24} color="#D97706" />
                  </View>
                  <View style={styles.kpiTextCol}>
                    <Text style={[styles.kpiValue, { color: '#78350F' }]}>{pendingDevices}</Text>
                    <Text style={[styles.kpiLabel, { color: '#D97706' }]} numberOfLines={1}>
                      PENDING DEVICES
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 4. User Roles (Purple) */}
                <TouchableOpacity
                  style={[styles.kpiCard, styles.kpiCardPurple, shadows.sm]}
                  onPress={() => navigation.navigate('UserTypeMaster')}
                  activeOpacity={0.75}
                >
                  <View style={styles.kpiIconWrap}>
                    <ShieldCheckIcon size={24} color="#7C3AED" />
                  </View>
                  <View style={styles.kpiTextCol}>
                    <Text style={[styles.kpiValue, { color: '#4C1D95' }]}>{totalUserTypes}</Text>
                    <Text style={[styles.kpiLabel, { color: '#7C3AED' }]} numberOfLines={1}>
                      USER ROLES
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>

              {/* 2. Enterprise Administration Masters Section */}
              <View style={[styles.mastersSectionWrap, shadows.sm]}>
                <TouchableOpacity
                  style={[
                    styles.dropdownHeaderTrigger,
                    isMastersOpen && styles.dropdownHeaderTriggerOpen,
                  ]}
                  onPress={toggleMasters}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownTitleRow}>
                    <View style={styles.dropdownHeaderIconWrap}>
                      <LayersIcon size={18} color={colors.primary} />
                    </View>
                    <View style={styles.dropdownTitleTextCol}>
                      <Text style={styles.sectionHeader}>Enterprise Administration Masters</Text>
                      <Text style={styles.dropdownSubtitle}>
                        {isMastersOpen ? 'Tap to collapse' : `${masterList.length} masters available`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dropdownChevronWrap}>
                    <View style={styles.chevronIconWrap}>
                      {isMastersOpen ? (
                        <ChevronUpIcon size={18} color={colors.primary} />
                      ) : (
                        <ChevronDownIcon size={18} color="#64748b" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {isMastersOpen && (
                  <View style={styles.dropdownMenuList}>
                    {masterList.map((item, index) => {
                      const ItemIcon = item.icon;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.dropdownMenuItem,
                            index < masterList.length - 1 && styles.dropdownMenuItemBorder,
                          ]}
                          onPress={item.onPress}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.menuItemIconWrap, { backgroundColor: item.bgColor }]}>
                            <ItemIcon size={19} color={item.iconColor} />
                          </View>
                          <View style={styles.menuItemTextCol}>
                            <Text style={styles.menuItemTitle}>{item.name}</Text>
                            <Text style={styles.menuItemDesc} numberOfLines={1}>{item.desc}</Text>
                          </View>
                          <ChevronRightIcon size={16} color="#94a3b8" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}

          {/* 3. Personal Details Section */}
          {/* 3. Personal Details Section */}
          {!isEditing ? (
            <View style={[styles.infoCard, shadows.sm]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.sectionIconBadge}>
                    <UserIcon size={16} color={colors.primary} />
                  </View>
                  <View style={styles.sectionHeaderTitleCol}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    <Text style={styles.sectionSubtitle}>Verified organization account</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.editProfileBtn}
                  onPress={() => {
                    setIsEditing(true);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 120);
                  }}
                  activeOpacity={0.75}
                >
                  <EditIcon size={13} color={colors.primary} />
                  <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailsList}>
                {/* Full Name */}
                <View style={styles.detailTile}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <UserIcon size={18} color="#2563EB" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>FULL NAME</Text>
                    <Text style={styles.detailValue}>{user?.name || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Username */}
                <View style={styles.detailTile}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#FFFBEB' }]}>
                    <ShieldUserIcon size={18} color="#D97706" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>USERNAME</Text>
                    <Text style={styles.detailValue}>@{user?.username}</Text>
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.detailTile}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <MailIcon size={18} color="#059669" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
                    <Text style={styles.detailValue}>{user?.email || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Mobile Number */}
                <View style={styles.detailTile}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#F5F3FF' }]}>
                    <PhoneIcon size={18} color="#7C3AED" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>MOBILE NUMBER</Text>
                    <Text style={styles.detailValue}>{user?.mob_no || 'Not linked'}</Text>
                  </View>
                </View>

                {/* Assigned Department */}
                <View style={styles.detailTile}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#ECFEFF' }]}>
                    <BuildingIcon size={18} color="#0891B2" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>DEPARTMENT</Text>
                    <Text style={styles.detailValue}>{departmentsDisplay}</Text>
                  </View>
                </View>

                {/* Account Role / User Type */}
                <View style={styles.detailTile}>
                  <View style={[styles.detailIconWrap, { backgroundColor: '#FDF2F8' }]}>
                    <CrownIcon size={18} color="#DB2777" />
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
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }}
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

          {/* 4. App Version & Updates Section Card */}
          <View style={[styles.infoCard, shadows.sm, hasUpdateAvailable && styles.updateCardHighlight]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIconBadge, hasUpdateAvailable && { backgroundColor: '#FEE2E2' }]}>
                  <DownloadIcon size={16} color={hasUpdateAvailable ? colors.primary : '#2563EB'} />
                </View>
                <View style={styles.sectionHeaderTitleCol}>
                  <Text style={styles.sectionTitle}>App Version & Updates</Text>
                  <Text style={styles.sectionSubtitle}>
                    {hasUpdateAvailable ? 'New application build available' : 'InterChat is up to date'}
                  </Text>
                </View>
              </View>

              {/* Status Badge */}
              {hasUpdateAvailable ? (
                <View style={styles.statusBadgeUpdate}>
                  <Text style={styles.statusBadgeUpdateText}>New version ready</Text>
                </View>
              ) : (
                <View style={styles.statusBadgeUpToDate}>
                  <Text style={styles.statusBadgeUpToDateText}>Up to date ✓</Text>
                </View>
              )}
            </View>

            

            {/* If update message is available */}
            {hasUpdateAvailable && updateInfo?.message ? (
              <View style={styles.profileUpdateMsgBox}>
                <Text style={styles.profileUpdateMsgText}>{updateInfo.message}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.profileUpdateActions}>
              {/* Download Update button if update available */}
              {hasUpdateAvailable && (
                <TouchableOpacity
                  style={[styles.profileDownloadBtn, shadows.md]}
                  onPress={() =>
                    triggerApkDownload(
                      updateInfo?.downloadUrl,
                      updateInfo?.apkAvailable,
                      updateInfo?.latestVersion
                    )
                  }
                  activeOpacity={0.85}
                >
                  <DownloadIcon size={16} color="#ffffff" />
                  <Text style={styles.profileDownloadBtnText}>Download Update</Text>
                </TouchableOpacity>
              )}

              {/* Check for Updates button with loading state */}
              <TouchableOpacity
                style={[
                  styles.profileCheckBtn,
                  hasUpdateAvailable && styles.profileCheckBtnSecondary,
                ]}
                onPress={() => handleCheckUpdate(true)}
                disabled={checkingUpdate}
                activeOpacity={0.7}
              >
                {checkingUpdate ? (
                  <View style={styles.profileBtnInner}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.profileCheckBtnText}>Checking for updates...</Text>
                  </View>
                ) : (
                  <View style={styles.profileBtnInner}>
                    <RefreshIcon size={15} color={hasUpdateAvailable ? colors.textSecondary : colors.primary} />
                    <Text
                      style={[
                        styles.profileCheckBtnText,
                        hasUpdateAvailable && { color: colors.textSecondary },
                      ]}
                    >
                      Check for Updates
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. Logout Button */}
          <TouchableOpacity
            style={[styles.logoutCardBtn, shadows.sm]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOutIcon size={18} color={colors.danger} />
            <Text style={styles.logoutCardBtnText}>Sign Out of Device</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Inter_Chat Version {CURRENT_APP_VERSION}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollArea: {
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
    marginBottom: 0,
  },
  bannerContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bannerTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: spacing.xs,
  },
  bannerAvatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: 6,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  bannerAvatarText: {
    fontSize: 26,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  bannerAvatarDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2.5,
    borderColor: colors.primary,
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
  },
  bannerHeading: {
    fontSize: 19,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 6,
  },
  bannerRoleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'center',
  },
  bannerRoleText: {
    fontSize: 10.5,
    fontWeight: fontWeights.extrabold,
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  bannerSubtitle: {
    fontSize: 12.5,
    fontWeight: fontWeights.medium,
    color: 'rgba(255, 255, 255, 0.90)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },

  /* ── BODY CONTAINER ── */
  bodyContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  /* ── 4 KPI HORIZONTAL SWIPE (DASHBOARD) ── */
  kpiScrollView: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.xl,
  },
  kpiScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
    flexDirection: 'row',
    gap: spacing.md,
  },
  kpiCard: {
    width: 124,
    height: 124,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1.2,
    padding: spacing.sm,
  },
  kpiCardBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  kpiCardGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiCardAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  kpiCardPurple: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  kpiTextCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 2,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: fontWeights.black,
    textAlign: 'center',
    lineHeight: 24,
  },

  /* ── MASTERS SECTION (DASHBOARD) ── */
  mastersSectionWrap: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  dropdownHeaderTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  dropdownHeaderTriggerOpen: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dropdownHeaderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e0efff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropdownTitleTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  dropdownSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  dropdownChevronWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevronIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  dropdownMenuList: {
    backgroundColor: '#ffffff',
    paddingVertical: 4,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  dropdownMenuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTextCol: {
    flex: 1,
    marginRight: 8,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuItemDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },

  /* ── PERSONAL DETAILS SECTION ── */
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e8edf3',
    padding: spacing.md + 2,
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  detailsList: {
    gap: 8,
  },
  detailTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },

  /* ── EDIT FORM ── */
  editFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e8edf3',
    padding: spacing.md + 2,
    marginBottom: spacing.xl,
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

  /* ── APP VERSION & UPDATES SECTION ── */
  updateCardHighlight: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFFBFB',
  },
  statusBadgeUpdate: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeUpdateText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  statusBadgeUpToDate: {
    backgroundColor: '#D1FAE5',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeUpToDateText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  profileVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileVersionBox: {
    flex: 1,
    alignItems: 'center',
  },
  profileVersionBoxLatest: {
    backgroundColor: '#FFF1F2',
    borderRadius: borderRadius.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  profileVersionLabel: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileVersionLabelLatest: {
    color: colors.primaryDark,
  },
  profileVersionPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileVersionPillNeutral: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  profileVersionPillLatest: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECDD3',
  },
  profileVersionPillText: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  profileVersionPillTextNeutral: {
    color: colors.textPrimary,
  },
  profileVersionPillTextLatest: {
    color: '#DC2626',
  },
  profileVersionArrowWrap: {
    paddingHorizontal: spacing.sm,
  },
  profileVersionArrow: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  profileUpdateMsgBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  profileUpdateMsgText: {
    fontSize: 11,
    color: '#7C2D12',
    lineHeight: 16,
  },
  profileUpdateActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  profileDownloadBtn: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  profileDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: fontWeights.bold,
  },
  profileCheckBtn: {
    backgroundColor: '#FFF5F5',
    borderRadius: borderRadius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  profileCheckBtnSecondary: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  profileCheckBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  profileBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
