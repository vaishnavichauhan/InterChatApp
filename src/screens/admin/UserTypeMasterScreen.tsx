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
    color: '#eef2ff',
    borderColor: '#c7d2fe',
    textColor: '#4f46e5',
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

  // Render capability badges for each card
  const renderCapabilityBadges = (permissions: any[]) => {
    if (!permissions || permissions.length === 0) {
      return <Text style={styles.emptyPermText}>No permissions configured</Text>;
    }

    const enabledKeys = new Set(
      permissions.filter((p: any) => p.canRead || p.canWrite).map((p: any) => p.masterName)
    );

    const activeItems = PERMISSION_CONFIGS.flatMap((c) => c.items).filter((item) =>
      enabledKeys.has(item.key)
    );

    if (activeItems.length === 0) {
      return <Text style={styles.emptyPermText}>All access restricted</Text>;
    }

    const isFullAccess = ALL_MASTER_KEYS.every((k) => enabledKeys.has(k));

    if (isFullAccess) {
      return (
        <View style={styles.fullAccessBadge}>
          <CrownIcon size={14} color="#7c3aed" />
          <Text style={styles.fullAccessText}>Full Administrative Access</Text>
        </View>
      );
    }

    return (
      <View style={styles.capabilityPillsRow}>
        {activeItems.map((item) => (
          <View
            key={item.key}
            style={[
              styles.capabilityPill,
              item.requiresAdmin ? styles.capabilityPillAdmin : styles.capabilityPillUser,
            ]}
          >
            <Text
              style={[
                styles.capabilityPillText,
                item.requiresAdmin ? styles.capabilityPillTextAdmin : styles.capabilityPillTextUser,
              ]}
            >
              {item.badge}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Header Component for List
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* ── Subtitle Banner ── */}
      <View style={styles.headerBanner}>
        <View style={styles.bannerTagPill}>
          <Text style={styles.bannerTagText}>ACCESS GOVERNANCE & RBAC DIRECTORY</Text>
        </View>
        <Text style={styles.bannerTitle}>Create User Role & Permissions</Text>
        <Text style={styles.bannerSubtitle}>
          Configure fine-grained access profiles, client management permissions, camera sharing, and file security across all organizational roles.
        </Text>
      </View>

      {/* ── Action Buttons Row: Refresh & + Create New Role ── */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <RefreshIcon size={14} color={colors.textSecondary} />
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createRoleBtn}
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
                <Stop offset="0%" stopColor="#0056cf" />
                <Stop offset="100%" stopColor="#4f46e5" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#createRoleGrad)" />
          </Svg>

          <View style={styles.createRoleBtnInner}>
            <View style={styles.createRoleIconCircle}>
              <PlusIcon size={12} color="#0056cf" />
            </View>
            <Text style={styles.createRoleBtnText}>Create New Role</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 3 KPI Cards at Top (matching web frontend exactly) ── */}
      <View style={styles.kpiCardsRow}>
        {/* Total Roles */}
        <View style={[styles.kpiCard, shadows.sm]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#eff6ff' }]}>
            <ShieldCheckIcon size={20} color="#0056cf" />
          </View>
          <View style={styles.kpiTextWrap}>
            <Text style={styles.kpiLabel}>TOTAL ROLES</Text>
            <Text style={[styles.kpiValue, { color: '#0056cf' }]}>{stats.total}</Text>
          </View>
        </View>

        {/* Admin Tier Roles */}
        <View style={[styles.kpiCard, shadows.sm]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#f5f3ff' }]}>
            <ShieldUserIcon size={20} color="#7c3aed" />
          </View>
          <View style={styles.kpiTextWrap}>
            <Text style={styles.kpiLabel}>ADMIN TIER</Text>
            <Text style={[styles.kpiValue, { color: '#7c3aed' }]}>{stats.adminRoles}</Text>
          </View>
        </View>

        {/* User / Client Roles */}
        <View style={[styles.kpiCard, shadows.sm]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#ecfdf5' }]}>
            <UsersIcon size={20} color="#059669" />
          </View>
          <View style={styles.kpiTextWrap}>
            <Text style={styles.kpiLabel}>USER / CLIENT</Text>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{stats.userRoles}</Text>
          </View>
        </View>
      </View>

      {/* ── Section Title & Counter ── */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Organizational Role Permission Profiles</Text>
          <Text style={styles.sectionSubtitle}>
            Directory of defined authority tiers, client management rights, and capability sets.
          </Text>
        </View>
        <View style={styles.roleCountBadge}>
          <Text style={styles.roleCountText}>{filteredData.length} Roles</Text>
        </View>
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
            const hasAdminPerm = (item.permissions || []).some(
              (p: any) =>
                (p.canRead || p.canWrite) &&
                ['user_master', 'department_master', 'user_type'].includes(p.masterName)
            );

            return (
              <View style={[styles.roleCard, shadows.sm]}>
                {/* ── Card Header: Avatar Icon, Name & Tier Pill, #ID ── */}
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.avatarBox,
                      hasAdminPerm ? styles.avatarBoxAdmin : styles.avatarBoxUser,
                    ]}
                  >
                    {hasAdminPerm ? (
                      <ShieldUserIcon size={18} color="#7c3aed" />
                    ) : (
                      <UsersIcon size={18} color="#059669" />
                    )}
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

                    <Text style={styles.addedByText}>
                      Added by {item.added_by_name || 'Admin User'}
                    </Text>
                  </View>

                  <View style={styles.idTagBox}>
                    <Text style={styles.idTagText}>#{item.id}</Text>
                  </View>
                </View>

                {/* ── Granted Capabilities & Permissions Section ── */}
                <View style={styles.capabilitiesContainer}>
                  <Text style={styles.capabilitiesHeading}>GRANTED CAPABILITIES & PERMISSIONS</Text>
                  {renderCapabilityBadges(item.permissions)}
                </View>

                {/* ── Card Footer Actions (Edit & Delete) ── */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => handleOpenEdit(item)}
                    activeOpacity={0.7}
                  >
                    <EditIcon size={13} color="#4f46e5" />
                    <Text style={styles.actionBtnEditText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnDelete}
                    onPress={() => handleDeleteRole(item)}
                    activeOpacity={0.7}
                  >
                    <TrashIcon size={13} color="#ef4444" />
                    <Text style={styles.actionBtnDeleteText}>Delete</Text>
                  </TouchableOpacity>
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
                  <ShieldUserIcon size={18} color="#4f46e5" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {modalMode === 'create' ? 'Create New Role Profile' : 'Edit Role & Permissions'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {modalMode === 'create'
                      ? 'Establish access tier and authority capabilities'
                      : `Customize fine-grained authority toggles for "${typeName}"`}
                  </Text>
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
                      { backgroundColor: modalRoleTier === 'ADMIN' ? '#4f46e5' : '#f5f3ff' },
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
                            trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
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
                  style={{ flex: 1, backgroundColor: '#0056cf' }}
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

  /* ── Banner ── */
  headerBanner: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.md,
  },
  bannerTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: spacing.xs,
  },
  bannerTagText: {
    fontSize: 9.5,
    fontWeight: fontWeights.black,
    color: '#0056cf',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 17,
  },

  /* ── Action Buttons Row ── */
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: 8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refreshBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  createRoleBtn: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  createRoleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  createRoleIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  roleCountText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: '#0056cf',
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
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
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
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  roleNameText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: borderRadius.sm,
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
    fontSize: 9.5,
    fontWeight: fontWeights.extrabold,
  },
  tierBadgeTextAdmin: {
    color: '#7c3aed',
  },
  tierBadgeTextUser: {
    color: '#059669',
  },
  addedByText: {
    fontSize: 10.5,
    color: colors.textLight,
    marginTop: 2,
  },
  idTagBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  idTagText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },

  /* ── Capabilities Section in Card ── */
  capabilitiesContainer: {
    paddingVertical: spacing.sm,
  },
  capabilitiesHeading: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: colors.textLight,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  fullAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
  },
  fullAccessText: {
    fontSize: 11,
    fontWeight: fontWeights.extrabold,
    color: '#7c3aed',
  },
  capabilityPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  capabilityPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  capabilityPillAdmin: {
    backgroundColor: '#f5f3ff',
    borderColor: '#e9d5ff',
  },
  capabilityPillUser: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  capabilityPillText: {
    fontSize: 10.5,
    fontWeight: fontWeights.semibold,
  },
  capabilityPillTextAdmin: {
    color: '#7c3aed',
  },
  capabilityPillTextUser: {
    color: colors.textSecondary,
  },
  emptyPermText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textLight,
  },

  /* ── Card Footer Actions ── */
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  actionBtnEditText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#4f46e5',
  },
  actionBtnDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionBtnDeleteText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#ef4444',
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
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
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
    color: '#0056cf',
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
