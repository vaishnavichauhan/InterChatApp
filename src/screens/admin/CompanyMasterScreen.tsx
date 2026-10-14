import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import {
  BuildingIcon,
  CityIcon,
  PlusIcon,
  XMarkIcon,
  SearchIcon,
  UsersIcon,
  EditIcon,
  TrashIcon,
  CrownIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon,
  BanIcon,
  MapPinIcon,
} from '../../components/icons/SvgIcons';
import {
  Company,
  getCompanies,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
  getCompanyById,
} from '../../api/companyApi';

interface CompanyMasterScreenProps {
  navigation: any;
}

export const CompanyMasterScreen: React.FC<CompanyMasterScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Edit Modal (exact fields matching web CompanyMaster.jsx)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({
    company_name: '',
    description: '',
    phone: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    address: '',
  });
  const [updating, setUpdating] = useState(false);

  // View Departments Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [viewingCompany, setViewingCompany] = useState<any>(null);
  const [loadingDepts, setLoadingDepts] = useState(false);

  // Fetch Companies
  const fetchCompanyList = async () => {
    try {
      const res = await getCompanies(true);
      const list = res?.companies || res?.data || (Array.isArray(res) ? res : []);
      setCompanies(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load companies:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanyList();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCompanyList();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanyList();
  };

  // KPI Statistics
  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status === 'ACTIVE').length;
    const inactive = total - active;
    const mainComp = companies.find((c) => c.is_main);
    return { total, active, inactive, mainCompName: mainComp?.company_name || 'None' };
  }, [companies]);

  // Filtered List matching web search behavior
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.company_name && c.company_name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [companies, statusFilter, searchQuery]);

  // Open Edit Modal with web frontend fields
  const openEditModal = (comp: Company) => {
    setSelectedCompany(comp);
    setEditForm({
      company_name: comp.company_name || '',
      description: comp.description || '',
      phone: comp.phone || '',
      status: (comp.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
      address: comp.address || '',
    });
    setIsEditModalOpen(true);
  };

  // Update Company Handler
  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;
    if (!editForm.company_name.trim()) {
      Alert.alert('Required', 'Company name is required.');
      return;
    }

    try {
      setUpdating(true);
      await updateCompany(selectedCompany.id, {
        company_name: editForm.company_name.trim(),
        description: editForm.description ? editForm.description.trim() : '',
        phone: editForm.phone ? editForm.phone.trim() : '',
        address: editForm.address ? editForm.address.trim() : '',
        status: editForm.status,
      });

      setIsEditModalOpen(false);
      setSelectedCompany(null);
      fetchCompanyList();
      Alert.alert('Success', `Company "${editForm.company_name.trim()}" updated successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update company.');
    } finally {
      setUpdating(false);
    }
  };

  // Delete Company Handler (exact matching web confirm)
  const handleDeleteCompany = (comp: Company) => {
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete company "${comp.company_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCompany(comp.id);
              fetchCompanyList();
              Alert.alert('Success', `Company "${comp.company_name}" deleted.`);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete company.');
            }
          },
        },
      ]
    );
  };

  // Toggle Status Handler (Disable/Enable action with confirmation)
  const handleToggleStatus = (comp: Company) => {
    const isCurrentlyActive = comp.status === 'ACTIVE';
    const nextStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    Alert.alert(
      isCurrentlyActive ? 'Disable Company' : 'Enable Company',
      `Are you sure you want to ${action} company "${comp.company_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyActive ? 'Disable' : 'Enable',
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await toggleCompanyStatus(comp.id, nextStatus);
              fetchCompanyList();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  // View Company Departments Modal
  const openDepartmentsModal = async (comp: Company) => {
    setViewingCompany(comp);
    setIsDeptModalOpen(true);
    setLoadingDepts(true);
    try {
      const res = await getCompanyById(comp.id);
      const full = res?.company || res?.data || res || comp;
      setViewingCompany(full);
    } catch (err) {
      console.warn('Failed to load company departments:', err);
    } finally {
      setLoadingDepts(false);
    }
  };

  // List Header with Search & Status Dropdown
  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBar}>
          <SearchIcon size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search companies by name, description, mobile, or address..."
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
                    : '#2563eb',
              },
            ]}
          />
          <Text style={styles.dropdownTriggerText} numberOfLines={1}>
            {statusFilter === 'all'
              ? `All (${companies.length})`
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
        title="Company Master"
        titleAlign="left"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={[styles.headerCreateBtn, shadows.sm]}
            onPress={() => navigation.navigate('CreateCompany')}
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
                <LinearGradient id="headerCreateCompGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                  <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100" height="100" fill="url(#headerCreateCompGrad)" />
            </Svg>

            <View style={styles.headerCreateInner}>
              <View style={styles.headerCreateIconCircle}>
                <PlusIcon size={13} color="#ffffff" />
              </View>
              <Text style={styles.headerCreateText}>New Company</Text>
            </View>
          </TouchableOpacity>
        }
      />

      {/* ── KPI Statistics Ribbon ── */}
      <View style={styles.kpiRibbon}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiVal}>{stats.total}</Text>
          <Text style={styles.kpiLbl}>Total Entities</Text>
        </View>
        <View style={styles.kpiSep} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiVal, { color: '#059669' }]}>{stats.active}</Text>
          <Text style={styles.kpiLbl}>Active</Text>
        </View>
        <View style={styles.kpiSep} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiVal, { color: '#64748b' }]}>{stats.inactive}</Text>
          <Text style={styles.kpiLbl}>Inactive</Text>
        </View>
      </View>

      {/* ── Main List ── */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCompanies}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 64 },
          ]}
          renderItem={({ item }) => {
            const isActive = item.status === 'ACTIVE';
            const initial = item.company_name ? item.company_name.trim().charAt(0).toUpperCase() : 'C';

            return (
              <View style={[styles.compCard, shadows.sm]}>
                {/* ── Card Header: Avatar + Title + Status Pill ── */}
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.avatarBox,
                      item.is_main ? styles.avatarBoxMain : styles.avatarBoxNormal,
                    ]}
                  >
                    <Text style={styles.avatarText}>{initial}</Text>
                    {item.is_main && (
                      <View style={styles.mainCrownBadge}>
                        <CrownIcon size={10} color="#ffffff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.compInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.compName} numberOfLines={1}>
                        {item.company_name}
                      </Text>
                      {item.is_main && (
                        <View style={styles.mainTag}>
                          <Text style={styles.mainTagText}>MAIN</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Status Pill matching web */}
                  <View
                    style={[
                      styles.statusPill,
                      isActive ? styles.statusPillActive : styles.statusPillInactive,
                    ]}
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
                  </View>
                </View>

                {/* ── Description (Web Column 2) ── */}
                <View style={styles.descSection}>
                  <Text style={styles.sectionFieldLabel}>Description</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description ? item.description : 'No description'}
                  </Text>
                </View>

                {/* ── Contact Details: Mobile & Address (Web Columns 3 & 4) ── */}
                <View style={styles.contactDetailsSection}>
                  {/* Mobile Number */}
                  <View style={styles.fieldRow}>
                    <View style={styles.fieldRowIconWrap}>
                      <PhoneIcon size={13} color="#64748b" />
                    </View>
                    <Text style={styles.fieldText}>
                      {item.phone || '—'}
                    </Text>
                  </View>

                  {/* Address (Dedicated field as requested) */}
                  <View style={styles.fieldRow}>
                    <View style={styles.fieldRowIconWrap}>
                      <MapPinIcon size={14} color="#64748b" />
                    </View>
                    <Text style={styles.fieldText} numberOfLines={2}>
                      {item.address || 'No address provided'}
                    </Text>
                  </View>
                </View>

                {/* ── Card Divider ── */}
                <View style={styles.cardDivider} />

                {/* ── Card Footer: Metrics & Actions (Web Columns 5 & 6) ── */}
                <View style={styles.cardFooterRow}>
                  {/* View Departments Button */}
                  <TouchableOpacity
                    style={styles.metricChipBlue}
                    onPress={() => openDepartmentsModal(item)}
                    activeOpacity={0.7}
                  >
                    <BuildingIcon size={12} color="#1d4ed8" />
                    <Text style={styles.metricChipTextBlue}>
                      {item.department_count || (item.departments ? item.departments.length : 0)} Depts
                    </Text>
                    <ChevronRightIcon size={11} color="#2563eb" />
                  </TouchableOpacity>

                  {/* Actions Group: Edit, Disable/Enable, Delete */}
                  <View style={styles.cardActionsGroup}>
                    {/* 1. Edit Action */}
                    <TouchableOpacity
                      style={styles.actionBtnEdit}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.7}
                    >
                      <EditIcon size={11} color="#4338ca" />
                      <Text style={styles.actionBtnEditText}>Edit</Text>
                    </TouchableOpacity>

                    {/* 2. Disable / Enable Action */}
                    <TouchableOpacity
                      style={[
                        styles.actionBtnToggle,
                        isActive ? styles.actionBtnDisable : styles.actionBtnEnable,
                      ]}
                      onPress={() => handleToggleStatus(item)}
                      activeOpacity={0.7}
                    >
                      {isActive ? (
                        <BanIcon size={11} color="#b45309" />
                      ) : (
                        <CheckIcon size={11} color="#047857" />
                      )}
                      <Text
                        style={[
                          styles.actionBtnToggleText,
                          isActive ? styles.actionBtnDisableText : styles.actionBtnEnableText,
                        ]}
                      >
                        {isActive ? 'Disable' : 'Enable'}
                      </Text>
                    </TouchableOpacity>

                    {/* 3. Delete Action (hidden if is_main) */}
                    {!item.is_main && (
                      <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => handleDeleteCompany(item)}
                        activeOpacity={0.7}
                      >
                        <TrashIcon size={11} color="#be123c" />
                        <Text style={styles.actionBtnDeleteText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CityIcon size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Companies Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || statusFilter !== 'all'
                  ? 'No companies match your search query or filter.'
                  : 'Register your first company entity to organize corporate departments.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ── STATUS DROPDOWN MODAL ── */}
      <Modal visible={isDropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={[styles.dropdownModalContent, shadows.lg]}>
            <Text style={styles.dropdownModalTitle}>Filter by Status</Text>

            <TouchableOpacity
              style={[
                styles.dropdownOption,
                statusFilter === 'all' && styles.dropdownOptionActive,
              ]}
              onPress={() => {
                setStatusFilter('all');
                setIsDropdownOpen(false);
              }}
            >
              <View style={[styles.statusDot, { backgroundColor: '#2563eb' }]} />
              <Text style={styles.dropdownOptionText}>All Companies ({stats.total})</Text>
              {statusFilter === 'all' && <CheckIcon size={14} color="#2563eb" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dropdownOption,
                statusFilter === 'ACTIVE' && styles.dropdownOptionActive,
              ]}
              onPress={() => {
                setStatusFilter('ACTIVE');
                setIsDropdownOpen(false);
              }}
            >
              <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.dropdownOptionText}>Active Only ({stats.active})</Text>
              {statusFilter === 'ACTIVE' && <CheckIcon size={14} color="#10b981" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dropdownOption,
                statusFilter === 'INACTIVE' && styles.dropdownOptionActive,
              ]}
              onPress={() => {
                setStatusFilter('INACTIVE');
                setIsDropdownOpen(false);
              }}
            >
              <View style={[styles.statusDot, { backgroundColor: '#94a3b8' }]} />
              <Text style={styles.dropdownOptionText}>Inactive Only ({stats.inactive})</Text>
              {statusFilter === 'INACTIVE' && <CheckIcon size={14} color="#94a3b8" />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── EDIT COMPANY MODAL (Matching web frontend) ── */}
      <Modal visible={isEditModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: '#eef2ff' }]}>
                  <EditIcon size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Edit Company Details</Text>
                  <Text style={styles.modalSubtitle}>Update entity profile and registration metadata</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* 1. Company Name */}
              <Text style={styles.inputLabel}>
                Company Name <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={editForm.company_name}
                onChangeText={(text) => setEditForm({ ...editForm, company_name: text })}
                placeholder="e.g. Epoxy House, Acme Corp"
                placeholderTextColor={colors.textLight}
              />

              {/* 2. Company Description */}
              <Text style={styles.inputLabel}>Company Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                placeholder="Brief domain or business operations..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* 3. Mobile Number */}
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />

              {/* 4. Status */}
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    editForm.status === 'ACTIVE' && styles.statusChoiceBtnActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, status: 'ACTIVE' })}
                >
                  <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                  <Text
                    style={[
                      styles.statusChoiceText,
                      editForm.status === 'ACTIVE' && styles.statusChoiceTextActive,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    editForm.status === 'INACTIVE' && styles.statusChoiceBtnActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, status: 'INACTIVE' })}
                >
                  <View style={[styles.statusDot, { backgroundColor: '#94a3b8' }]} />
                  <Text
                    style={[
                      styles.statusChoiceText,
                      editForm.status === 'INACTIVE' && styles.statusChoiceTextActive,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 5. Address */}
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.address}
                onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                placeholder="Full office or registered address (Street, City, State, PIN)..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsEditModalOpen(false)}
                  style={{ flex: 1 }}
                />
                <AppButton
                  title="Update Company"
                  onPress={handleUpdateCompany}
                  loading={updating}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── VIEW COMPANY DEPARTMENTS MODAL (Matching web frontend) ── */}
      <Modal visible={isDeptModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.deptModalContent, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: '#eff6ff' }]}>
                  <BuildingIcon size={20} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {viewingCompany?.company_name || 'Company Departments'}
                  </Text>
                  <Text style={styles.modalSubtitle}>Departments hosted under this company entity</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsDeptModalOpen(false)}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {loadingDepts ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ marginTop: 8, fontSize: fontSizes.xs, color: colors.textMuted }}>
                    Loading departments...
                  </Text>
                </View>
              ) : !viewingCompany?.departments || viewingCompany.departments.length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ fontSize: fontSizes.xs, color: colors.textMuted, fontStyle: 'italic' }}>
                    No departments currently assigned to this company entity.
                  </Text>
                </View>
              ) : (
                viewingCompany.departments.map((d: any) => (
                  <View key={d.id} style={styles.deptItemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deptItemTitle}>{d.department_name}</Text>
                      {d.description ? (
                        <Text style={styles.deptItemDesc} numberOfLines={1}>
                          {d.description}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.deptItemStatusBadge,
                        d.status === 'ACTIVE' ? styles.deptItemStatusActive : styles.deptItemStatusInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.deptItemStatusText,
                          { color: d.status === 'ACTIVE' ? '#047857' : '#64748b' },
                        ]}
                      >
                        {d.status || 'ACTIVE'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.deptModalFooter}>
              <Text style={styles.deptModalCount}>
                Total: {viewingCompany?.departments ? viewingCompany.departments.length : 0} Departments
              </Text>
              <TouchableOpacity
                style={styles.manageInDeptMasterBtn}
                onPress={() => {
                  setIsDeptModalOpen(false);
                  navigation.navigate('DepartmentMaster');
                }}
              >
                <Text style={styles.manageInDeptMasterText}>Manage in Dept Master</Text>
              </TouchableOpacity>
            </View>
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

  /* ── Header Create Button ── */
  headerCreateBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    height: 34,
  },
  headerCreateInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: '100%',
    gap: 6,
  },
  headerCreateIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCreateText: {
    fontSize: 11,
    fontWeight: fontWeights.extrabold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  /* ── KPI Statistics Ribbon ── */
  kpiRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  kpiLbl: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  kpiSep: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },

  /* ── Search & Filters Header ── */
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    height: 40,
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

  /* ── Company Card Architecture ── */
  compCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatarBoxNormal: {
    backgroundColor: '#2D333B',
  },
  avatarBoxMain: {
    backgroundColor: '#7c3aed',
  },
  avatarText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: '#ffffff',
  },
  mainCrownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  mainTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  mainTagText: {
    fontSize: 8.5,
    fontWeight: fontWeights.extrabold,
    color: '#7c3aed',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusPillInactive: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  statusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    letterSpacing: 0.5,
  },

  /* ── Description & Contact Details ── */
  descSection: {
    marginTop: 4,
    marginBottom: 4,
  },
  sectionFieldLabel: {
    fontSize: 9.5,
    fontWeight: fontWeights.extrabold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  cardDesc: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  contactDetailsSection: {
    marginTop: 4,
    gap: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  fieldRowIconWrap: {
    marginTop: 2,
    width: 16,
    alignItems: 'center',
  },
  fieldText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: '#475569',
    lineHeight: 17,
  },

  /* ── Card Divider & Footer ── */
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: spacing.sm,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  metricChipBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 4,
  },
  metricChipTextBlue: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#1d4ed8',
  },

  /* ── Card Actions Row ── */
  cardActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    gap: 4,
  },
  actionBtnEditText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#4338ca',
  },
  actionBtnToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  actionBtnDisable: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  actionBtnToggleText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
  },
  actionBtnDisableText: {
    color: '#b45309',
  },
  actionBtnEnable: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  actionBtnEnableText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#047857',
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    gap: 4,
  },
  actionBtnDeleteText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#be123c',
  },

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
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  /* ── Modals ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
  },
  deptModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  modalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
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
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
  },
  inputLabel: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.extrabold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 44,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  textArea: {
    height: 70,
    paddingTop: spacing.sm,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  statusChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  statusChoiceBtnActive: {
    backgroundColor: '#ffffff',
    borderColor: colors.primary,
  },
  statusChoiceText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  statusChoiceTextActive: {
    color: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },

  /* ── View Departments Items ── */
  deptItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.xs,
  },
  deptItemTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  deptItemDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  deptItemStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  deptItemStatusActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  deptItemStatusInactive: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  deptItemStatusText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
  },
  deptModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: spacing.sm,
  },
  deptModalCount: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  manageInDeptMasterBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  manageInDeptMasterText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },

  /* ── Status Dropdown Modal ── */
  dropdownModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
  },
  dropdownModalTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: spacing.sm,
  },
  dropdownOptionActive: {
    backgroundColor: '#eff6ff',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
});
