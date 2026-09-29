import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import {
  ShieldCheckIcon,
  ShieldUserIcon,
  UsersIcon,
  UserIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  XMarkIcon,
  ChevronDownIcon,
  CheckIcon,
  CrownIcon,
  RefreshIcon,
  BuildingIcon,
  LockIcon,
  MessagesSquareIcon,
  CameraIcon,
  EyeIcon,
  PaperclipIcon,
  MobileIcon,
  ChartIcon,
  CloudIcon,
  DownloadIcon,
} from '../../components/icons/SvgIcons';
import {
  getUserTypes,
  createUserType,
  updateUserType,
  deleteUserType,
} from '../../api/adminApi';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';

// ─── Permission Configs ───────────────────────────────────────────────────────
const PERMISSION_CONFIGS = [
  {
    category: 'Department & Administrative Governance',
    description: 'Authority to manage department users, edit client permissions, and view audit trails',
    tier: 'admin',
    items: [
      {
        key: 'user_master',
        title: 'Manage Department Users & Client Permissions',
        badge: '🛡️ Client Perms',
        requiresAdmin: true,
      },
      {
        key: 'department_master',
        title: 'Department Master & Boundaries',
        badge: '🏢 Depts',
        requiresAdmin: true,
      },
      {
        key: 'user_type',
        title: 'User Role & Permission Master',
        badge: '👑 Roles',
        requiresAdmin: true,
      },
      {
        key: 'device_approval',
        title: 'Device Approval & Security Keys',
        badge: '📱 Devices',
        requiresAdmin: true,
      },
      {
        key: 'activity_report',
        title: 'Activity Logs & Security Audit Trail',
        badge: '📊 Audit Logs',
        requiresAdmin: true,
      },
      {
        key: 'cloud_storage',
        title: 'Cloud Storage Master',
        badge: '☁️ Storage',
        requiresAdmin: true,
      },
    ],
  },
  {
    category: 'Communication & Messaging Channels',
    description: 'Control direct messaging, live photo capture, and department group channels',
    tier: 'common',
    items: [
      {
        key: 'chat',
        title: 'Send Messages (Chat Access)',
        badge: '💬 Chat',
        requiresAdmin: false,
      },
      {
        key: 'camera_access',
        title: 'Live Camera & Instant Photo Capture',
        badge: '📷 Camera',
        requiresAdmin: false,
      },
      {
        key: 'group_create',
        title: 'Create Department Group Channels',
        badge: '👥 Groups',
        requiresAdmin: false,
      },
    ],
  },
  {
    category: 'Document & File Security',
    description: 'Control in-app file previewing, attachments upload, and local downloading',
    tier: 'common',
    items: [
      {
        key: 'document_view',
        title: 'File & Document Preview (In-App Protected View)',
        badge: '👁️ In-App View',
        requiresAdmin: false,
      },
      {
        key: 'document_upload',
        title: 'File Sharing & Attachments Upload',
        badge: '📎 Upload',
        requiresAdmin: false,
      },
      {
        key: 'document_download',
        title: 'Download Files to Local Storage',
        badge: '📥 Download',
        requiresAdmin: false,
      },
    ],
  },
];

const ALL_MASTER_KEYS = PERMISSION_CONFIGS.flatMap((c) => c.items.map((i) => i.key));

const CAPABILITY_TILES: Record<
  string,
  { label: string; icon: (color: string) => React.ReactNode; color: string; bg: string; border: string }
> = {
  user_master: {
    label: 'Client Perms',
    icon: (c) => <ShieldCheckIcon size={20} color={c} />,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  department_master: {
    label: 'Departments',
    icon: (c) => <BuildingIcon size={20} color={c} />,
    color: colors.primary,
    bg: colors.primarySubtle,
    border: colors.primaryMuted,
  },
  user_type: {
    label: 'User Roles',
    icon: (c) => <CrownIcon size={20} color={c} />,
    color: '#9333ea',
    bg: '#faf5ff',
    border: '#e9d5ff',
  },
  device_approval: {
    label: 'Devices',
    icon: (c) => <MobileIcon size={20} color={c} />,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  activity_report: {
    label: 'Audit Logs',
    icon: (c) => <ChartIcon size={20} color={c} />,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  cloud_storage: {
    label: 'Storage',
    icon: (c) => <CloudIcon size={20} color={c} />,
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
  },
  chat: {
    label: 'Chat Access',
    icon: (c) => <MessagesSquareIcon size={20} color={c} />,
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
  camera_access: {
    label: 'Live Camera',
    icon: (c) => <CameraIcon size={20} color={c} />,
    color: colors.primary,
    bg: colors.primarySubtle,
    border: colors.primaryMuted,
  },
  group_create: {
    label: 'Group Chat',
    icon: (c) => <UsersIcon size={20} color={c} />,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  document_view: {
    label: 'View Docs',
    icon: (c) => <EyeIcon size={20} color={c} />,
    color: '#475569',
    bg: '#f8fafc',
    border: '#cbd5e1',
  },
  document_upload: {
    label: 'Upload Files',
    icon: (c) => <PaperclipIcon size={20} color={c} />,
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
  document_download: {
    label: 'Download',
    icon: (c) => <DownloadIcon size={20} color={c} />,
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4',
  },
};

const ROLE_PRESETS = [
  {
    name: 'Super Admin',
    categoryTier: 'ADMIN',
    badge: 'Global Full Access',
    color: '#faf5ff',
    borderColor: '#e9d5ff',
    textColor: '#7c3aed',
    activeKeys: ALL_MASTER_KEYS,
  },
  {
    name: 'Department Admin',
    categoryTier: 'ADMIN',
    badge: 'Dept Admin',
    color: colors.primarySubtle,
    borderColor: colors.primaryMuted,
    textColor: colors.primary,
    activeKeys: [
      'user_master',
      'department_master',
      'device_approval',
      'activity_report',
      'chat',
      'camera_access',
      'group_create',
      'document_view',
      'document_upload',
      'document_download',
    ],
  },
  {
    name: 'User',
    categoryTier: 'USER',
    badge: 'Department User',
    color: '#ecfdf5',
    borderColor: '#a7f3d0',
    textColor: '#059669',
    activeKeys: [
      'chat',
      'camera_access',
      'document_view',
      'document_upload',
      'document_download',
    ],
  },
];

interface UserTypeMasterScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UserTypeMaster'>;
}

export const UserTypeMasterScreen: React.FC<UserTypeMasterScreenProps> = ({ navigation }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'ADMIN' | 'USER'>('all');
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);

  // Edit / Create Modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [typeName, setTypeName] = useState('');
  const [modalRoleTier, setModalRoleTier] = useState<'ADMIN' | 'USER'>('USER');
  const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Load user types
  const fetchData = useCallback(async () => {
    try {
      const res = await getUserTypes();
      const list = res.data?.data || res.data || [];
      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load user types:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // KPI Stats
  const stats = useMemo(() => {
    const total = data.length;
    const adminRoles = data.filter((r) =>
      (r.permissions || []).some(
        (p: any) =>
          (p.canRead || p.canWrite) &&
          ['user_master', 'department_master', 'user_type'].includes(p.masterName)
      )
    ).length;
    const userRoles = total - adminRoles;
    return { total, adminRoles, userRoles };
  }, [data]);

  // Filtered List
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (row.type_name && row.type_name.toLowerCase().includes(q)) ||
        (row.permissions || []).some((p: any) =>
          p.masterName && p.masterName.toLowerCase().includes(q)
        );

      if (!matchesSearch) return false;

      if (tierFilter === 'all') return true;

      const hasAdminPerm = (row.permissions || []).some(
        (p: any) =>
          (p.canRead || p.canWrite) &&
          ['user_master', 'department_master', 'user_type'].includes(p.masterName)
      );

      return tierFilter === 'ADMIN' ? hasAdminPerm : !hasAdminPerm;
    });
  }, [data, searchQuery, tierFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedId(null);
    setTypeName('');
    setModalRoleTier('USER');
    const initialToggles: Record<string, boolean> = {};
    ALL_MASTER_KEYS.forEach((k) => {
      initialToggles[k] = ['chat', 'camera_access', 'document_view', 'document_upload', 'document_download'].includes(k);
    });
    setActiveToggles(initialToggles);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (row: any) => {
    setModalMode('edit');
    setSelectedId(row.id);
    setTypeName(row.type_name || '');

    const hasAdminPerm = (row.permissions || []).some(
      (p: any) =>
        (p.canRead || p.canWrite) &&
        ['user_master', 'department_master', 'user_type'].includes(p.masterName)
    );
    setModalRoleTier(hasAdminPerm ? 'ADMIN' : 'USER');

    const toggles: Record<string, boolean> = {};
    ALL_MASTER_KEYS.forEach((k) => {
      const found = (row.permissions || []).find((p: any) => p.masterName === k);
      toggles[k] = found ? Boolean(found.canRead || found.canWrite) : false;
    });
    setActiveToggles(toggles);
    setIsModalOpen(true);
  };

  // Toggle single permission key
  const handleToggleKey = (key: string) => {
    setActiveToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Switch Tier
  const handleSelectRoleTier = (tier: 'ADMIN' | 'USER') => {
    setModalRoleTier(tier);
    if (tier === 'ADMIN') {
      setActiveToggles((prev) => ({
        ...prev,
        user_master: true,
        department_master: true,
        device_approval: true,
        activity_report: true,
        chat: true,
        camera_access: true,
        group_create: true,
        document_view: true,
        document_upload: true,
        document_download: true,
      }));
    } else {
      setActiveToggles((prev) => ({
        ...prev,
        user_master: false,
        department_master: false,
        user_type: false,
        device_approval: false,
        activity_report: false,
        cloud_storage: false,
        chat: true,
        camera_access: true,
        group_create: true,
        document_view: true,
        document_upload: true,
        document_download: true,
      }));
    }
  };

  // Apply Preset
  const applyPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setModalRoleTier(preset.categoryTier as any);
    const updated: Record<string, boolean> = {};
    ALL_MASTER_KEYS.forEach((k) => {
      updated[k] = preset.activeKeys.includes(k);
    });
    setActiveToggles(updated);
  };

  // Select / Deselect All
  const handleToggleAll = (enableAll: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_MASTER_KEYS.forEach((k) => {
      updated[k] = enableAll;
    });
    setActiveToggles(updated);
  };

  // Save Role
  const handleSaveRole = async () => {
    if (!typeName.trim()) {
      Alert.alert('Required', 'Role name cannot be empty.');
      return;
    }

    const permissions = ALL_MASTER_KEYS.map((key) => {
      const isEnabled = Boolean(activeToggles[key]);
      const isAdminMaster = [
        'user_master',
        'department_master',
        'user_type',
        'cloud_storage',
        'device_approval',
        'activity_report',
      ].includes(key);
      return {
        masterName: key,
        canRead: isEnabled,
        canWrite: isEnabled,
        canUpdate: isAdminMaster ? isEnabled : false,
        canDelete: isAdminMaster ? isEnabled : false,
      };
    });

    setSaving(true);
    try {
      if (modalMode === 'create') {
        await createUserType({
          typeName: typeName.trim(),
          permissions,
        });
        Alert.alert('Success', `Role profile "${typeName.trim()}" created successfully.`);
      } else if (selectedId) {
        await updateUserType(selectedId, {
          typeName: typeName.trim(),
          permissions,
        });
        Alert.alert('Success', `Role profile "${typeName.trim()}" updated successfully.`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save role.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  // Delete Role
  const handleDeleteRole = (row: any) => {
    Alert.alert(
      'Delete Role Profile',
      `Are you sure you want to delete "${row.type_name}"? Users assigned to this role will lose their custom permission profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserType(row.id);
              Alert.alert('Success', `Role "${row.type_name}" has been deleted.`);
              fetchData();
            } catch (err: any) {
              const msg = err.response?.data?.message || err.message || 'Failed to delete role.';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  // Render capability badges for each card as small square cards with icon and text
  const renderCapabilityBadges = (permissions: any[]) => {
    if (!permissions || permissions.length === 0) {
      return (
        <View style={styles.emptyPermBox}>
          <LockIcon size={14} color="#94a3b8" />
          <Text style={styles.emptyPermText}>No permissions configured</Text>
        </View>
      );
    }

    const enabledKeys = new Set(
      permissions.filter((p: any) => p.canRead || p.canWrite).map((p: any) => p.masterName)
    );

    const activeItems = PERMISSION_CONFIGS.flatMap((c) => c.items).filter((item) =>
      enabledKeys.has(item.key)
    );

    if (activeItems.length === 0) {
      return (
        <View style={styles.emptyPermBox}>
          <LockIcon size={14} color="#94a3b8" />
          <Text style={styles.emptyPermText}>All access restricted</Text>
        </View>
      );
    }

    return (
      <View style={styles.capabilitiesGrid}>
        {activeItems.map((item) => {
          const tile = CAPABILITY_TILES[item.key] || {
            label: item.badge,
            icon: (c: string) => <LockIcon size={19} color={c} />,
            color: '#64748b',
            bg: '#f8fafc',
            border: '#e2e8f0',
          };

          return (
            <View
              key={item.key}
              style={[
                styles.capabilitySquareCard,
                { backgroundColor: tile.bg, borderColor: tile.border },
              ]}
            >
              <View style={styles.squareCardIconWrap}>
                {tile.icon(tile.color)}
              </View>
              <Text
                style={[styles.squareCardLabel, { color: tile.color }]}
                numberOfLines={1}
              >
                {tile.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Header Component for List
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* ── Top Action Bar: Title & "+ Create Role" Button ── */}
      <View style={styles.topActionBar}>
        <View style={styles.topActionLeft}>
          <Text style={styles.screenHeading}>Role & Permissions</Text>
          <Text style={styles.screenSubheading}>
            {data.length} {data.length === 1 ? 'role profile' : 'role profiles'} configured
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createRoleBtn, shadows.md]}
          onPress={handleOpenCreate}
          activeOpacity={0.85}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id="createRoleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#createRoleGrad)" />
          </Svg>

          <View style={styles.createRoleBtnInner}>
            <View style={styles.createRoleIconCircle}>
              <PlusIcon size={12} color={colors.buttonPrimary} />
            </View>
            <Text style={styles.createRoleBtnText}>Create Role</Text>
          </View>
        </TouchableOpacity>
      </View>
      {/* ── Search Bar & Authority Tier Filter Row ── */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBar}>
          <SearchIcon size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roles by title or capability..."
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

        <TouchableOpacity
          style={styles.tierDropdownTrigger}
          onPress={() => setIsTierDropdownOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.tierDropdownText} numberOfLines={1}>
            {tierFilter === 'all'
              ? 'All Tiers'
              : tierFilter === 'ADMIN'
              ? 'Admin Tier'
              : 'User Tier'}
          </Text>
          <ChevronDownIcon size={13} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="User Type Master"
        showBack
        rightAction
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading role profiles & permission sets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const permissions = item.permissions || [];
            const hasAdminPerm = permissions.some(
              (p: any) =>
                (p.canRead || p.canWrite) &&
                ['user_master', 'department_master', 'user_type'].includes(p.masterName)
            );
            const enabledKeys = new Set(
              permissions.filter((p: any) => p.canRead || p.canWrite).map((p: any) => p.masterName)
            );
            const activeCount = PERMISSION_CONFIGS.flatMap((c) => c.items).filter((i) =>
              enabledKeys.has(i.key)
            ).length;
            const isFullAccess = ALL_MASTER_KEYS.length > 0 && ALL_MASTER_KEYS.every((k) => enabledKeys.has(k));

            return (
              <View style={[styles.roleCard, shadows.sm]}>
                {/* ── Card Header: #ID, Role Title & Tier Pill ── */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.idTagBox}>
                    <Text style={styles.idTagText}>{item.id}.</Text>
                  </View>
                  <View style={styles.roleInfoCol}>
                    <View style={styles.roleTitleRow}>
                      <Text style={styles.roleNameText} numberOfLines={1}>
                        {item.type_name}
                      </Text>
                      <View
                        style={[
                          styles.tierBadge,
                          hasAdminPerm ? styles.tierBadgeAdmin : styles.tierBadgeUser,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tierBadgeText,
                            hasAdminPerm ? styles.tierBadgeTextAdmin : styles.tierBadgeTextUser,
                          ]}
                        >
                          {hasAdminPerm ? 'Admin Tier' : 'User Tier'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ── Granted Capabilities & Permissions Section ── */}
                <View style={styles.capabilitiesContainer}>
                  <View style={styles.capabilitiesHeaderRow}>
                    <Text style={styles.capabilitiesHeading}>GRANTED CAPABILITIES & PERMISSIONS</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {isFullAccess
                          ? '12/12 FULL ACCESS'
                          : activeCount > 0
                          ? `${activeCount} ACTIVE`
                          : 'RESTRICTED'}
                      </Text>
                    </View>
                  </View>
                  {renderCapabilityBadges(item.permissions)}
                </View>

                {/* ── Card Footer Actions (Edit & Delete - Symbol Only) ── */}
                <View style={styles.cardFooterRow}>
                  <Text style={styles.addedByText} numberOfLines={1}>
                    Added by {item.added_by_name || 'Admin User'}
                  </Text>

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtnEditSquare}
                      onPress={() => handleOpenEdit(item)}
                      activeOpacity={0.7}
                      accessibilityLabel="Edit Role"
                    >
                      <EditIcon size={15} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDeleteSquare}
                      onPress={() => handleDeleteRole(item)}
                      activeOpacity={0.7}
                      accessibilityLabel="Delete Role"
                    >
                      <TrashIcon size={15} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShieldUserIcon size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Role Profiles Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || tierFilter !== 'all'
                  ? 'No role profiles match your query.'
                  : 'Get started by creating your first organizational role.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ── CREATE / EDIT ROLE MODAL ── */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, shadows.lg]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalHeaderIcon}>
                  <ShieldUserIcon size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {modalMode === 'create' ? 'Create New Role Profile' : 'Edit Role & Permissions'}
                  </Text>
                  {/* <Text style={styles.modalSubtitle} >
                    {modalMode === 'create'
                      ? 'Establish access tier and authority capabilities'
                      : `Customize fine-grained authority toggles for "${typeName}"`}
                  </Text> */}
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollArea}>
              {/* Persona Tier Selector (2 Cards) */}
              <Text style={styles.formSectionHeading}>1. SELECT AUTHORITY TIER</Text>
              <View style={styles.tierSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.tierSelectCard,
                    modalRoleTier === 'ADMIN' && styles.tierSelectCardActiveAdmin,
                  ]}
                  onPress={() => handleSelectRoleTier('ADMIN')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.tierSelectIconBox,
                      { backgroundColor: modalRoleTier === 'ADMIN' ? colors.primary : '#f5f3ff' },
                    ]}
                  >
                    <ShieldUserIcon
                      size={16}
                      color={modalRoleTier === 'ADMIN' ? '#ffffff' : '#7c3aed'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tierSelectTitle}>Department Admin</Text>
                    <Text style={styles.tierSelectSub}>Manages users & permissions</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tierSelectCard,
                    modalRoleTier === 'USER' && styles.tierSelectCardActiveUser,
                  ]}
                  onPress={() => handleSelectRoleTier('USER')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.tierSelectIconBox,
                      { backgroundColor: modalRoleTier === 'USER' ? '#059669' : '#ecfdf5' },
                    ]}
                  >
                    <UsersIcon
                      size={16}
                      color={modalRoleTier === 'USER' ? '#ffffff' : '#059669'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tierSelectTitle}>User / Client</Text>
                    <Text style={styles.tierSelectSub}>Standard operational scope</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Role Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Role Profile Name <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. Field Operations Lead"
                  placeholderTextColor={colors.textLight}
                  value={typeName}
                  onChangeText={setTypeName}
                />
              </View>

              {/* 1-Click Preset Templates */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>1-Click Preset Templates</Text>
                <View style={styles.presetsRow}>
                  {ROLE_PRESETS.map((preset, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.presetChip,
                        { backgroundColor: preset.color, borderColor: preset.borderColor },
                      ]}
                      onPress={() => applyPreset(preset)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.presetText, { color: preset.textColor }]}>
                        {preset.name}
                      </Text>
                      <View style={styles.presetBadge}>
                        <Text style={styles.presetBadgeText}>{preset.badge}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Permission Capabilities Toggle List */}
              <View style={styles.permissionsHeaderRow}>
                <Text style={styles.formSectionHeading}>
                  2. PERMISSION CAPABILITIES ({ALL_MASTER_KEYS.filter((k) => activeToggles[k]).length}/{ALL_MASTER_KEYS.length} ENABLED)
                </Text>
                <View style={styles.toggleAllButtonsRow}>
                  <TouchableOpacity onPress={() => handleToggleAll(true)}>
                    <Text style={styles.toggleAllBtnText}>Enable All</Text>
                  </TouchableOpacity>
                  <Text style={styles.toggleAllDivider}>•</Text>
                  <TouchableOpacity onPress={() => handleToggleAll(false)}>
                    <Text style={styles.toggleAllBtnText}>Disable All</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {PERMISSION_CONFIGS.map((cat, catIdx) => (
                <View key={catIdx} style={styles.categoryBlock}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{cat.category}</Text>
                    <Text style={styles.categoryDesc}>{cat.description}</Text>
                  </View>

                  <View style={styles.categoryItemsList}>
                    {cat.items.map((item) => {
                      const isEnabled = Boolean(activeToggles[item.key]);
                      return (
                        <View key={item.key} style={styles.permissionToggleItem}>
                          <View style={styles.permToggleTextCol}>
                            <View style={styles.permBadgeAndTitle}>
                              <Text style={styles.permBadgeText}>{item.badge}</Text>
                              <Text style={styles.permTitleText} numberOfLines={1}>
                                {item.title}
                              </Text>
                            </View>
                          </View>
                          <Switch
                            value={isEnabled}
                            onValueChange={() => handleToggleKey(item.key)}
                            trackColor={{ false: '#e2e8f0', true: colors.primary }}
                            thumbColor={isEnabled ? '#ffffff' : '#f8fafc'}
                            ios_backgroundColor="#e2e8f0"
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                />
                <AppButton
                  title={modalMode === 'create' ? 'Create Role' : 'Save Changes'}
                  onPress={handleSaveRole}
                  loading={saving}
                  style={{ flex: 1, backgroundColor: colors.buttonPrimary }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── TIER FILTER DROPDOWN MODAL ── */}
      <Modal visible={isTierDropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsTierDropdownOpen(false)}
        >
          <View style={[styles.dropdownModalContent, shadows.lg]}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Filter by Authority Tier</Text>
              <TouchableOpacity onPress={() => setIsTierDropdownOpen(false)}>
                <XMarkIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'All Authority Tiers', value: 'all', dotColor: colors.primary },
              { label: 'Admin Tier Only', value: 'ADMIN', dotColor: '#7c3aed' },
              { label: 'User / Client Tier Only', value: 'USER', dotColor: '#059669' },
            ].map((opt) => {
              const isSelected = tierFilter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.dropdownOptionItem, isSelected && styles.dropdownOptionItemActive]}
                  onPress={() => {
                    setTierFilter(opt.value as any);
                    setIsTierDropdownOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownOptionLeft}>
                    <View style={[styles.tierDot, { backgroundColor: opt.dotColor }]} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl * 2,
  },
  listHeaderContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  /* ── Inside Screen Top Action Bar ── */
  topActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  topActionLeft: {
    flex: 1,
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
  createRoleBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.buttonPrimary,
    flexShrink: 0,
    justifyContent: 'center',
  },
  createRoleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  createRoleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoleBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },

  /* ── 3 Top KPI Cards ── */
  kpiCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kpiTextWrap: {
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: colors.textLight,
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: fontWeights.black,
    marginTop: 1,
  },

  /* ── Section Title Row ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  roleCountBadge: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  roleCountText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },

  /* ── Search & Filter Row ── */
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
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
  tierDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    height: 40,
    gap: 4,
  },
  tierDropdownText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },

  /* ── Role Card Style ── */
  roleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: spacing.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 180,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarBoxAdmin: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  avatarBoxUser: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  roleInfoCol: {
    flex: 1,
    marginLeft: 8,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleNameText: {
    fontSize: 15,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  tierBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierBadgeAdmin: {
    backgroundColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
  tierBadgeUser: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
  },
  tierBadgeTextAdmin: {
    color: '#7c3aed',
  },
  tierBadgeTextUser: {
    color: '#059669',
  },
  idTagBox: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  idTagText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: fontWeights.bold,
    color: '#475569',
  },

  /* ── Capabilities Section in Card ── */
  capabilitiesContainer: {
    paddingVertical: 12,
  },
  capabilitiesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  capabilitiesHeading: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: '#475569',
    letterSpacing: 0.3,
  },
  capabilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capabilitySquareCard: {
    width: 70,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  squareCardIconWrap: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareCardLabel: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginTop: 3,
    maxWidth: '100%',
  },
  emptyPermBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyPermText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textLight,
  },

  /* ── Card Footer Actions ── */
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  addedByText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
    marginRight: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnEditSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDeleteSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Empty State ── */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  /* ── Create / Edit Modal ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xxl,
    maxHeight: '90%',
    padding: spacing.md,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: spacing.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  modalScrollArea: {
    paddingVertical: spacing.xs,
  },
  formSectionHeading: {
    fontSize: 10.5,
    fontWeight: fontWeights.black,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  tierSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  tierSelectCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  tierSelectCardActiveAdmin: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  tierSelectCardActiveUser: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  tierSelectIconBox: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierSelectTitle: {
    fontSize: 11,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  tierSelectSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalTextInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    height: 40,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
  },
  presetBadge: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  presetBadgeText: {
    fontSize: 8.5,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  permissionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  toggleAllButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleAllBtnText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  toggleAllDivider: {
    fontSize: 10,
    color: colors.textLight,
  },
  categoryBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: spacing.sm,
  },
  categoryHeader: {
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  categoryDesc: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  categoryItemsList: {
    gap: 6,
  },
  permissionToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  permToggleTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  permBadgeAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  permBadgeText: {
    fontSize: 11,
  },
  permTitleText: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  /* ── Tier Filter Dropdown Modal ── */
  dropdownModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: spacing.xs,
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
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
  },
  dropdownOptionItemActive: {
    backgroundColor: '#f1f5f9',
  },
  dropdownOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dropdownOptionLabel: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
  },
  dropdownOptionLabelActive: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
});
