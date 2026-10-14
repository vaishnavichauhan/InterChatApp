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
  BuildingOfficeIcon,
  LockIcon,
  MessagesSquareIcon,
  CameraIcon,
  EyeIcon,
  PaperclipIcon,
  MobileIcon,
  ChartIcon,
  CloudIcon,
  DownloadIcon,
  HandshakeIcon,
  CityIcon,
} from '../../components/icons/SvgIcons';
import {
  getUserTypes,
  createUserType,
  updateUserType,
  deleteUserType,
} from '../../api/adminApi';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';

// ─── 13 Master Permission Configs (100% Web Parity) ───────────────────────────
const PERMISSION_CONFIGS = [
  {
    category: 'Department & Administrative Governance',
    description: 'Administrative authority to manage department users, edit client permissions, and audit logs',
    icon: (c: string) => <ShieldUserIcon size={18} color={c} />,
    color: '#7c3aed',
    tier: 'admin',
    items: [
      {
        key: 'user_master',
        title: 'Manage Department Users & Client Permissions',
        description: 'Allows Department Admins to edit client permissions, manage user profiles, and oversee department members.',
        badge: 'Client Perms',
        requiresAdmin: true,
      },
      {
        key: 'company_master',
        title: 'Company Master & Multi-Company Hierarchy',
        description: 'Allows viewing, creating, and managing corporate entities and company boundaries.',
        badge: 'Company Master',
        requiresAdmin: true,
      },
      {
        key: 'department_master',
        title: 'Department Master & Boundary Control',
        description: 'Allows viewing and managing organizational departments and department boundaries.',
        badge: 'Dept Master',
        requiresAdmin: true,
      },
      {
        key: 'user_type',
        title: 'User Role & Permission Master',
        description: 'Allows configuring, creating, and customizing role permission profiles.',
        badge: 'Role Master',
        requiresAdmin: true,
      },
      {
        key: 'device_approval',
        title: 'Hardware Device Approval & Verification',
        description: 'Allows approving or revoking new login devices and security access keys.',
        badge: 'Device Security',
        requiresAdmin: true,
      },
      {
        key: 'activity_report',
        title: 'Activity Logs & Security Audit Trail',
        description: 'Allows viewing system logs, login sessions, and departmental audit histories.',
        badge: 'Audit Logs',
        requiresAdmin: true,
      },
      {
        key: 'cloud_storage',
        title: 'Cloud Storage Master',
        description: 'Allows configuring Microsoft Azure, Google Drive, and cloud storage providers.',
        badge: 'Cloud Storage',
        requiresAdmin: true,
      },
    ],
  },
  {
    category: 'Communication & Messaging Channels',
    description: 'Control direct messaging, live photo capture, and department group channels',
    icon: (c: string) => <MessagesSquareIcon size={18} color={c} />,
    color: '#0284c7',
    tier: 'common',
    items: [
      {
        key: 'chat',
        title: 'Send Messages (Chat Access)',
        description: 'Allows user to compose and send messages in direct 1-to-1 chats and team channels.',
        badge: 'Chat Access',
        requiresAdmin: false,
      },
      {
        key: 'camera_access',
        title: 'Live Camera & Instant Photo Capture',
        description: 'Allows user to capture and share live photos directly from camera.',
        badge: 'Live Camera',
        requiresAdmin: false,
      },
      {
        key: 'group_create',
        title: 'Create Department Group Channels',
        description: 'Allows user to create new scoped channels and group chats within their department.',
        badge: 'Group Channels',
        requiresAdmin: false,
      },
    ],
  },
  {
    category: 'Document & File Security',
    description: 'Control in-app file previewing, attachments upload, and local downloading',
    icon: (c: string) => <EyeIcon size={18} color={c} />,
    color: '#059669',
    tier: 'common',
    items: [
      {
        key: 'document_view',
        title: 'File & Document Preview (In-App Protected View)',
        description: 'Allows user to securely preview PDFs, Word docs, Excel sheets, and images inside the app.',
        badge: 'Preview Files',
        requiresAdmin: false,
      },
      {
        key: 'document_upload',
        title: 'File Sharing & Attachments Upload',
        description: 'Allows user to attach documents, spreadsheets, photos, and files in conversations.',
        badge: 'Upload Files',
        requiresAdmin: false,
      },
      {
        key: 'document_download',
        title: 'Download Files to Local Storage',
        description: 'Allows user to export and save shared files directly to their physical device storage.',
        badge: 'Download Files',
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
  company_master: {
    label: 'Companies',
    icon: (c) => <BuildingOfficeIcon size={20} color={c} />,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
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

// ─── 1-Click Role Presets Matching Web Frontend ──────────────────────────────
const ROLE_PRESETS = [
  {
    name: 'Super Admin',
    categoryTier: 'ADMIN',
    authorityKey: 'SUPER_ADMIN',
    badge: 'Global Full Access',
    color: '#faf5ff',
    borderColor: '#e9d5ff',
    textColor: '#7c3aed',
    activeKeys: ALL_MASTER_KEYS,
  },
  {
    name: 'Department Admin',
    categoryTier: 'ADMIN',
    authorityKey: 'DEPT_ADMIN',
    badge: 'Dept Admin',
    color: colors.primarySubtle,
    borderColor: colors.primaryMuted,
    textColor: colors.primary,
    activeKeys: [
      'user_master',
      'company_master',
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
    authorityKey: 'DEPT_USER',
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
  {
    name: 'Vendor / Partner',
    categoryTier: 'USER',
    authorityKey: 'VENDOR',
    badge: 'Vendor Partner',
    color: '#fffbeb',
    borderColor: '#fde68a',
    textColor: '#b45309',
    activeKeys: ['chat', 'document_view', 'document_upload'],
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
  const [tierFilter, setTierFilter] = useState<'all' | 'ADMIN' | 'USER' | 'VENDOR'>('all');
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);

  // Edit / Create Modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [typeName, setTypeName] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState<
    'SUPER_ADMIN' | 'DEPT_ADMIN' | 'DEPT_USER' | 'VENDOR'
  >('DEPT_USER');
  const [modalRoleTier, setModalRoleTier] = useState<'ADMIN' | 'USER'>('USER');
  const [isVendor, setIsVendor] = useState(false);
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
          ['user_master', 'department_master', 'user_type', 'company_master'].includes(p.masterName)
      )
    ).length;
    const vendorRoles = data.filter((r) =>
      Boolean(r.is_vendor) || (r.type_name || '').toLowerCase().includes('vendor')
    ).length;
    const userRoles = total - adminRoles;
    return { total, adminRoles, userRoles, vendorRoles };
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

      const isVendorRole =
        Boolean(row.is_vendor) || (row.type_name || '').toLowerCase().includes('vendor');
      const hasAdminPerm = (row.permissions || []).some(
        (p: any) =>
          (p.canRead || p.canWrite) &&
          ['user_master', 'department_master', 'user_type', 'company_master'].includes(p.masterName)
      );

      if (tierFilter === 'all') return true;
      if (tierFilter === 'VENDOR') return isVendorRole;
      if (tierFilter === 'ADMIN') return hasAdminPerm && !isVendorRole;
      return !hasAdminPerm && !isVendorRole;
    });
  }, [data, searchQuery, tierFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedId(null);
    setTypeName('');
    setSelectedAuthority('DEPT_USER');
    setModalRoleTier('USER');
    setIsVendor(false);
    const initialToggles: Record<string, boolean> = {};
    ALL_MASTER_KEYS.forEach((k) => {
      initialToggles[k] = [
        'chat',
        'camera_access',
        'document_view',
        'document_upload',
        'document_download',
      ].includes(k);
    });
    setActiveToggles(initialToggles);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (row: any) => {
    setModalMode('edit');
    setSelectedId(row.id);
    setTypeName(row.type_name || '');

    const isVendorRole =
      Boolean(row.is_vendor) || (row.type_name || '').toLowerCase().includes('vendor');
    setIsVendor(isVendorRole);

    const hasAdminPerm = (row.permissions || []).some(
      (p: any) =>
        (p.canRead || p.canWrite) &&
        ['user_master', 'department_master', 'user_type', 'company_master'].includes(p.masterName)
    );
    setModalRoleTier(hasAdminPerm ? 'ADMIN' : 'USER');

    const nameLower = (row.type_name || '').toLowerCase();
    if (isVendorRole) {
      setSelectedAuthority('VENDOR');
    } else if (nameLower.includes('super admin')) {
      setSelectedAuthority('SUPER_ADMIN');
    } else if (hasAdminPerm) {
      setSelectedAuthority('DEPT_ADMIN');
    } else {
      setSelectedAuthority('DEPT_USER');
    }

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

  // Switch Role Authority Tier (Matching Web Step 1)
  const handleSelectAuthority = (tierKey: 'SUPER_ADMIN' | 'DEPT_ADMIN' | 'DEPT_USER' | 'VENDOR') => {
    setSelectedAuthority(tierKey);
    if (tierKey === 'SUPER_ADMIN') {
      setIsVendor(false);
      setModalRoleTier('ADMIN');
      const updated: Record<string, boolean> = {};
      ALL_MASTER_KEYS.forEach((k) => {
        updated[k] = true;
      });
      setActiveToggles(updated);
      if (
        !typeName ||
        typeName === 'Department Admin' ||
        typeName === 'Department User' ||
        typeName === 'Vendor / External Partner'
      ) {
        setTypeName('Super Admin');
      }
    } else if (tierKey === 'DEPT_ADMIN') {
      setIsVendor(false);
      setModalRoleTier('ADMIN');
      const deptAdminKeys = [
        'user_master',
        'company_master',
        'department_master',
        'device_approval',
        'activity_report',
        'chat',
        'camera_access',
        'group_create',
        'document_view',
        'document_upload',
        'document_download',
      ];
      const updated: Record<string, boolean> = {};
      ALL_MASTER_KEYS.forEach((k) => {
        updated[k] = deptAdminKeys.includes(k);
      });
      setActiveToggles(updated);
      if (
        !typeName ||
        typeName === 'Super Admin' ||
        typeName === 'Department User' ||
        typeName === 'Vendor / External Partner'
      ) {
        setTypeName('Department Admin');
      }
    } else if (tierKey === 'VENDOR') {
      setIsVendor(true);
      setModalRoleTier('USER');
      const vendorKeys = ['chat', 'document_view', 'document_upload'];
      const updated: Record<string, boolean> = {};
      ALL_MASTER_KEYS.forEach((k) => {
        updated[k] = vendorKeys.includes(k);
      });
      setActiveToggles(updated);
      if (
        !typeName ||
        typeName === 'Super Admin' ||
        typeName === 'Department Admin' ||
        typeName === 'Department User'
      ) {
        setTypeName('Vendor / External Partner');
      }
    } else {
      setIsVendor(false);
      setModalRoleTier('USER');
      const userKeys = [
        'chat',
        'camera_access',
        'document_view',
        'document_upload',
        'document_download',
      ];
      const updated: Record<string, boolean> = {};
      ALL_MASTER_KEYS.forEach((k) => {
        updated[k] = userKeys.includes(k);
      });
      setActiveToggles(updated);
      if (
        !typeName ||
        typeName === 'Super Admin' ||
        typeName === 'Department Admin' ||
        typeName === 'Vendor / External Partner'
      ) {
        setTypeName('Department User');
      }
    }
  };

  // Apply Preset
  const applyPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setModalRoleTier(preset.categoryTier as any);
    setSelectedAuthority(preset.authorityKey as any);
    setIsVendor(preset.authorityKey === 'VENDOR');
    setTypeName(preset.name);

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
        'company_master',
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
          isVendor: Boolean(isVendor),
        });
        Alert.alert('Success', `Role profile "${typeName.trim()}" created successfully.`);
      } else if (selectedId) {
        await updateUserType(selectedId, {
          typeName: typeName.trim(),
          permissions,
          isVendor: Boolean(isVendor),
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
            <View key={item.key} style={styles.capabilitySquareCard}>
              <View style={styles.squareCardIconWrap}>{tile.icon(tile.color)}</View>
              <Text style={[styles.squareCardLabel, { color: tile.color }]} numberOfLines={1}>
                {tile.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Top Title Banner */}
      <View style={styles.topActionBar}>
        <View style={styles.topActionLeft}>
          <Text style={styles.screenHeading}>User Role Profiles</Text>
          <Text style={styles.screenSubheading}>
            Granular permission authority, device security & access policies
          </Text>
        </View>
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

      {/* KPI Stats Row */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderColor: '#e2e8f0' }]}>
          <Text style={styles.kpiLabel}>TOTAL ROLES</Text>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{stats.total}</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#ddd6fe' }]}>
          <Text style={styles.kpiLabel}>ADMIN TIERS</Text>
          <Text style={[styles.kpiValue, { color: '#7c3aed' }]}>{stats.adminRoles}</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#a7f3d0' }]}>
          <Text style={styles.kpiLabel}>USER TIERS</Text>
          <Text style={[styles.kpiValue, { color: '#059669' }]}>{stats.userRoles}</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#fde68a' }]}>
          <Text style={styles.kpiLabel}>VENDORS</Text>
          <Text style={[styles.kpiValue, { color: '#b45309' }]}>{stats.vendorRoles}</Text>
        </View>
      </View>

      {/* Search and Tier Filter */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBar}>
          <SearchIcon size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roles or capabilities..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <XMarkIcon size={14} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.tierDropdownTrigger}
          onPress={() => setIsTierDropdownOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.tierDropdownText}>
            {tierFilter === 'all'
              ? 'All Tiers'
              : tierFilter === 'ADMIN'
              ? 'Admin'
              : tierFilter === 'VENDOR'
              ? 'Vendor'
              : 'User'}
          </Text>
          <ChevronDownIcon size={14} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>CONFIGURED ROLE PROFILES</Text>
          <Text style={styles.sectionSubtitle}>
            Custom feature matrices assigned to enterprise members
          </Text>
        </View>
        <View style={styles.roleCountBadge}>
          <Text style={styles.roleCountText}>{filteredData.length} Profiles</Text>
        </View>
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
            const isVendorRole =
              Boolean(item.is_vendor) || (item.type_name || '').toLowerCase().includes('vendor');
            const hasAdminPerm = permissions.some(
              (p: any) =>
                (p.canRead || p.canWrite) &&
                ['user_master', 'department_master', 'user_type', 'company_master'].includes(p.masterName)
            );
            const enabledKeys = new Set(
              permissions.filter((p: any) => p.canRead || p.canWrite).map((p: any) => p.masterName)
            );
            const activeCount = PERMISSION_CONFIGS.flatMap((c) => c.items).filter((i) =>
              enabledKeys.has(i.key)
            ).length;
            const isFullAccess =
              ALL_MASTER_KEYS.length > 0 && ALL_MASTER_KEYS.every((k) => enabledKeys.has(k));

            return (
              <View style={[styles.roleCard, shadows.sm]}>
                {/* ── Tier Badge: Top-right corner ── */}
                <View
                  style={[
                    styles.tierBadgeCorner,
                    isVendorRole
                      ? styles.tierBadgeVendor
                      : hasAdminPerm
                      ? styles.tierBadgeAdmin
                      : styles.tierBadgeUser,
                  ]}
                >
                  <Text
                    style={[
                      styles.tierBadgeText,
                      isVendorRole
                        ? styles.tierBadgeTextVendor
                        : hasAdminPerm
                        ? styles.tierBadgeTextAdmin
                        : styles.tierBadgeTextUser,
                    ]}
                  >
                    {isVendorRole
                      ? 'Vendor Partner'
                      : hasAdminPerm
                      ? 'Admin Tier'
                      : 'User Tier'}
                  </Text>
                </View>

                <View style={styles.cardHeaderRow}>
                  <View style={styles.idTagBox}>
                    <Text style={styles.idTagText}>{item.id}.</Text>
                  </View>
                  <View style={styles.roleInfoCol}>
                    <View style={styles.roleTitleRow}>
                      <Text style={styles.roleNameText} numberOfLines={1}>
                        {item.type_name}
                      </Text>
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
                          ? '13/13 FULL ACCESS'
                          : activeCount > 0
                          ? `${activeCount} ACTIVE`
                          : 'RESTRICTED'}
                      </Text>
                    </View>
                  </View>
                  {renderCapabilityBadges(item.permissions)}
                </View>

                {/* ── Card Footer Actions (Edit & Delete) ── */}
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
                      <EditIcon size={15} color="#334155" />
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

      {/* ════════════════════════════════════════════════════════════════
          CREATE / EDIT ROLE MODAL (COMPLETE WEB PARITY)
      ════════════════════════════════════════════════════════════════ */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, shadows.lg]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalHeaderIcon}>
                  <ShieldUserIcon size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    {modalMode === 'create' ? 'Create New Role Profile' : 'Edit Role & Permissions'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {modalMode === 'create'
                      ? 'Step 1: Role Authority Tier • Step 2: Fine-Grained Permissions'
                      : `Customize fine-grained authority toggles for "${typeName}"`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollArea}>
              {/* ── STEP 1: 4 ROLE AUTHORITY TIER CARDS (100% Web Parity) ── */}
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.formSectionHeading}>1. SELECT ROLE AUTHORITY TIER</Text>
                <Text style={styles.formSectionSub}>
                  Establish security boundary and organizational authorization tier
                </Text>

                <View style={styles.authorityCardsGrid}>
                  {/* Card 1: Organization Super Admin */}
                  <TouchableOpacity
                    style={[
                      styles.authorityCard,
                      selectedAuthority === 'SUPER_ADMIN' && styles.authorityCardSuperActive,
                    ]}
                    onPress={() => handleSelectAuthority('SUPER_ADMIN')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.authorityTopRow}>
                      <View style={[styles.authorityIconBox, { backgroundColor: '#f3e8ff' }]}>
                        <CrownIcon size={16} color="#7e22ce" />
                      </View>
                      <View style={[styles.authorityPill, { backgroundColor: '#f3e8ff' }]}>
                        <Text style={[styles.authorityPillText, { color: '#6b21a8' }]}>Global Admin</Text>
                      </View>
                    </View>
                    <Text style={styles.authorityTitle}>Organization Super Admin</Text>
                    <Text style={styles.authorityDesc}>
                      Unrestricted full authority across all departments, user permissions, device security, and system audit logs.
                    </Text>
                    <View style={styles.authorityStatusRow}>
                      <View
                        style={[
                          styles.radioCircleAuth,
                          selectedAuthority === 'SUPER_ADMIN' && { borderColor: '#7e22ce' },
                        ]}
                      >
                        {selectedAuthority === 'SUPER_ADMIN' && (
                          <View style={[styles.radioInnerAuth, { backgroundColor: '#7e22ce' }]} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.authorityStatusText,
                          selectedAuthority === 'SUPER_ADMIN' && { color: '#6b21a8' },
                        ]}
                      >
                        {selectedAuthority === 'SUPER_ADMIN' ? 'Selected Authority' : 'Click to select'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Card 2: Department-wise Admin */}
                  <TouchableOpacity
                    style={[
                      styles.authorityCard,
                      selectedAuthority === 'DEPT_ADMIN' && styles.authorityCardAdminActive,
                    ]}
                    onPress={() => handleSelectAuthority('DEPT_ADMIN')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.authorityTopRow}>
                      <View style={[styles.authorityIconBox, { backgroundColor: '#e0e7ff' }]}>
                        <ShieldUserIcon size={16} color="#4338ca" />
                      </View>
                      <View style={[styles.authorityPill, { backgroundColor: '#e0e7ff' }]}>
                        <Text style={[styles.authorityPillText, { color: '#3730a3' }]}>Dept Admin</Text>
                      </View>
                    </View>
                    <Text style={styles.authorityTitle}>Department-wise Admin</Text>
                    <Text style={styles.authorityDesc}>
                      Manages assigned department members, edits client permissions, approves login devices, and oversees department activity.
                    </Text>
                    <View style={styles.authorityStatusRow}>
                      <View
                        style={[
                          styles.radioCircleAuth,
                          selectedAuthority === 'DEPT_ADMIN' && { borderColor: '#4338ca' },
                        ]}
                      >
                        {selectedAuthority === 'DEPT_ADMIN' && (
                          <View style={[styles.radioInnerAuth, { backgroundColor: '#4338ca' }]} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.authorityStatusText,
                          selectedAuthority === 'DEPT_ADMIN' && { color: '#3730a3' },
                        ]}
                      >
                        {selectedAuthority === 'DEPT_ADMIN' ? 'Selected Authority' : 'Click to select'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Card 3: Department Member / User */}
                  <TouchableOpacity
                    style={[
                      styles.authorityCard,
                      selectedAuthority === 'DEPT_USER' && styles.authorityCardUserActive,
                    ]}
                    onPress={() => handleSelectAuthority('DEPT_USER')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.authorityTopRow}>
                      <View style={[styles.authorityIconBox, { backgroundColor: '#dcfce7' }]}>
                        <UsersIcon size={16} color="#15803d" />
                      </View>
                      <View style={[styles.authorityPill, { backgroundColor: '#dcfce7' }]}>
                        <Text style={[styles.authorityPillText, { color: '#166534' }]}>Dept Member</Text>
                      </View>
                    </View>
                    <Text style={styles.authorityTitle}>Department Member / User</Text>
                    <Text style={styles.authorityDesc}>
                      Standard department staff, team member, or client. Access focused on direct messaging, photo capture, and file sharing.
                    </Text>
                    <View style={styles.authorityStatusRow}>
                      <View
                        style={[
                          styles.radioCircleAuth,
                          selectedAuthority === 'DEPT_USER' && { borderColor: '#15803d' },
                        ]}
                      >
                        {selectedAuthority === 'DEPT_USER' && (
                          <View style={[styles.radioInnerAuth, { backgroundColor: '#15803d' }]} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.authorityStatusText,
                          selectedAuthority === 'DEPT_USER' && { color: '#166534' },
                        ]}
                      >
                        {selectedAuthority === 'DEPT_USER' ? 'Selected Authority' : 'Click to select'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Card 4: Vendor / External Partner */}
                  <TouchableOpacity
                    style={[
                      styles.authorityCard,
                      selectedAuthority === 'VENDOR' && styles.authorityCardVendorActive,
                    ]}
                    onPress={() => handleSelectAuthority('VENDOR')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.authorityTopRow}>
                      <View style={[styles.authorityIconBox, { backgroundColor: '#fef3c7' }]}>
                        <HandshakeIcon size={16} color="#b45309" />
                      </View>
                      <View style={[styles.authorityPill, { backgroundColor: '#fef3c7' }]}>
                        <Text style={[styles.authorityPillText, { color: '#92400e' }]}>Vendor Partner</Text>
                      </View>
                    </View>
                    <Text style={styles.authorityTitle}>Vendor / External Partner</Text>
                    <Text style={styles.authorityDesc}>
                      External vendor role. Receives chats from authorized staff and replies. Isolated from chatting with other external vendors.
                    </Text>
                    <View style={styles.authorityStatusRow}>
                      <View
                        style={[
                          styles.radioCircleAuth,
                          selectedAuthority === 'VENDOR' && { borderColor: '#b45309' },
                        ]}
                      >
                        {selectedAuthority === 'VENDOR' && (
                          <View style={[styles.radioInnerAuth, { backgroundColor: '#b45309' }]} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.authorityStatusText,
                          selectedAuthority === 'VENDOR' && { color: '#92400e' },
                        ]}
                      >
                        {selectedAuthority === 'VENDOR' ? 'Selected Authority' : 'Click to select'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Role Profile Name */}
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
                <Text style={styles.inputLabel}>Quick 1-Click Role Presets</Text>
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

              {/* ── STEP 2: 13 PERMISSION CAPABILITIES & ACCESS TOGGLES ── */}
              <View style={styles.permissionsHeaderRow}>
                <View>
                  <Text style={styles.formSectionHeading}>
                    2. PERMISSIONS & ACCESS TOGGLES
                  </Text>
                  <Text style={styles.formSectionSub}>
                    {ALL_MASTER_KEYS.filter((k) => activeToggles[k]).length} of {ALL_MASTER_KEYS.length} Capabilities Enabled
                  </Text>
                </View>

                <View style={styles.toggleAllButtonsRow}>
                  <TouchableOpacity onPress={() => handleToggleAll(true)} style={styles.toggleAllPill}>
                    <Text style={styles.toggleAllBtnText}>Enable All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleToggleAll(false)} style={styles.toggleAllPill}>
                    <Text style={[styles.toggleAllBtnText, { color: colors.textMuted }]}>Disable All</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {PERMISSION_CONFIGS.map((cat, catIdx) => {
                const activeCount = cat.items.filter((i) => activeToggles[i.key]).length;
                return (
                  <View key={catIdx} style={styles.categoryBlock}>
                    <View style={styles.categoryHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        {cat.icon(cat.color)}
                        <Text style={styles.categoryTitle}>{cat.category}</Text>
                      </View>
                      <View style={styles.categoryCountBadge}>
                        <Text style={styles.categoryCountText}>
                          {activeCount} / {cat.items.length} Enabled
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.categoryDesc}>{cat.description}</Text>

                    <View style={styles.categoryItemsList}>
                      {cat.items.map((item) => {
                        const isEnabled = Boolean(activeToggles[item.key]);
                        return (
                          <View key={item.key} style={styles.permissionToggleItem}>
                            <View style={styles.permToggleTextCol}>
                              <View style={styles.permBadgeAndTitle}>
                                <Text style={styles.permTitleText}>{item.title}</Text>
                                {item.requiresAdmin && (
                                  <View style={styles.adminTierBadge}>
                                    <Text style={styles.adminTierBadgeText}>Admin Tier</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.permDescriptionText}>{item.description}</Text>
                            </View>

                            <View style={styles.switchCol}>
                              <Text
                                style={[
                                  styles.switchStatusLabel,
                                  isEnabled ? styles.switchStatusAllowed : styles.switchStatusRestricted,
                                ]}
                              >
                                {isEnabled ? 'ALLOWED' : 'RESTRICTED'}
                              </Text>
                              <Switch
                                value={isEnabled}
                                onValueChange={() => handleToggleKey(item.key)}
                                trackColor={{ false: '#e2e8f0', true: colors.primary }}
                                thumbColor={isEnabled ? '#ffffff' : '#f8fafc'}
                                ios_backgroundColor="#e2e8f0"
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                />
                <AppButton
                  title={modalMode === 'create' ? 'Create User Role' : 'Save Changes'}
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
              { label: 'Vendor Partner Only', value: 'VENDOR', dotColor: '#b45309' },
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
                    <Text
                      style={[
                        styles.dropdownOptionLabel,
                        isSelected && styles.dropdownOptionLabelActive,
                      ]}
                    >
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  createRoleIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoleBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: fontWeights.extrabold,
    letterSpacing: 0.3,
  },

  /* ── KPI Stats Row ── */
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 8.5,
    fontWeight: fontWeights.extrabold,
    color: colors.textLight,
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 16,
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
    position: 'relative',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  tierBadgeCorner: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 1,
  },
  tierBadgeAdmin: {
    backgroundColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
  tierBadgeUser: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  tierBadgeVendor: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
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
  tierBadgeTextVendor: {
    color: '#b45309',
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
    width: 68,
    height: 66,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8edf3',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
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
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    maxHeight: '92%',
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
    marginBottom: spacing.xs,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: '#fef2f2',
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
    fontSize: 11,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  formSectionSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
    marginBottom: 8,
  },

  /* ── 4 Authority Tier Cards Grid ── */
  authorityCardsGrid: {
    gap: 8,
    marginBottom: spacing.sm,
  },
  authorityCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  authorityCardSuperActive: {
    borderColor: '#7e22ce',
    backgroundColor: '#faf5ff',
  },
  authorityCardAdminActive: {
    borderColor: '#4338ca',
    backgroundColor: '#eef2ff',
  },
  authorityCardUserActive: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
  },
  authorityCardVendorActive: {
    borderColor: '#b45309',
    backgroundColor: '#fffbeb',
  },
  authorityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  authorityIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  authorityPillText: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
  },
  authorityTitle: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  authorityDesc: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
    marginTop: 2,
  },
  authorityStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  radioCircleAuth: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerAuth: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  authorityStatusText: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
  },

  /* ── Input Group ── */
  inputGroup: {
    marginBottom: spacing.sm + 4,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalTextInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    height: 42,
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

  /* ── Permissions Header & Categories ── */
  permissionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    gap: 6,
  },
  toggleAllButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleAllPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleAllBtnText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  categoryBlock: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 6,
  },
  categoryTitle: {
    fontSize: 11.5,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  categoryCountBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryCountText: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: '#475569',
  },
  categoryDesc: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginBottom: 8,
  },
  categoryItemsList: {
    gap: 6,
  },
  permissionToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  permToggleTextCol: {
    flex: 1,
  },
  permBadgeAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  permTitleText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  adminTierBadge: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminTierBadgeText: {
    fontSize: 8,
    fontWeight: fontWeights.extrabold,
    color: '#7c3aed',
  },
  permDescriptionText: {
    fontSize: 9.5,
    color: colors.textMuted,
    lineHeight: 13,
    marginTop: 2,
  },
  switchCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  switchStatusLabel: {
    fontSize: 8,
    fontWeight: fontWeights.black,
    letterSpacing: 0.4,
  },
  switchStatusAllowed: {
    color: '#2563eb',
  },
  switchStatusRestricted: {
    color: '#94a3b8',
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
