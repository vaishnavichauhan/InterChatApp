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

  // Header Component with inside "+ Create Dept" button and search + status dropdown
  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* ── Top Action Bar inside Screen: Title & "+ Create Dept" Button ── */}
      <View style={styles.topActionBar}>
        <View style={styles.topActionLeft}>
          <Text style={styles.screenHeading}>Department Units</Text>
          <Text style={styles.screenSubheading}>
            {filteredDepartments.length} {filteredDepartments.length === 1 ? 'unit' : 'units'} found
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createDeptBtn, shadows.md]}
          onPress={() => {
            setCreateName('');
            setCreateDesc('');
            setCreateStatus('ACTIVE');
            setIsCreateModalOpen(true);
          }}
          activeOpacity={0.85}
        >
          {/* Linear Gradient Background - fills entire button with no clipping */}
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id="createDeptBtnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#0056cf" />
                <Stop offset="100%" stopColor="#4f46e5" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#createDeptBtnGrad)" />
          </Svg>

          <View style={styles.createDeptBtnInner}>
            <View style={styles.createDeptIconCircle}>
              <PlusIcon size={12} color="#0056cf" />
            </View>
            <Text style={styles.createDeptBtnText}>Create Department</Text>
          </View>
        </TouchableOpacity>
      </View>

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
              ? 'All'
              : statusFilter === 'ACTIVE'
              ? 'Active'
              : 'Inactive'}
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
        rightAction
        showBack
        onBack={() => navigation.goBack()}
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
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isActive = item.status === 'ACTIVE';
            const initials = getInitials(item.department_name);

            return (
              <View style={[styles.deptCard, shadows.sm]}>
                {/* ── Card Header: Avatar + Title + Status ── */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>

                  <View style={styles.deptInfo}>
                    <Text style={styles.deptName} numberOfLines={1}>
                      {item.department_name}
                    </Text>
                    {/* <View style={styles.deptIdBadge}>
                      <Text style={styles.deptIdText}>ID: #{item.id}</Text>
                    </View> */}
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

                {/* ── Description ── */}
                <Text style={styles.cardDesc} numberOfLines={4}>
                  {item.description || 'No description provided for this department unit.'}
                </Text>

                {/* ── Metrics Row: Assigned Users & Dept Admins ── */}
                <View style={styles.metricsRow}>
                  {/* Assigned Users button/chip */}
                  <TouchableOpacity
                    style={styles.metricChipBlue}
                    onPress={() => openMembersModal(item)}
                    activeOpacity={0.7}
                  >
                    <UsersIcon size={14} color="#2563eb" />
                    <Text style={styles.metricChipTextBlue}>
                      {item.member_count || 0} Members
                    </Text>
                  </TouchableOpacity>

                  {/* Dept Admins chip */}
                  <View style={styles.metricChipPurple}>
                    <ShieldUserIcon size={14} color="#7c3aed" />
                    <Text style={styles.metricChipTextPurple}>
                      {item.admin_count || 0} Dept Admin{item.admin_count === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>

                {/* ── Created Date Row ── */}
                <View style={styles.dateRow}>
                  <CalendarIcon size={13} color={colors.textLight} />
                  <Text style={styles.dateText}>
                    Created: {formatDate(item.created_at)}
                  </Text>
                </View>

                {/* ── Card Footer Actions: Members, Edit, Delete ── */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnMembers}
                    onPress={() => openMembersModal(item)}
                    activeOpacity={0.7}
                  >
                    <UsersIcon size={14} color="#2563eb" />
                    <Text style={styles.actionBtnMembersText}>Members</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.7}
                  >
                    <EditIcon size={14} color="#4f46e5" />
                    <Text style={styles.actionBtnEditText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnDelete}
                    onPress={() => handleDeleteDepartment(item)}
                    activeOpacity={0.7}
                  >
                    <TrashIcon size={15} color="#ef4444" />
                    <Text style={styles.actionBtnDeleteText}>Delete</Text>
                  </TouchableOpacity>
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
                  <BuildingIcon size={20} color="#2563eb" />
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
                  <EditIcon size={20} color="#4f46e5" />
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
                <View style={[styles.modalHeaderIcon, { backgroundColor: '#eff6ff' }]}>
                  <UsersIcon size={20} color="#2563eb" />
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

            <View style={styles.membersModalFooter}>
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
                      {opt.label} ({opt.count})
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
  listContent: {
    paddingBottom: spacing.xxl,
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
    backgroundColor: '#0056cf',
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
    paddingHorizontal: spacing.md,
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
    width: 6,
    height: 6,
    borderRadius: 3,
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


  /* ── Department Card UI ── */
  deptCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: fontWeights.black,
    letterSpacing: 0.5,
  },
  deptInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  deptName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
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
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  statusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: fontWeights.black,
    letterSpacing: 0.4,
  },
  cardDesc: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },

  /* ── Metrics Row ── */
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricChipBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 4,
  },
  metricChipTextBlue: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#1d4ed8',
  },
  metricChipPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#ede9fe',
    gap: 4,
  },
  metricChipTextPurple: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#6d28d9',
  },

  /* ── Date Row ── */
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: spacing.sm,
    gap: 4,
  },
  dateText: {
    fontSize: 10.5,
    color: colors.textLight,
    fontWeight: fontWeights.medium,
  },

  /* ── Card Actions Row ── */
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: spacing.sm,
  },
  actionBtnMembers: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 4,
  },
  actionBtnMembersText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#2563eb',
  },
  actionBtnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    gap: 4,
  },
  actionBtnEditText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#4f46e5',
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 3,
  },
  actionBtnDeleteText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#ef4444',
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
});
