import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import {
  BuildingIcon,
  PlusIcon,
  XMarkIcon,
  SearchIcon,
  UsersIcon,
  EditIcon,
  ShieldUserIcon,
  CheckIcon,
  ChevronDownIcon,
  PhoneIcon,
  CalendarIcon,
  BanIcon,
  MobileIcon,
  LockIcon,
  ClockIcon,
  ShieldCheckIcon,
  MailIcon,
  CityIcon,
} from '../../components/icons/SvgIcons';
import {
  getAllUsers,
  getPendingDevices,
  approveDevice,
  revokeDevice,
  toggleUserActive,
  updateUserByAdmin,
  createUserByAdmin,
  getUserTypes,
  fetchAuditLogs,
} from '../../api/adminApi';
import { getDepartments } from '../../api/departmentApi';
import { getCompanies, Company } from '../../api/companyApi';

interface UserMasterScreenProps {
  navigation: any;
}

export const UserMasterScreen: React.FC<UserMasterScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'users' | 'devices' | 'audit'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [pendingDevices, setPendingDevices] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [userTypesList, setUserTypesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters for Users Tab
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

  // Search for Audit Logs Tab
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Device Approval Modal State
  const [approvingDevice, setApprovingDevice] = useState<any>(null);
  const [allowDownloadChoice, setAllowDownloadChoice] = useState(true);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobNo, setEditMobNo] = useState('');
  const [editCompanyId, setEditCompanyId] = useState<number | null>(null);
  const [editUserTypeId, setEditUserTypeId] = useState<string | number>('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editDeptRole, setEditDeptRole] = useState<'ADMIN' | 'USER'>('USER');
  const [editSingleDept, setEditSingleDept] = useState<string | number>('');
  const [editMultiDepts, setEditMultiDepts] = useState<number[]>([]);
  const [editDeviceLock, setEditDeviceLock] = useState(true);
  const [editMustChangePassword, setEditMustChangePassword] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch all master data (Users, Pending Devices, Device Audit Logs, Depts, UserTypes, Companies)
  const fetchData = async () => {
    try {
      const [usersRes, devicesRes, logsRes, deptsRes, typesRes, compRes] = await Promise.all([
        getAllUsers(true).catch(() => ({ data: { users: [] } })),
        getPendingDevices().catch(() => ({ data: { devices: [] } })),
        fetchAuditLogs().catch(() => ({ data: { logs: [] } })),
        getDepartments(false).catch(() => ({ departments: [] })),
        getUserTypes().catch(() => ({ data: { data: [] } })),
        getCompanies(false).catch(() => ({ companies: [] })),
      ]);

      const uList = usersRes.data?.users || usersRes.data?.data || (Array.isArray(usersRes.data) ? usersRes.data : []);
      const pList = devicesRes.data?.devices || devicesRes.data?.data || (Array.isArray(devicesRes.data) ? devicesRes.data : []);
      const aList = logsRes.data?.logs || logsRes.data?.data || (Array.isArray(logsRes.data) ? logsRes.data : []);
      const dList = deptsRes?.departments || deptsRes?.data || (Array.isArray(deptsRes) ? deptsRes : []);
      const tList = typesRes.data?.data || typesRes.data || [];
      const cList = compRes?.companies || compRes?.data || (Array.isArray(compRes) ? compRes : []);

      setUsers(Array.isArray(uList) ? uList : []);
      setPendingDevices(Array.isArray(pList) ? pList : []);
      setAuditLogs(Array.isArray(aList) ? aList : []);
      setDepartmentsList(Array.isArray(dList) ? dList : []);
      setUserTypesList(Array.isArray(tList) ? tList : []);
      setCompaniesList(Array.isArray(cList) ? cList : []);
    } catch (err) {
      console.warn('Failed to load user master data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Helper for Initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.trim().substring(0, 2).toUpperCase();
  };

  // Toggle user active status
  const handleToggleActive = (userId: number, currentActive: boolean | number) => {
    const isCurrentlyActive = Boolean(currentActive);
    const nextStatus = !isCurrentlyActive;
    const label = nextStatus ? 'activate' : 'deactivate';

    Alert.alert(
      `${nextStatus ? 'Activate' : 'Deactivate'} User`,
      `Are you sure you want to ${label} this user account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus ? 'Activate' : 'Deactivate',
          style: nextStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await toggleUserActive(userId, nextStatus);
              setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, active: nextStatus } : u))
              );
              Alert.alert('Success', `User account ${nextStatus ? 'activated' : 'deactivated'}.`);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update user status.');
            }
          },
        },
      ]
    );
  };

  // Revoke device
  const handleRevokeDevice = (userId: number) => {
    Alert.alert(
      'Revoke Device',
      'Are you sure you want to revoke this authorized device? The user will need admin approval on next login.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeDevice(userId);
              Alert.alert('Success', 'Device authorization revoked.');
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to revoke device.');
            }
          },
        },
      ]
    );
  };

  // Open Device Approval Modal
  const handleOpenApproveModal = (device: any) => {
    setApprovingDevice(device);
    const hasRolePerm = Boolean(device.has_role_download_perm !== 0 && device.has_role_download_perm !== false);
    setAllowDownloadChoice(hasRolePerm);
  };

  // Confirm Device Approval
  const handleConfirmApproveDevice = async () => {
    if (!approvingDevice) return;
    try {
      setSubmittingApproval(true);
      const hasRolePerm = Boolean(approvingDevice.has_role_download_perm !== 0 && approvingDevice.has_role_download_perm !== false);
      const finalAllowDownload = hasRolePerm ? allowDownloadChoice : false;

      await approveDevice(approvingDevice.id, finalAllowDownload);
      Alert.alert(
        'Device Approved',
        `Device authorized successfully with ${finalAllowDownload ? 'downloads enabled' : 'view-only access'}.`
      );
      setApprovingDevice(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Approval failed.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    const uDepts = Array.isArray(user.departments) ? user.departments : [];
    const isDeptAdmin = uDepts.some((d: any) => d.department_role === 'ADMIN');
    const deptIds = uDepts.map((d: any) => Number(d.department_id));

    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditMobNo(user.mob_no || '');
    setEditCompanyId(user.company_id || null);
    setEditUserTypeId(user.user_type_id || '');
    setEditRole(user.role === 'admin' ? 'admin' : 'user');
    setEditDeptRole(isDeptAdmin ? 'ADMIN' : 'USER');
    setEditSingleDept(deptIds[0] || (departmentsList[0]?.id || ''));
    setEditMultiDepts(deptIds.length > 0 ? deptIds : (departmentsList[0] ? [departmentsList[0].id] : []));
    setEditDeviceLock(
      typeof user.device_verification_required === 'boolean'
        ? user.device_verification_required
        : true
    );
    setEditMustChangePassword(
      Boolean(
        user.must_change_password &&
          user.must_change_password !== '0' &&
          user.must_change_password !== 0
      )
    );
    setIsEditModalOpen(true);
  };

  // Save Edit User
  const handleSaveEdit = async () => {
    if (!editName.trim() || !editEmail.trim() || !editingUser) {
      Alert.alert('Required', 'Name and Email are required.');
      return;
    }

    let departmentsPayload = [];
    if (editDeptRole === 'ADMIN' || editRole === 'admin') {
      if (editMultiDepts.length === 0) {
        Alert.alert('Required', 'Please select at least one department for Admin scope.');
        return;
      }
      departmentsPayload = editMultiDepts.map((id) => ({
        departmentId: Number(id),
        role: 'ADMIN',
      }));
    } else {
      if (!editSingleDept) {
        Alert.alert('Required', 'Please select a department.');
        return;
      }
      departmentsPayload = [
        {
          departmentId: Number(editSingleDept),
          role: 'USER',
        },
      ];
    }

    try {
      setSavingEdit(true);
      await updateUserByAdmin(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        mobNo: editMobNo.trim(),
        userTypeId: editUserTypeId || null,
        companyId: editCompanyId || null,
        role: editRole,
        deviceVerificationRequired: editDeviceLock,
        mustChangePassword: editMustChangePassword,
        departments: departmentsPayload,
      });
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchData();
      Alert.alert('Success', 'User profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Navigate to Create User Page
  const handleOpenCreate = () => {
    navigation.navigate('CreateUser');
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === 'active' && !u.active) return false;
      if (statusFilter === 'inactive' && u.active) return false;

      if (companyFilter !== 'all') {
        if (String(u.company_id) !== String(companyFilter)) return false;
      }

      if (deptFilter !== 'all') {
        const uDepts = Array.isArray(u.departments) ? u.departments : [];
        const hasDept = uDepts.some((d: any) => String(d.department_id) === String(deptFilter));
        if (!hasDept) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = u.name && u.name.toLowerCase().includes(q);
        const matchUser = u.username && u.username.toLowerCase().includes(q);
        const matchEmail = u.email && u.email.toLowerCase().includes(q);
        const matchPhone = u.mob_no && String(u.mob_no).includes(q);
        return matchName || matchUser || matchEmail || matchPhone;
      }

      return true;
    });
  }, [users, statusFilter, companyFilter, deptFilter, searchQuery]);

  // Filtered Audit Logs List
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = auditSearchQuery.toLowerCase().trim();
      if (!q) return true;
      const matchName = log.user_name && log.user_name.toLowerCase().includes(q);
      const matchEmail = log.user_email && log.user_email.toLowerCase().includes(q);
      const matchDevice = log.device_id && log.device_id.toLowerCase().includes(q);
      const matchApprover = log.approved_by_name && log.approved_by_name.toLowerCase().includes(q);
      return matchName || matchEmail || matchDevice || matchApprover;
    });
  }, [auditLogs, auditSearchQuery]);

  // Selected department label helper
  const selectedDeptLabel = useMemo(() => {
    if (deptFilter === 'all') return 'All Depts';
    const found = departmentsList.find((d) => String(d.id) === String(deptFilter));
    return found ? found.department_name : 'All Depts';
  }, [deptFilter, departmentsList]);

  // Render Header Component for Users FlatList (Search & Filters)
  const renderUsersHeader = () => (
    <View style={styles.listHeader}>
      {/* ── Search Bar & Filter Dropdowns Row ── */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBar}>
          <SearchIcon size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name, email, @username..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <XMarkIcon size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Dropdown Trigger */}
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setIsStatusDropdownOpen(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  statusFilter === 'active'
                    ? '#10b981'
                    : statusFilter === 'inactive'
                    ? '#94a3b8'
                    : colors.primary,
              },
            ]}
          />
          <Text style={styles.dropdownTriggerText} numberOfLines={1}>
            {statusFilter === 'all' ? 'All' : statusFilter === 'active' ? 'Active' : 'Inactive'}
          </Text>
          <ChevronDownIcon size={13} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Department Dropdown Trigger */}
        <TouchableOpacity
          style={styles.dropdownTriggerDept}
          onPress={() => setIsDeptDropdownOpen(true)}
          activeOpacity={0.7}
        >
          <BuildingIcon size={13} color={colors.primary} />
          <Text style={styles.dropdownTriggerText} numberOfLines={1}>
            {selectedDeptLabel}
          </Text>
          <ChevronDownIcon size={13} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Company Filter Bar ── */}
      {companiesList.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.companyFilterBar}
          contentContainerStyle={styles.companyFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.companyFilterChip,
              companyFilter === 'all' && styles.companyFilterChipActive,
            ]}
            onPress={() => setCompanyFilter('all')}
          >
            <Text
              style={[
                styles.companyFilterChipText,
                companyFilter === 'all' && styles.companyFilterChipTextActive,
              ]}
            >
              All Companies
            </Text>
          </TouchableOpacity>
          {companiesList.map((comp) => {
            const isSelected = String(companyFilter) === String(comp.id);
            return (
              <TouchableOpacity
                key={comp.id}
                style={[
                  styles.companyFilterChip,
                  isSelected && styles.companyFilterChipActive,
                ]}
                onPress={() => setCompanyFilter(String(comp.id))}
              >
                <CityIcon
                  size={11}
                  color={isSelected ? '#ffffff' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.companyFilterChipText,
                    isSelected && styles.companyFilterChipTextActive,
                  ]}
                >
                  {comp.company_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="User Master"
        titleAlign="left"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={[styles.createUserBtn, shadows.md]}
            onPress={handleOpenCreate}
            activeOpacity={0.85}
          >
            {/* Linear Gradient Background */}
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                <LinearGradient id="createUserBtnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                  <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100" height="100" fill="url(#createUserBtnGrad)" />
            </Svg>

            <View style={styles.createUserBtnInner}>
              <View style={styles.createUserIconCircle}>
                <PlusIcon size={12} color={colors.buttonPrimary} />
              </View>
              <Text style={styles.createUserBtnText}>Create User</Text>
            </View>
          </TouchableOpacity>
        }
      />

      {/* ── Pill Tab Bar ── */}
      <View style={styles.pillTabBarWrap}>
        <View style={styles.pillTabBar}>
          <TouchableOpacity
            style={[styles.pillTab, activeTab === 'users' && styles.pillTabActive]}
            onPress={() => setActiveTab('users')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.pillTabText, activeTab === 'users' && styles.pillTabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Users Directory ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillTab, activeTab === 'devices' && styles.pillTabActive]}
            onPress={() => setActiveTab('devices')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.pillTabText, activeTab === 'devices' && styles.pillTabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Pending ({pendingDevices.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillTab, activeTab === 'audit' && styles.pillTabActive]}
            onPress={() => setActiveTab('audit')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.pillTabText, activeTab === 'audit' && styles.pillTabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Audit Log ({auditLogs.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content Section ── */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading master data...</Text>
        </View>
      ) : activeTab === 'users' ? (
        /* ── TAB 1: USERS DIRECTORY ── */
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={renderUsersHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 64 },
          ]}
          renderItem={({ item }) => {
            const isActive = Boolean(item.active);
            const isAdm = item.role === 'admin' || (item.type_name && item.type_name.toLowerCase().includes('admin'));
            const userDepts = Array.isArray(item.departments) ? item.departments : [];

            return (
              <View style={[styles.userCard, shadows.sm]}>
                {/* ── Card Header: Avatar with Status Indicator + User & Email + Status Pill ── */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarWrapper}>
                    <View style={[styles.avatarBox, isAdm && styles.avatarBoxAdmin]}>
                      <Text style={styles.avatarText}>{getInitials(item.name || item.username)}</Text>
                    </View>
                    <View
                      style={[
                        styles.avatarStatusBadge,
                        { backgroundColor: isActive ? '#10b981' : '#f59e0b' },
                      ]}
                    />
                  </View>

                  <View style={styles.userInfoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {item.name || item.username}
                      </Text>
                      <View style={styles.usernamePill}>
                        <Text style={styles.usernameText}>@{item.username || '—'}</Text>
                      </View>
                    </View>
                    <View style={styles.emailRow}>
                      <MailIcon size={11} color={colors.textLight} />
                      <Text style={styles.userEmail} numberOfLines={1}>
                        {item.email}
                      </Text>
                    </View>
                    {Boolean(
                      item.must_change_password &&
                        item.must_change_password !== '0' &&
                        item.must_change_password !== 0
                    ) && (
                      <View style={styles.mustChangeBadge}>
                        <LockIcon size={10} color="#be123c" />
                        <Text style={styles.mustChangeBadgeText}>1st Login Password Required</Text>
                      </View>
                    )}
                  </View>

                  {/* Account Status Pill */}
                  <View
                    style={[
                      styles.statusPill,
                      isActive ? styles.statusPillActive : styles.statusPillInactive,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusPulseDot,
                        { backgroundColor: isActive ? '#10b981' : '#f43f5e' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isActive ? '#047857' : '#be123c' },
                      ]}
                    >
                      {isActive ? 'Active' : 'Deactivated'}
                    </Text>
                  </View>
                </View>

                {/* ── Role & Department Scope Row ── */}
                <View style={styles.rolesSection}>
                  {/* Company Badge */}
                  {item.company_name ? (
                    <View style={styles.companyPill}>
                      <CityIcon size={10} color="#0284c7" />
                      <Text style={styles.companyPillText} numberOfLines={1}>
                        {item.company_name}
                      </Text>
                    </View>
                  ) : null}

                  {/* Role / Type */}
                  <View style={[styles.roleBadge, isAdm ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
                    <ShieldUserIcon size={12} color={isAdm ? '#7c3aed' : colors.primary} />
                    <Text style={[styles.roleBadgeText, isAdm ? styles.roleBadgeTextAdmin : styles.roleBadgeTextUser]}>
                      {item.type_name || (isAdm ? 'Admin' : 'Standard Employee')}
                    </Text>
                  </View>

                  {/* Department(s) Badges */}
                  <View style={styles.deptBadgesRow}>
                    {userDepts.length === 0 ? (
                      <View style={styles.unassignedPill}>
                        <Text style={styles.unassignedText}>Unassigned Dept</Text>
                      </View>
                    ) : (
                      userDepts.map((d: any, idx: number) => {
                        const isDeptAdmin = d.department_role === 'ADMIN';
                        return (
                          <View
                            key={d.department_id || idx}
                            style={[
                              styles.deptPill,
                              isDeptAdmin ? styles.deptPillAdmin : styles.deptPillUser,
                            ]}
                          >
                            <BuildingIcon size={10} color={isDeptAdmin ? '#7e22ce' : colors.primary} />
                            <Text
                              style={[
                                styles.deptPillText,
                                isDeptAdmin ? styles.deptPillTextAdmin : styles.deptPillTextUser,
                              ]}
                            >
                              {d.department_name}
                            </Text>
                            {isDeptAdmin && <Text style={styles.starText}>★</Text>}
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>

                {/* ── 2x2 Info Grid: Phone, Joined, Device & Security Lock ── */}
                <View style={styles.infoGrid}>
                  {/* Row 1: Phone & Joined */}
                  <View style={styles.gridRow}>
                    <View style={styles.gridCell}>
                      <View style={[styles.gridIconCircle, { backgroundColor: '#e0e7ff' }]}>
                        <PhoneIcon size={12} color="#4338ca" />
                      </View>
                      <View style={styles.gridCellContent}>
                        <Text style={styles.gridLabel}>Phone</Text>
                        <Text style={styles.gridValue} numberOfLines={1}>
                          {item.mob_no || '—'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.gridVerticalDivider} />

                    <View style={styles.gridCell}>
                      <View style={[styles.gridIconCircle, { backgroundColor: '#e0f2fe' }]}>
                        <CalendarIcon size={12} color="#0284c7" />
                      </View>
                      <View style={styles.gridCellContent}>
                        <Text style={styles.gridLabel}>Joined</Text>
                        <Text style={styles.gridValue} numberOfLines={1}>
                          {item.date_of_join ? new Date(item.date_of_join).toLocaleDateString() : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.gridHorizontalDivider} />

                  {/* Row 2: Device Status & Lock Enforcement */}
                  <View style={styles.gridRow}>
                    <View style={styles.gridCell}>
                      <View style={[styles.gridIconCircle, { backgroundColor: '#fef3c7' }]}>
                        <MobileIcon size={12} color="#d97706" />
                      </View>
                      <View style={styles.gridCellContent}>
                        <Text style={styles.gridLabel}>Device</Text>
                        <View
                          style={[
                            styles.deviceStatusPill,
                            item.device_status === 'approved'
                              ? styles.deviceStatusApproved
                              : item.device_status === 'pending'
                              ? styles.deviceStatusPending
                              : styles.deviceStatusNone,
                          ]}
                        >
                          <Text
                            style={[
                              styles.deviceStatusText,
                              item.device_status === 'approved'
                                ? styles.deviceStatusTextApproved
                                : item.device_status === 'pending'
                                ? styles.deviceStatusTextPending
                                : styles.deviceStatusTextNone,
                            ]}
                          >
                            {item.device_status === 'approved'
                              ? 'Approved'
                              : item.device_status === 'pending'
                              ? 'Pending'
                              : 'No Device'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.gridVerticalDivider} />

                    <View style={styles.gridCell}>
                      <View
                        style={[
                          styles.gridIconCircle,
                          {
                            backgroundColor: item.device_verification_required
                              ? '#dbeafe'
                              : '#f1f5f9',
                          },
                        ]}
                      >
                        <LockIcon
                          size={12}
                          color={item.device_verification_required ? colors.primary : colors.textLight}
                        />
                      </View>
                      <View style={styles.gridCellContent}>
                        <Text style={styles.gridLabel}>Lock Verification</Text>
                        <Text
                          style={[
                            styles.gridValue,
                            Boolean(item.device_verification_required) && {
                              color: colors.primary,
                              fontWeight: fontWeights.bold,
                            },
                          ]}
                        >
                          {item.device_verification_required ? 'Enforced' : 'Optional'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ── Card Footer: Divider + Actions ── */}
                <View style={styles.cardDivider} />
                <View style={styles.cardActionsRow}>
                  {/* Left: Toggle + Revoke */}
                  <View style={styles.cardActionsLeft}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtnToggle,
                        isActive ? styles.actionBtnDeactivate : styles.actionBtnActivate,
                      ]}
                      onPress={() => handleToggleActive(item.id, item.active)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.actionBtnToggleText,
                          isActive ? styles.actionBtnDeactivateText : styles.actionBtnActivateText,
                        ]}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>

                    {item.device_status === 'approved' && (
                      <TouchableOpacity
                        style={styles.actionBtnRevoke}
                        onPress={() => handleRevokeDevice(item.id)}
                        activeOpacity={0.7}
                      >
                        <BanIcon size={12} color="#ef4444" />
                        <Text style={styles.actionBtnRevokeText}>Revoke</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Right: Edit icon only */}
                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => handleOpenEdit(item)}
                    activeOpacity={0.7}
                  >
                    <EditIcon size={16} color="#334155" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <UsersIcon size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || statusFilter !== 'all' || deptFilter !== 'all'
                  ? 'No users match your search and filter criteria.'
                  : 'Start onboarding staff by creating your first user.'}
              </Text>
            </View>
          }
        />
      ) : activeTab === 'devices' ? (
        /* ── TAB 2: PENDING DEVICES (WITH ALL FRONTEND FIELDS) ── */
        <FlatList
          data={pendingDevices}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 64 },
          ]}
          renderItem={({ item }) => {
            const hasRolePerm = Boolean(item.has_role_download_perm !== 0 && item.has_role_download_perm !== false);

            return (
              <View style={[styles.userCard, shadows.sm]}>
                {/* ── Top Header: User Information & Status ── */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.avatarBox, { backgroundColor: '#f97316' }]}>
                    <Text style={styles.avatarText}>{getInitials(item.user_name || item.username)}</Text>
                  </View>

                  <View style={styles.userInfoCol}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {item.user_name || item.username || 'User'}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {item.user_email || 'No email registered'}
                    </Text>
                  </View>

                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>PENDING APPROVAL</Text>
                  </View>
                </View>

                {/* ── Device Fingerprint / ID ── */}
                <View style={styles.detailSectionBox}>
                  <Text style={styles.detailSectionLabel}>DEVICE FINGERPRINT / ID</Text>
                  <Text style={styles.monoIdText} numberOfLines={1} selectable>
                    {item.device_id}
                  </Text>
                </View>

                {/* ── User Role & Download Permission ── */}
                <View style={styles.rolesSection}>
                  <View style={[styles.roleBadge, styles.roleBadgeUser]}>
                    <Text style={[styles.roleBadgeText, styles.roleBadgeTextUser]}>
                      {item.user_type_name || item.user_role || 'User'}
                    </Text>
                  </View>

                  {hasRolePerm ? (
                    <View style={styles.permBadgeAllowed}>
                      <CheckIcon size={10} color="#059669" />
                      <Text style={styles.permBadgeAllowedText}>Role Permitted Download</Text>
                    </View>
                  ) : (
                    <View style={styles.permBadgeRestricted}>
                      <BanIcon size={10} color="#64748b" />
                      <Text style={styles.permBadgeRestrictedText}>No Download Permission</Text>
                    </View>
                  )}
                </View>

                {/* ── Submitted Timestamp ── */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <ClockIcon size={12} color={colors.textLight} />
                    <Text style={styles.metaText}>
                      Submitted: {new Date(item.submitted_at || item.created_at || Date.now()).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* ── Approval Action Button ── */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.approveBtnGreen}
                    onPress={() => handleOpenApproveModal(item)}
                    activeOpacity={0.8}
                  >
                    <ShieldCheckIcon size={15} color="#ffffff" />
                    <Text style={styles.approveBtnGreenText}>Approve Device</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MobileIcon size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Devices Pending</Text>
              <Text style={styles.emptyText}>All employee login devices have been authorized.</Text>
            </View>
          }
        />
      ) : (
        /* ── TAB 3: DEVICE AUDIT LOGS (WITH ALL FRONTEND FIELDS) ── */
        <FlatList
          data={filteredAuditLogs}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.searchBar}>
                <SearchIcon size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search audit logs by name, email, device ID..."
                  placeholderTextColor={colors.textLight}
                  value={auditSearchQuery}
                  onChangeText={setAuditSearchQuery}
                />
                {auditSearchQuery ? (
                  <TouchableOpacity onPress={() => setAuditSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <XMarkIcon size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 64 },
          ]}
          renderItem={({ item }) => {
            const isApproved = item.status === 'approved';
            const isPending = item.status === 'pending';
            const isAllowed = item.allow_download === 1 || item.allow_download === true;

            return (
              <View style={[styles.userCard, shadows.sm]}>
                {/* ── Header: User & Status Badge ── */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.avatarBox, { backgroundColor: isApproved ? '#059669' : isPending ? '#d97706' : '#dc2626' }]}>
                    <Text style={styles.avatarText}>{getInitials(item.user_name || item.name)}</Text>
                  </View>

                  <View style={styles.userInfoCol}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {item.user_name || item.name || 'User'}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {item.user_email || item.email || '—'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.auditStatusBadge,
                      isApproved
                        ? styles.auditStatusApproved
                        : isPending
                        ? styles.auditStatusPending
                        : styles.auditStatusRevoked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.auditStatusText,
                        isApproved
                          ? styles.auditStatusTextApproved
                          : isPending
                          ? styles.auditStatusTextPending
                          : styles.auditStatusTextRevoked,
                      ]}
                    >
                      {(item.status || 'UNKNOWN').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* ── Device Fingerprint / ID ── */}
                <View style={styles.detailSectionBox}>
                  <Text style={styles.detailSectionLabel}>DEVICE FINGERPRINT / ID</Text>
                  <Text style={styles.monoIdText} numberOfLines={1} selectable>
                    {item.device_id}
                  </Text>
                </View>

                {/* ── Download Policy (if approved) ── */}
                {isApproved && (
                  <View style={[styles.rolesSection, { marginBottom: 6 }]}>
                    <View style={isAllowed ? styles.permBadgeAllowed : styles.permBadgeWarning}>
                      <Text style={isAllowed ? styles.permBadgeAllowedText : styles.permBadgeWarningText}>
                        Policy: {isAllowed ? 'Downloads Allowed' : 'In-App View Only'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── Submitted & Approver/Revoker Timestamps ── */}
                <View style={styles.auditDetailsCol}>
                  <View style={styles.auditDetailRow}>
                    <ClockIcon size={12} color={colors.textLight} />
                    <Text style={styles.auditDetailText}>
                      Submitted: {new Date(item.submitted_at).toLocaleString()}
                    </Text>
                  </View>

                  {item.approved_by_name && (
                    <View style={styles.auditDetailRow}>
                      <CheckIcon size={12} color="#059669" />
                      <Text style={[styles.auditDetailText, { color: '#047857' }]}>
                        Approved by: {item.approved_by_name} on {new Date(item.approved_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {item.closed_by_name && (
                    <View style={styles.auditDetailRow}>
                      <BanIcon size={12} color="#dc2626" />
                      <Text style={[styles.auditDetailText, { color: '#b91c1c' }]}>
                        Revoked by: {item.closed_by_name} on {new Date(item.closed_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ClockIcon size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Device Audit Logs</Text>
              <Text style={styles.emptyText}>All device authorization events will appear here.</Text>
            </View>
          }
        />
      )}

      {/* ── DEVICE APPROVAL MODAL (WITH DOWNLOAD POLICY CHOICE) ── */}
      <Modal visible={Boolean(approvingDevice)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: '#ecfdf5' }]}>
                  <ShieldCheckIcon size={20} color="#059669" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Authorize Device</Text>
                  <Text style={styles.modalSubtitle}>Hardware authentication approval</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setApprovingDevice(null)}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {approvingDevice && (
              <View style={{ gap: spacing.md }}>
                <View style={styles.detailSectionBox}>
                  <Text style={styles.detailSectionLabel}>TARGET EMPLOYEE</Text>
                  <Text style={styles.userName}>{approvingDevice.user_name || approvingDevice.username}</Text>
                  <Text style={styles.userEmail}>{approvingDevice.user_email}</Text>
                </View>

                <View style={styles.detailSectionBox}>
                  <Text style={styles.detailSectionLabel}>DEVICE FINGERPRINT</Text>
                  <Text style={styles.monoIdText} numberOfLines={1}>
                    {approvingDevice.device_id}
                  </Text>
                </View>

                {/* Role download capability check */}
                {Boolean(approvingDevice.has_role_download_perm !== 0 && approvingDevice.has_role_download_perm !== false) ? (
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchLabel}>Enable Document Downloads</Text>
                      <Text style={styles.switchDesc}>
                        Permit this hardware device to download and export files locally
                      </Text>
                    </View>
                    <Switch
                      value={allowDownloadChoice}
                      onValueChange={setAllowDownloadChoice}
                      trackColor={{ false: colors.border, true: '#10b981' }}
                    />
                  </View>
                ) : (
                  <View style={styles.permBadgeRestricted}>
                    <BanIcon size={12} color="#64748b" />
                    <Text style={styles.permBadgeRestrictedText}>
                      User role policy restricts downloads. This device will be authorized with in-app view only.
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <AppButton
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setApprovingDevice(null)}
                    style={{ flex: 1 }}
                  />
                  <AppButton
                    title="Confirm Approval"
                    onPress={handleConfirmApproveDevice}
                    loading={submittingApproval}
                    style={{ flex: 1, backgroundColor: '#059669' }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── STATUS DROPDOWN MODAL ── */}
      <Modal visible={isStatusDropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsStatusDropdownOpen(false)}
        >
          <View style={[styles.dropdownModalContent, shadows.lg]}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Filter by Status</Text>
              <TouchableOpacity onPress={() => setIsStatusDropdownOpen(false)}>
                <XMarkIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'All Users', value: 'all', dotColor: colors.primary },
              { label: 'Active Only', value: 'active', dotColor: '#10b981' },
              { label: 'Inactive / Deactivated', value: 'inactive', dotColor: '#94a3b8' },
            ].map((opt) => {
              const isSelected = statusFilter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.dropdownOptionItem, isSelected && styles.dropdownOptionItemActive]}
                  onPress={() => {
                    setStatusFilter(opt.value as any);
                    setIsStatusDropdownOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownOptionLeft}>
                    <View style={[styles.statusDot, { backgroundColor: opt.dotColor }]} />
                    <Text style={[styles.dropdownOptionLabel, isSelected && styles.dropdownOptionLabelActive]}>
                      {opt.label}
                    </Text>
                  </View>
                  {isSelected && <CheckIcon size={16} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── DEPARTMENT DROPDOWN MODAL ── */}
      <Modal visible={isDeptDropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsDeptDropdownOpen(false)}
        >
          <View style={[styles.dropdownModalContent, shadows.lg, { maxHeight: '60%' }]}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Filter by Department</Text>
              <TouchableOpacity onPress={() => setIsDeptDropdownOpen(false)}>
                <XMarkIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.dropdownOptionItem, deptFilter === 'all' && styles.dropdownOptionItemActive]}
                onPress={() => {
                  setDeptFilter('all');
                  setIsDeptDropdownOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownOptionLeft}>
                  <BuildingIcon size={14} color={colors.primary} />
                  <Text style={[styles.dropdownOptionLabel, deptFilter === 'all' && styles.dropdownOptionLabelActive]}>
                    All Departments
                  </Text>
                </View>
                {deptFilter === 'all' && <CheckIcon size={16} color={colors.primary} />}
              </TouchableOpacity>

              {departmentsList.map((dept) => {
                const isSelected = String(deptFilter) === String(dept.id);
                return (
                  <TouchableOpacity
                    key={dept.id}
                    style={[styles.dropdownOptionItem, isSelected && styles.dropdownOptionItemActive]}
                    onPress={() => {
                      setDeptFilter(String(dept.id));
                      setIsDeptDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownOptionLeft}>
                      <BuildingIcon size={14} color={colors.textMuted} />
                      <Text style={[styles.dropdownOptionLabel, isSelected && styles.dropdownOptionLabelActive]}>
                        {dept.department_name}
                      </Text>
                    </View>
                    {isSelected && <CheckIcon size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── EDIT USER MODAL ── */}
      <Modal visible={isEditModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: '#eef2ff' }]}>
                  <EditIcon size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Edit User Profile</Text>
                  <Text style={styles.modalSubtitle}>Update credentials & department scope</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>
                Full Name <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Employee full name"
                placeholderTextColor={colors.textLight}
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.inputLabel}>
                Email Address <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="email@company.com"
                placeholderTextColor={colors.textLight}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor={colors.textLight}
                value={editMobNo}
                onChangeText={setEditMobNo}
                keyboardType="phone-pad"
              />

              {/* Company Entity */}
              <Text style={styles.inputLabel}>Company Entity</Text>
              <View style={styles.pickerChipsRow}>
                {companiesList.map((c) => {
                  const isSelected = editCompanyId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.pickerChip, isSelected && styles.pickerChipActive]}
                      onPress={() => setEditCompanyId(c.id)}
                      activeOpacity={0.7}
                    >
                      <CityIcon size={12} color={isSelected ? '#ffffff' : colors.textSecondary} />
                      <Text style={[styles.pickerChipText, isSelected && styles.pickerChipTextActive]}>
                        {c.company_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Role Profile */}
              <Text style={styles.inputLabel}>Role Profile</Text>
              <View style={styles.pickerChipsRow}>
                {userTypesList.map((t) => {
                  const isSelected = String(editUserTypeId) === String(t.id);
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.pickerChip, isSelected && styles.pickerChipActive]}
                      onPress={() => {
                        setEditUserTypeId(t.id);
                        const isSuper = (t.type_name || '').toLowerCase().includes('admin');
                        setEditRole(isSuper ? 'admin' : 'user');
                        setEditDeptRole(isSuper ? 'ADMIN' : 'USER');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerChipText, isSelected && styles.pickerChipTextActive]}>
                        {t.type_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Department Scope */}
              <Text style={styles.inputLabel}>Assigned Department</Text>
              <View style={styles.pickerChipsRow}>
                {departmentsList.map((d) => {
                  const isSelected =
                    editDeptRole === 'ADMIN'
                      ? editMultiDepts.includes(d.id)
                      : String(editSingleDept) === String(d.id);

                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.pickerChip, isSelected && styles.pickerChipActive]}
                      onPress={() => {
                        if (editDeptRole === 'ADMIN') {
                          setEditMultiDepts((prev) =>
                            prev.includes(d.id) ? prev.filter((id) => id !== d.id) : [...prev, d.id]
                          );
                        } else {
                          setEditSingleDept(d.id);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerChipText, isSelected && styles.pickerChipTextActive]}>
                        {d.department_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Device Lock Switch */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Device Verification Lock</Text>
                  <Text style={styles.switchDesc}>Require admin device authorization on new logins</Text>
                </View>
                <Switch
                  value={editDeviceLock}
                  onValueChange={setEditDeviceLock}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              {/* Require First-Time Password Change Switch */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Require Password Change on Next Login</Text>
                  <Text style={styles.switchDesc}>Enforces mandatory first-time password screen</Text>
                </View>
                <Switch
                  value={editMustChangePassword}
                  onValueChange={setEditMustChangePassword}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              <View style={styles.modalActions}>
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsEditModalOpen(false)}
                  style={{ flex: 1 }}
                />
                <AppButton
                  title="Save Changes"
                  onPress={handleSaveEdit}
                  loading={savingEdit}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingBottom: 80,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  /* ── Upper Action Header (Above Tabs) ── */
  upperActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: spacing.sm,
  },
  upperActionTextCol: {
    flex: 1,
  },

  /* ── Pill Tab Bar ── */
  pillTabBarWrap: {
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pillTabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  pillTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 20,
  },
  pillTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  pillTabText: {
    fontSize: 11.5,
    fontWeight: fontWeights.semibold,
    color: '#64748b',
    textAlign: 'center',
  },
  pillTabTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.extrabold,
  },

  /* ── Inside Screen Header ── */
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  screenHeading: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  screenSubheading: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: fontWeights.medium,
  },

  createUserBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.buttonPrimary,
    flexShrink: 0,
    justifyContent: 'center',
  },
  createUserBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  createUserIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  createUserBtnText: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  /* ── Search & Filter Row ── */
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    height: 40,
    gap: 4,
  },
  dropdownTriggerDept: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    height: 40,
    maxWidth: 110,
    gap: 4,
  },
  dropdownTriggerText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  companyFilterBar: {
    marginTop: spacing.sm,
  },
  companyFilterContent: {
    gap: 6,
    paddingRight: spacing.sm,
  },
  companyFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    gap: 5,
  },
  companyFilterChipActive: {
    backgroundColor: colors.primary,
  },
  companyFilterChipText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  companyFilterChipTextActive: {
    color: '#ffffff',
  },
  companyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 3.5,
  },
  companyPillText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: '#0369a1',
  },

  /* ── User Card Architecture ── */
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e8edf3',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 10,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.sm + 2,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight:3
  },
  avatarBoxAdmin: {
    backgroundColor: '#7c3aed',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14.5,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  usernamePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  usernameText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 11.5,
    color: colors.textMuted,
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  statusPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusPillInactive: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  statusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },

  /* ── Role & Departments ── */
  rolesSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  roleBadgeAdmin: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  roleBadgeUser: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryMuted,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
  },
  roleBadgeTextAdmin: {
    color: '#7c3aed',
  },
  roleBadgeTextUser: {
    color: colors.primary,
  },
  deptBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  deptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3.5,
  },
  deptPillAdmin: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  deptPillUser: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  deptPillText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
  },
  deptPillTextAdmin: {
    color: '#6b21a8',
  },
  deptPillTextUser: {
    color: '#475569',
  },
  starText: {
    color: '#7e22ce',
    fontSize: 9,
    fontWeight: fontWeights.black,
  },
  unassignedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  unassignedText: {
    fontSize: 9.5,
    color: colors.textLight,
    fontStyle: 'italic',
  },

  /* ── 2x2 Info Grid ── */
  infoGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginVertical: 8,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  gridCellContent: {
    flex: 1,
  },
  gridIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridVerticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  gridHorizontalDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridValue: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
    marginTop: 1,
  },

  /* ── Metadata Row (For Audit / Device Tab) ── */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10.5,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  deviceStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1,
  },
  deviceStatusApproved: {
    backgroundColor: '#dcfce7',
  },
  deviceStatusPending: {
    backgroundColor: '#fef3c7',
  },
  deviceStatusNone: {
    backgroundColor: '#f1f5f9',
  },
  deviceStatusText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
  },
  deviceStatusTextApproved: {
    color: '#15803d',
  },
  deviceStatusTextPending: {
    color: '#b45309',
  },
  deviceStatusTextNone: {
    color: colors.textMuted,
  },

  /* ── Actions Row ── */
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  actionBtnEdit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flexShrink: 0,
  },
  actionBtnEditText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  actionBtnToggle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnDeactivate: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  actionBtnActivate: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  actionBtnToggleText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
  actionBtnDeactivateText: {
    color: '#e11d48',
  },
  actionBtnActivateText: {
    color: '#059669',
  },
  actionBtnRevoke: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 7.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  actionBtnRevokeText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    color: '#ef4444',
  },

  /* ── Detail Box (Device Fingerprint & Info) ── */
  detailSectionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.sm,
  },
  detailSectionLabel: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  monoIdText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },

  /* ── Permissions Badges ── */
  permBadgeAllowed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 4,
  },
  permBadgeAllowedText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: '#047857',
  },
  permBadgeRestricted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  permBadgeRestrictedText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  permBadgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 4,
  },
  permBadgeWarningText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: '#b45309',
  },

  /* ── Approve Device Button ── */
  approveBtnGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  approveBtnGreenText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },

  /* ── Audit Status Badges ── */
  auditStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  auditStatusApproved: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  auditStatusPending: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  auditStatusRevoked: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  auditStatusText: {
    fontSize: 9,
    fontWeight: fontWeights.black,
    letterSpacing: 0.4,
  },
  auditStatusTextApproved: {
    color: '#047857',
  },
  auditStatusTextPending: {
    color: '#b45309',
  },
  auditStatusTextRevoked: {
    color: '#dc2626',
  },

  /* ── Audit Details Column ── */
  auditDetailsCol: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 4,
  },
  auditDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditDetailText: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },

  /* ── Pending Badge ── */
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pendingBadgeText: {
    fontSize: 8.5,
    fontWeight: fontWeights.extrabold,
    color: '#b45309',
  },

  /* ── Empty State ── */
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },

  /* ── Modals Common ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  modalHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
    marginTop: 6,
  },
  input: {
    height: 42,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pickerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  pickerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  pickerChipActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  pickerChipText: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  pickerChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  switchDesc: {
    fontSize: 10,
    color: colors.textMuted,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },

  /* ── Dropdown Modal ── */
  dropdownModalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownModalTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  dropdownOptionItemActive: {
    backgroundColor: colors.primarySubtle,
  },
  dropdownOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropdownOptionLabel: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  dropdownOptionLabelActive: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  mustChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  mustChangeBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: '#be123c',
  },
});
