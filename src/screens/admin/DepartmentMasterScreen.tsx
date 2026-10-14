import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import { AppBadge } from '../../components/common/AppBadge';
import {
  BuildingIcon,
  PlusIcon,
  XMarkIcon,
  SearchIcon,
  UsersIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
  ShieldUserIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '../../components/icons/SvgIcons';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
  getDepartmentMembers,
} from '../../api/departmentApi';

interface DepartmentMasterScreenProps {
  navigation: any;
}

export const DepartmentMasterScreen: React.FC<DepartmentMasterScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createStatus, setCreateStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [creating, setCreating] = useState(false);

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [updating, setUpdating] = useState(false);

  // Members Modal
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [membersDept, setMembersDept] = useState<any>(null);
  const [deptMembers, setDeptMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch departments
  const fetchDepts = async () => {
    try {
      const res = await getDepartments(true);
      const list = res?.departments || res?.data || (Array.isArray(res) ? res : []);
      setDepartments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load departments', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDepts();
  };

  // KPI Statistics
  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.status === 'ACTIVE').length;
    const inactive = total - active;
    const totalMembers = departments.reduce(
      (acc, curr) => acc + (Number(curr.member_count) || 0),
      0
    );
    return { total, active, inactive, totalMembers };
  }, [departments]);

  // Filtered departments list
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (d.department_name && d.department_name.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        String(d.id).includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [departments, statusFilter, searchQuery]);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Initials helper
  const getInitials = (name?: string) => {
    if (!name) return 'DP';
    return name.trim().substring(0, 2).toUpperCase();
  };

  // Create Department Handler
  const handleCreateDepartment = async () => {
    if (!createName.trim()) {
      Alert.alert('Required', 'Please enter a department name.');
      return;
    }

    try {
      setCreating(true);
      await createDepartment({
        department_name: createName.trim(),
        description: createDesc.trim(),
        status: createStatus,
      } as any);
      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateDesc('');
      setCreateStatus('ACTIVE');
      fetchDepts();
      Alert.alert('Success', `Department "${createName.trim()}" created successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create department.');
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (dept: any) => {
    setSelectedDept(dept);
    setEditName(dept.department_name || '');
    setEditDesc(dept.description || '');
    setEditStatus(dept.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  // Update Department Handler
  const handleUpdateDepartment = async () => {
    if (!editName.trim() || !selectedDept) {
      Alert.alert('Required', 'Please enter a department name.');
      return;
    }

    try {
      setUpdating(true);
      await updateDepartment(selectedDept.id, {
        department_name: editName.trim(),
        description: editDesc.trim(),
        status: editStatus,
      });
      setIsEditModalOpen(false);
      setSelectedDept(null);
      fetchDepts();
      Alert.alert('Success', 'Department updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update department.');
    } finally {
      setUpdating(false);
    }
  };

  // Delete Department Handler
  const handleDeleteDepartment = (dept: any) => {
    Alert.alert(
      'Delete Department',
      `Are you sure you want to delete the "${dept.department_name}" department? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDepartment(dept.id);
              fetchDepts();
              Alert.alert('Success', `Department "${dept.department_name}" deleted.`);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete department.');
            }
          },
        },
      ]
    );
  };

  // Toggle Department Status Handler
  const handleToggleStatus = (dept: any) => {
    const isCurrentlyActive = dept.status === 'ACTIVE';
    const nextStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    Alert.alert(
      'Toggle Status',
      `Set department "${dept.department_name}" to ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await toggleDepartmentStatus(dept.id, !isCurrentlyActive);
              fetchDepts();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to change status.');
            }
          },
        },
      ]
    );
  };

  // Open Members Modal
  const openMembersModal = async (dept: any) => {
    setMembersDept(dept);
    setIsMembersModalOpen(true);
    setLoadingMembers(true);
    try {
      const res = await getDepartmentMembers(dept.id);
      const list = res?.members || res?.data || (Array.isArray(res) ? res : []);
      setDeptMembers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load members', err);
      Alert.alert('Error', 'Failed to load department members.');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Header Component with search + status dropdown
  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* ── Search & Status Dropdown Row ── */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBar}>
          <SearchIcon size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search departments..."
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
          onPress={() => setIsDropdownOpen(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  statusFilter === 'ACTIVE'
                    ? '#10b981'
                    : statusFilter === 'INACTIVE'
                    ? '#94a3b8'
                    : colors.primary,
              },
            ]}
          />
          <Text style={styles.dropdownTriggerText} numberOfLines={1}>
            {statusFilter === 'all'
              ? `All (${departments.length})`
              : statusFilter === 'ACTIVE'
              ? `Active (${stats.active})`
              : `Inactive (${stats.inactive})`}
          </Text>
          <ChevronDownIcon size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Department Master"
        titleAlign="left"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={[styles.headerCreateDeptBtn, shadows.sm]}
            onPress={() => {
              setCreateName('');
              setCreateDesc('');
              setCreateStatus('ACTIVE');
              setIsCreateModalOpen(true);
            }}
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
                <LinearGradient id="headerCreateDeptGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                  <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100" height="100" fill="url(#headerCreateDeptGrad)" />
            </Svg>

            <View style={styles.headerCreateDeptInner}>
              <View style={styles.headerCreateDeptIconCircle}>
                <PlusIcon size={10} color={colors.buttonPrimary} />
              </View>
              <Text style={styles.headerCreateDeptText}>Create Dept</Text>
            </View>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading departments...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDepartments}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 64 },
          ]}
          renderItem={({ item }) => {
            const isActive = item.status === 'ACTIVE';
            const initials = getInitials(item.department_name);

            return (
              <View style={[styles.deptCard, shadows.sm]}>
                {/* ── Card Header: Avatar + Title (with ID) + Status ── */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>

                  <View style={styles.deptInfo}>
                    <Text style={styles.deptName} numberOfLines={1}>
                      {item.department_name}
                    </Text>
                    <Text style={styles.deptIdText}>ID: #{item.id}</Text>
                    {/* ── Created Date Row (Top Side) ── */}
                    <View style={styles.dateRow}>
                      <CalendarIcon size={11} color={colors.textLight} />
                      <Text style={styles.dateText}>
                        Created: {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Status Toggle Badge */}
                  <TouchableOpacity
                    style={[
                      styles.statusPill,
                      isActive ? styles.statusPillActive : styles.statusPillInactive,
                    ]}
                    onPress={() => handleToggleStatus(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.statusPulseDot,
                        { backgroundColor: isActive ? '#10b981' : '#94a3b8' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isActive ? '#047857' : '#64748b' },
                      ]}
                    >
                      {item.status || 'ACTIVE'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ── Card Body: Description ── */}
                <Text style={styles.cardDesc} numberOfLines={3}>
                  {item.description || 'No description provided for this department unit.'}
                </Text>

                {/* ── Card Divider ── */}
                <View style={styles.cardDivider} />

                {/* ── Card Footer: Metrics & Actions ── */}
                <View style={styles.cardFooterRow}>
                  {/* Metrics Group */}
                  <View style={styles.metricsGroup}>
                    {/* Assigned Users button/chip (Tappable button affordance) */}
                    <TouchableOpacity
                      style={styles.metricChipBlue}
                      onPress={() => openMembersModal(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.metricIconCircleBlue}>
                        <UsersIcon size={12} color="#1d4ed8" />
                      </View>
                      <Text style={styles.metricChipTextBlue}>
                        {item.member_count || 0} Members
                      </Text>
                      <ChevronRightIcon size={12} color="#2563eb" />
                    </TouchableOpacity>

                    {/* Dept Admins chip */}
                    <View style={styles.metricChipPurple}>
                      <View style={styles.metricIconCirclePurple}>
                        <ShieldUserIcon size={12} color="#7c3aed" />
                      </View>
                      <Text style={styles.metricChipTextPurple}>
                        {item.admin_count || 0} Dept Admin{item.admin_count === 1 ? '' : 's'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Group (Edit & Delete) */}
                  <View style={styles.cardActionsGroup}>
                    <TouchableOpacity
                      style={styles.actionBtnEdit}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.7}
                    >
                      <EditIcon size={18} color="#334155" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      onPress={() => handleDeleteDepartment(item)}
                      activeOpacity={0.7}
                    >
                      <TrashIcon size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BuildingIcon size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Departments Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || statusFilter !== 'all'
                  ? 'No departments matched your filter or search query.'
                  : 'Get started by creating your first organizational department.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ── CREATE DEPARTMENT MODAL ── */}
      <Modal visible={isCreateModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalHeaderIcon}>
                  <BuildingIcon size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>New Department</Text>
                  <Text style={styles.modalSubtitle}>Create organizational unit</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>
                Department Name <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sales, Marketing, IT, HR"
                placeholderTextColor={colors.textLight}
                value={createName}
                onChangeText={setCreateName}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief summary of department responsibilities..."
                placeholderTextColor={colors.textLight}
                value={createDesc}
                onChangeText={setCreateDesc}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    createStatus === 'ACTIVE' && styles.statusChoiceBtnActive,
                  ]}
                  onPress={() => setCreateStatus('ACTIVE')}
                >
                  <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                  <Text
                    style={[
                      styles.statusChoiceText,
                      createStatus === 'ACTIVE' && styles.statusChoiceTextActive,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    createStatus === 'INACTIVE' && styles.statusChoiceBtnActive,
                  ]}
                  onPress={() => setCreateStatus('INACTIVE')}
                >
                  <View style={[styles.statusDot, { backgroundColor: '#94a3b8' }]} />
                  <Text
                    style={[
                      styles.statusChoiceText,
                      createStatus === 'INACTIVE' && styles.statusChoiceTextActive,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsCreateModalOpen(false)}
                  style={{ flex: 1 }}
                />
                <AppButton
                  title="Create"
                  onPress={handleCreateDepartment}
                  loading={creating}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── EDIT DEPARTMENT MODAL ── */}
      <Modal visible={isEditModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: '#eef2ff' }]}>
                  <EditIcon size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Edit Department</Text>
                  <Text style={styles.modalSubtitle}>Update department unit details</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>
                Department Name <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sales, Marketing, IT"
                placeholderTextColor={colors.textLight}
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief summary of department responsibilities..."
                placeholderTextColor={colors.textLight}
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    editStatus === 'ACTIVE' && styles.statusChoiceBtnActive,
                  ]}
                  onPress={() => setEditStatus('ACTIVE')}
                >
                  <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                  <Text
                    style={[
                      styles.statusChoiceText,
                      editStatus === 'ACTIVE' && styles.statusChoiceTextActive,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    editStatus === 'INACTIVE' && styles.statusChoiceBtnActive,
                  ]}
                  onPress={() => setEditStatus('INACTIVE')}
                >
                  <View style={[styles.statusDot, { backgroundColor: '#94a3b8' }]} />
                  <Text
                    style={[
                      styles.statusChoiceText,
                      editStatus === 'INACTIVE' && styles.statusChoiceTextActive,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
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
                  onPress={handleUpdateDepartment}
                  loading={updating}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── VIEW DEPARTMENT MEMBERS MODAL ── */}
      <Modal visible={isMembersModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.membersModalContent, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: colors.primarySubtle }]}>
                  <UsersIcon size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {membersDept?.department_name} Members
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Assigned personnel & department administrators
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsMembersModalOpen(false)}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {loadingMembers ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading assigned members...</Text>
              </View>
            ) : deptMembers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <UsersIcon size={36} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No Members Assigned</Text>
                <Text style={styles.emptyText}>
                  Assign coworkers to this department from the User Master.
                </Text>
              </View>
            ) : (
              <FlatList
                data={deptMembers}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingVertical: spacing.sm }}
                renderItem={({ item }) => {
                  const isDeptAdmin = item.department_role === 'ADMIN';
                  const userInitial = (item.name || item.username || 'U')[0].toUpperCase();

                  return (
                    <View style={styles.memberItem}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>{userInitial}</Text>
                      </View>

                      <View style={styles.memberDetails}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {item.name || item.username}
                          </Text>
                          <View
                            style={[
                              styles.roleBadge,
                              isDeptAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser,
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleBadgeText,
                                isDeptAdmin
                                  ? styles.roleBadgeTextAdmin
                                  : styles.roleBadgeTextUser,
                              ]}
                            >
                              {isDeptAdmin ? 'Dept Admin' : 'User'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.memberEmail} numberOfLines={1}>
                          {item.email}
                          {item.mob_no ? ` • ${item.mob_no}` : ''}
                        </Text>
                      </View>

                      {item.user_type_name ? (
                        <View style={styles.userTypeBadge}>
                          <Text style={styles.userTypeText}>{item.user_type_name}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                }}
              />
            )}

            <View style={[styles.membersModalFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <AppButton
                title="Close"
                variant="secondary"
                size="sm"
                onPress={() => setIsMembersModalOpen(false)}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── STATUS DROPDOWN MODAL ── */}
      <Modal visible={isDropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={[styles.dropdownModalContent, shadows.lg]}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Filter by Status</Text>
              <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                <XMarkIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'All', value: 'all', dotColor: colors.primary, count: departments.length },
              { label: 'Active', value: 'ACTIVE', dotColor: '#10b981', count: stats.active },
              { label: 'Inactive', value: 'INACTIVE', dotColor: '#94a3b8', count: stats.inactive },
            ].map((opt) => {
              const isSelected = statusFilter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.dropdownOptionItem,
                    isSelected && styles.dropdownOptionItemActive,
                  ]}
                  onPress={() => {
                    setStatusFilter(opt.value as any);
                    setIsDropdownOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownOptionLeft}>
                    <View style={[styles.statusDot, { backgroundColor: opt.dotColor }]} />
                    <Text
                      style={[
                        styles.dropdownOptionLabel,
                        isSelected && styles.dropdownOptionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  <View style={styles.dropdownOptionRight}>
                    <View
                      style={[
                        styles.dropdownCountBadge,
                        isSelected && styles.dropdownCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownCountText,
                          isSelected && styles.dropdownCountTextActive,
                        ]}
                      >
                        {opt.count}
                      </Text>
                    </View>
                    {isSelected && <CheckIcon size={16} color={colors.primary} />}
                  </View>
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

  /* ── Header ── */
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  /* ── Header Create Dept Button in AppHeader ── */
  headerCreateDeptBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.buttonPrimary,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  headerCreateDeptInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  headerCreateDeptIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCreateDeptText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
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
  createDeptBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.buttonPrimary,
    flexShrink: 0,
    justifyContent: 'center',
  },
  createDeptBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  createDeptIconCircle: {
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
  createDeptBtnText: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  /* ── Search & Dropdown Filter Row ── */
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
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
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.sm,
    height: 42,
    minWidth: 105,
    gap: 6,
  },
  dropdownTriggerText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
    paddingVertical: spacing.md,
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
  dropdownOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropdownCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  dropdownCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  dropdownCountText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  dropdownCountTextActive: {
    color: colors.primary,
  },

  /* ── Department Card UI (Fluid & Elevated) ── */
  deptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    marginHorizontal: spacing.lg,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e8edf3',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2D333B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  deptInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  deptName: {
    fontSize: 16,
    fontWeight: fontWeights.extrabold,
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2.5,
    gap: 4,
  },
  dateText: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  deptIdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  deptIdText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  statusPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusPillInactive: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  statusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    letterSpacing: 0.4,
  },
  cardDesc: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18.5,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 11,
  },

  /* ── Card Footer Row ── */
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  metricChipBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingLeft: 6,
    paddingRight: 8,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 5,
  },
  metricIconCircleBlue: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricChipTextBlue: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#1d4ed8',
  },
  metricChipPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ede9fe',
    gap: 5,
  },
  metricIconCirclePurple: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricChipTextPurple: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#7c3aed',
  },

  /* ── Actions Group (Edit, Delete) ── */
  cardActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnEdit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnDelete: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fee2e2',
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

  /* ── Modal Common Styles ── */
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
  membersModalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '80%',
    flex: 1,
    marginVertical: spacing.xxl,
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
    backgroundColor: colors.primarySubtle,
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
    marginBottom: spacing.md,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    gap: 6,
  },
  statusChoiceBtnActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  statusChoiceText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  statusChoiceTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },

  /* ── Members Modal Items ── */
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  memberAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  roleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeAdmin: {
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  roleBadgeUser: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  roleBadgeText: {
    fontSize: 8.5,
    fontWeight: fontWeights.black,
    textTransform: 'uppercase',
  },
  roleBadgeTextAdmin: {
    color: '#7e22ce',
  },
  roleBadgeTextUser: {
    color: '#1d4ed8',
  },
  memberEmail: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  userTypeBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userTypeText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  membersModalFooter: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  deptCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 2,
  },
  deptCompanyText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: '#2563eb',
  },
  companyFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: 2,
  },
  companyFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  companyFilterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  companyFilterChipText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  companyFilterChipTextActive: {
    color: '#ffffff',
  },
  companySelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  companySelectChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  companySelectChipText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  companySelectChipTextActive: {
    color: '#ffffff',
  },
});
