import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppAvatar } from '../../components/common/AppAvatar';
import {
  SearchIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  LockIcon,
  UsersIcon,
  MessagesSquareIcon,
  ShieldCheckIcon,
  CityIcon,
  BuildingIcon,
  BuildingOfficeIcon,
} from '../../components/icons/SvgIcons';
import { createGroupChat, searchCoworkers } from '../../api/chatApi';
import { getDepartments } from '../../api/departmentApi';
import { getCompanies, Company } from '../../api/companyApi';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface CreateGroupScreenProps {
  navigation: any;
}

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const loadConversations = useChatStore((state) => state.loadConversations);

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'super admin' ||
    user?.username === 'admin' ||
    Number(user?.user_type_id) === 1 ||
    Number((user as any)?.role_id) === 1;

  const [title, setTitle] = useState('');
  const [groupType, setGroupType] = useState<'COMPANY' | 'CUSTOM'>('COMPANY');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [whoCanPost, setWhoCanPost] = useState<'ALL_MEMBERS' | 'SELECTED_MEMBERS' | 'ADMIN_ONLY'>('ALL_MEMBERS');

  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // Department state
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [allDeptsInCompanySelected, setAllDeptsInCompanySelected] = useState(true);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  // Coworkers & Permissions state
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [coworkers, setCoworkers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [allowedPosterIds, setAllowedPosterIds] = useState<number[]>([]);
  const [isLoadingCoworkers, setIsLoadingCoworkers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load available companies & departments
  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        setIsLoadingDepts(true);
        const [compRes, deptRes] = await Promise.allSettled([
          getCompanies(false),
          getDepartments(false),
        ]);

        if (compRes.status === 'fulfilled') {
          const cList = compRes.value?.companies || compRes.value?.data || (Array.isArray(compRes.value) ? compRes.value : []);
          const validComps = Array.isArray(cList) ? cList : [];
          if (isMounted) {
            setCompanies(validComps);
            if (validComps.length > 0 && selectedCompanyId === null) {
              const mainComp = validComps.find((c: any) => c.is_main) || validComps[0];
              setSelectedCompanyId(Number(mainComp.id));
            }
          }
        }

        if (deptRes.status === 'fulfilled') {
          const list = deptRes.value?.departments || deptRes.value?.data || (Array.isArray(deptRes.value) ? deptRes.value : []);
          const validList = Array.isArray(list) ? list : [];
          if (isMounted) {
            setDepartments(validList);
            if (validList.length > 0 && selectedDeptId === null) {
              setSelectedDeptId(Number(validList[0].id));
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load group creation metadata:', err);
      } finally {
        if (isMounted) setIsLoadingDepts(false);
      }
    };

    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered departments based on selected company
  const availableDepartmentsInScope = useMemo(() => {
    if (groupType !== 'COMPANY' || !selectedCompanyId) {
      return departments;
    }
    const filtered = departments.filter((d) => !d.company_id || Number(d.company_id) === Number(selectedCompanyId));
    return filtered.length > 0 ? filtered : departments;
  }, [departments, selectedCompanyId, groupType]);

  // Load and filter coworkers based on Company & Department scope
  useEffect(() => {
    let isMounted = true;
    const fetchCoworkers = async () => {
      try {
        setIsLoadingCoworkers(true);
        const params: any = {};

        if (!isAnnouncement) {
          if (groupType === 'COMPANY') {
            if (selectedCompanyId) {
              params.companyId = selectedCompanyId;
            }
            if (!allDeptsInCompanySelected && selectedDeptId) {
              params.departmentId = selectedDeptId;
            }
          } else if (selectedDeptId) {
            params.departmentId = selectedDeptId;
          }
        }

        const res = await searchCoworkers(searchMemberQuery, params);
        if (isMounted) {
          const list = res?.coworkers || res?.data || (Array.isArray(res) ? res : []);
          setCoworkers(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.warn('Failed to search coworkers:', err);
      } finally {
        if (isMounted) setIsLoadingCoworkers(false);
      }
    };

    const timer = setTimeout(fetchCoworkers, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchMemberQuery, selectedDeptId, isAnnouncement, groupType, selectedCompanyId, allDeptsInCompanySelected]);

  // Active company object
  const activeCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    return companies.find((c) => Number(c.id) === Number(selectedCompanyId)) || null;
  }, [companies, selectedCompanyId]);

  // Active department object
  const activeDepartment = useMemo(() => {
    if (!selectedDeptId) return null;
    return (
      availableDepartmentsInScope.find((d) => Number(d.department_id || d.id) === Number(selectedDeptId)) ||
      null
    );
  }, [availableDepartmentsInScope, selectedDeptId]);

  const toggleMember = (colleague: any) => {
    if (selectedMembers.some((m) => m.id === colleague.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== colleague.id));
      setAllowedPosterIds(allowedPosterIds.filter((id) => id !== colleague.id));
    } else {
      setSelectedMembers([...selectedMembers, colleague]);
      if (whoCanPost === 'SELECTED_MEMBERS') {
        setAllowedPosterIds([...allowedPosterIds, colleague.id]);
      }
    }
  };

  const toggleCanPost = (colleagueId: number) => {
    if (allowedPosterIds.includes(colleagueId)) {
      setAllowedPosterIds(allowedPosterIds.filter((id) => id !== colleagueId));
    } else {
      setAllowedPosterIds([...allowedPosterIds, colleagueId]);
    }
  };

  const handleCreate = async () => {
    if (!permissions.canGroup && !isAdmin) {
      Alert.alert(
        'Permission Restricted',
        'You do not have permission to create team channels. Please contact your system administrator.'
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert('Channel Name Required', 'Please enter a name for the channel.');
      return;
    }

    if (!isAnnouncement && groupType === 'COMPANY' && !selectedCompanyId) {
      Alert.alert('Company Required', 'Please select a company for this team channel.');
      return;
    }

    if (!isAnnouncement && (groupType === 'CUSTOM' || !allDeptsInCompanySelected) && !selectedDeptId) {
      Alert.alert('Department Required', 'Please select a department unit for this channel.');
      return;
    }

    if (!isAnnouncement && selectedMembers.length === 0) {
      Alert.alert('Members Required', 'Please select at least one coworker to join this channel.');
      return;
    }

    try {
      setSubmitting(true);
      const memberIds = selectedMembers.map((m) => m.id);
      const res = await createGroupChat({
        title: title.trim(),
        memberIds,
        isAnnouncement,
        whoCanPost: isAnnouncement ? 'ADMIN_ONLY' : whoCanPost,
        allowedMemberIds: whoCanPost === 'SELECTED_MEMBERS' ? allowedPosterIds : undefined,
        departmentId:
          isAnnouncement || (groupType === 'COMPANY' && allDeptsInCompanySelected)
            ? null
            : selectedDeptId
            ? Number(selectedDeptId)
            : null,
        companyId: groupType === 'COMPANY' && selectedCompanyId ? Number(selectedCompanyId) : null,
        isCompanyGroup: groupType === 'COMPANY',
      });

      const newGroup = res.data;
      await loadConversations(false);

      const successMessage = isAnnouncement
        ? 'Announcement channel created successfully!'
        : groupType === 'COMPANY'
        ? 'Company group created successfully!'
        : 'Group created successfully!';

      Alert.alert('Success', successMessage, [
        {
          text: 'OK',
          onPress: async () => {
            if (newGroup?.id) {
              await selectConversation(newGroup);
              navigation.replace('ChatDetail', { conversationId: newGroup.id });
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (err: any) {
      console.error('Group creation error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to create team channel. Please verify your permissions.';
      Alert.alert('Unable to Create Channel', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top App Header */}
      <AppHeader
        title="Create Team Group"
        subtitle="Create a private or team channel"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Permission Restriction Notice if user lacks group_create */}
      {!permissions.canGroup && !isAdmin && (
        <View style={styles.permissionBanner}>
          <LockIcon size={16} color={colors.warning} />
          <Text style={styles.permissionText}>
            Channel creation is restricted for your role. Contact your administrator for access.
          </Text>
        </View>
      )}

      {/* Main Form Scroll View with proper bottom clearance */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + 30 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* CHANNEL SCOPE & TYPE */}
        {!isAnnouncement && (
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>CHANNEL SCOPE & TYPE</Text>
            <View style={styles.capsuleRow}>
              {/* Company Group */}
              <TouchableOpacity
                style={[
                  styles.capsuleCard,
                  groupType === 'COMPANY' && styles.capsuleCardActive,
                ]}
                onPress={() => {
                  setGroupType('COMPANY');
                  setSelectedMembers([]);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.capsuleTop}>
                  <View style={styles.capsuleIconText}>
                    <BuildingOfficeIcon size={16} color={colors.primary} />
                    <Text style={styles.capsuleTitle}>Company</Text>
                  </View>
                  {groupType === 'COMPANY' && (
                    <View style={styles.activeCheckCircle}>
                      <CheckIcon size={10} color="#ffffff" />
                    </View>
                  )}
                </View>
                <Text style={styles.capsuleDesc}>
                  Scoped to an organization & departments.
                </Text>
              </TouchableOpacity>

              {/* Custom Group */}
              <TouchableOpacity
                style={[
                  styles.capsuleCard,
                  groupType === 'CUSTOM' && styles.capsuleCardActive,
                ]}
                onPress={() => {
                  setGroupType('CUSTOM');
                  setSelectedMembers([]);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.capsuleTop}>
                  <View style={styles.capsuleIconText}>
                    <UsersIcon size={16} color="#7c3aed" />
                    <Text style={styles.capsuleTitle}>Custom</Text>
                  </View>
                  {groupType === 'CUSTOM' && (
                    <View style={styles.activeCheckCircle}>
                      <CheckIcon size={10} color="#ffffff" />
                    </View>
                  )}
                </View>
                <Text style={styles.capsuleDesc}>
                  Cross-department coworker group.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ORGANIZATION / COMPANY (When groupType === 'COMPANY') */}
        {!isAnnouncement && groupType === 'COMPANY' && (
          <View style={styles.fieldSection}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>
                ORGANIZATION / COMPANY <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={styles.boundaryBadge}>COMPANY SCOPE</Text>
            </View>

            {companies.length === 0 ? (
              <View style={[styles.pickerButton, styles.pickerButtonDisabled]}>
                <Text style={styles.noDeptsText}>No companies available.</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setIsCompanyModalOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerButtonText} numberOfLines={1}>
                  🏛️ {activeCompany?.company_name || activeCompany?.name || 'Select Company'}
                  {activeCompany?.is_main ? ' (Headquarters)' : ''}
                </Text>
                <ChevronDownIcon size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Scope inside Company: All Depts vs Specific Dept */}
            <View style={styles.companyScopeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.scopeOptionChip,
                  allDeptsInCompanySelected && styles.scopeOptionChipActive,
                ]}
                onPress={() => {
                  setAllDeptsInCompanySelected(true);
                  setSelectedMembers([]);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.scopeOptionText,
                    allDeptsInCompanySelected && styles.scopeOptionTextActive,
                  ]}
                >
                  🌐 Entire Company (All Depts)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scopeOptionChip,
                  !allDeptsInCompanySelected && styles.scopeOptionChipActive,
                ]}
                onPress={() => {
                  setAllDeptsInCompanySelected(false);
                  setSelectedMembers([]);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.scopeOptionText,
                    !allDeptsInCompanySelected && styles.scopeOptionTextActive,
                  ]}
                >
                  🏢 Specific Department
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* DEPARTMENT UNIT (If CUSTOM group or specific department chosen for COMPANY) */}
        {!isAnnouncement && (groupType === 'CUSTOM' || !allDeptsInCompanySelected) && (
          <View style={styles.fieldSection}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>
                DEPARTMENT UNIT <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={styles.boundaryBadge}>CHANNEL BOUNDARY</Text>
            </View>

            {isLoadingDepts ? (
              <View style={styles.pickerButton}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.pickerLoadingText}>Loading departments...</Text>
              </View>
            ) : availableDepartmentsInScope.length === 0 ? (
              <View style={[styles.pickerButton, styles.pickerButtonDisabled]}>
                <Text style={styles.noDeptsText}>No department found for this company.</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setIsDeptModalOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerButtonText} numberOfLines={1}>
                  🏢 {activeDepartment?.department_name || activeDepartment?.name || 'Select Department'}
                </Text>
                <ChevronDownIcon size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* GROUP NAME */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>GROUP NAME</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Operations & Support, Engineering..."
            placeholderTextColor={colors.textLight}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
        </View>

        {/* WHO CAN SEND MESSAGES? */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>WHO CAN SEND MESSAGES?</Text>
          <View style={styles.capsuleRow}>
            {/* All */}
            <TouchableOpacity
              style={[
                styles.capsuleCard,
                whoCanPost === 'ALL_MEMBERS' && styles.capsuleCardActive,
              ]}
              onPress={() => setWhoCanPost('ALL_MEMBERS')}
              activeOpacity={0.75}
            >
              <View style={styles.capsuleTop}>
                <View style={styles.capsuleIconText}>
                  <MessagesSquareIcon size={16} color={colors.primary} />
                  <Text style={styles.capsuleTitle}>All</Text>
                </View>
                {whoCanPost === 'ALL_MEMBERS' && (
                  <View style={styles.activeCheckCircle}>
                    <CheckIcon size={10} color="#ffffff" />
                  </View>
                )}
              </View>
              <Text style={styles.capsuleDesc}>
                All members can post messages & files.
              </Text>
            </TouchableOpacity>

            {/* Selected */}
            <TouchableOpacity
              style={[
                styles.capsuleCard,
                whoCanPost === 'SELECTED_MEMBERS' && styles.capsuleCardActive,
              ]}
              onPress={() => setWhoCanPost('SELECTED_MEMBERS')}
              activeOpacity={0.75}
            >
              <View style={styles.capsuleTop}>
                <View style={styles.capsuleIconText}>
                  <UsersIcon size={16} color="#7c3aed" />
                  <Text style={styles.capsuleTitle}>Selected</Text>
                </View>
                {whoCanPost === 'SELECTED_MEMBERS' && (
                  <View style={styles.activeCheckCircle}>
                    <CheckIcon size={10} color="#ffffff" />
                  </View>
                )}
              </View>
              <Text style={styles.capsuleDesc}>
                Admins & selected members can post.
              </Text>
            </TouchableOpacity>

            {/* Admins */}
            <TouchableOpacity
              style={[
                styles.capsuleCard,
                whoCanPost === 'ADMIN_ONLY' && styles.capsuleCardActive,
              ]}
              onPress={() => setWhoCanPost('ADMIN_ONLY')}
              activeOpacity={0.75}
            >
              <View style={styles.capsuleTop}>
                <View style={styles.capsuleIconText}>
                  <LockIcon size={16} color="#d97706" />
                  <Text style={styles.capsuleTitle}>Admins</Text>
                </View>
                {whoCanPost === 'ADMIN_ONLY' && (
                  <View style={styles.activeCheckCircle}>
                    <CheckIcon size={10} color="#ffffff" />
                  </View>
                )}
              </View>
              <Text style={styles.capsuleDesc}>
                Only group admins can send messages.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* OFFICIAL MASTER ANNOUNCEMENT CHANNEL (Admin only) */}
        {isAdmin && (
          <TouchableOpacity
            style={[
              styles.announcementCard,
              isAnnouncement && styles.announcementCardActive,
            ]}
            onPress={() => {
              const nextVal = !isAnnouncement;
              setIsAnnouncement(nextVal);
              if (nextVal) {
                setWhoCanPost('ADMIN_ONLY');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.customCheckbox, isAnnouncement && styles.customCheckboxChecked]}>
              {isAnnouncement && <CheckIcon size={12} color="#ffffff" />}
            </View>
            <View style={styles.announcementMeta}>
              <Text style={styles.announcementTitle}>
                <Text style={styles.hashSymbol}># </Text>Official Master Announcement Channel
              </Text>
              <Text style={styles.announcementSubtitle}>
                Global company broadcast channel (pinned for all employees).
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ADD DEPARTMENT COWORKERS (If not announcement) */}
        {!isAnnouncement && (
          <View style={styles.fieldSection}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>ADD DEPARTMENT COWORKERS</Text>
              {selectedMembers.length > 0 && (
                <Text style={styles.selectedCountText}>
                  {selectedMembers.length} selected
                </Text>
              )}
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <SearchIcon size={16} color={colors.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, email, or mobile number..."
                placeholderTextColor={colors.textLight}
                value={searchMemberQuery}
                onChangeText={setSearchMemberQuery}
              />
              {searchMemberQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchMemberQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <CloseIcon size={16} color={colors.textLight} />
                </TouchableOpacity>
              )}
            </View>

            {/* Selected Members Chip Pills */}
            {selectedMembers.length > 0 && (
              <View style={styles.chipsWrapper}>
                {selectedMembers.map((m) => (
                  <View key={m.id} style={styles.chipPill}>
                    <Text style={styles.chipText} numberOfLines={1}>
                      {m.name || m.username}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleMember(m)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <CloseIcon size={12} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Coworker Results List (Clean card layout, fully scrollable, no cut-off) */}
            <View style={styles.coworkerListCard}>
              {isLoadingCoworkers ? (
                <View style={styles.listEmptyState}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.emptyStateText}>Searching coworkers...</Text>
                </View>
              ) : coworkers.length === 0 ? (
                <View style={styles.listEmptyState}>
                  <Text style={styles.emptyStateText}>No matching department coworkers found</Text>
                </View>
              ) : (
                coworkers.map((colleague, index) => {
                  const isSelected = selectedMembers.some((m) => m.id === colleague.id);
                  const isPoster = allowedPosterIds.includes(colleague.id);
                  const isLast = index === coworkers.length - 1;
                  return (
                    <TouchableOpacity
                      key={colleague.id}
                      style={[
                        styles.coworkerRow,
                        isSelected && styles.coworkerRowSelected,
                        isLast && { borderBottomWidth: 0 },
                      ]}
                      onPress={() => toggleMember(colleague)}
                      activeOpacity={0.7}
                    >
                      <AppAvatar name={colleague.name || colleague.username} size={36} />

                      <View style={styles.coworkerInfo}>
                        <View style={styles.nameBadgeRow}>
                          <Text style={styles.coworkerName} numberOfLines={1}>
                            {colleague.name || colleague.username}
                          </Text>
                          {colleague.company_name && (
                            <View style={styles.compBadgePill}>
                              <Text style={styles.compBadgeText} numberOfLines={1}>
                                🏛️ {colleague.company_name}
                              </Text>
                            </View>
                          )}
                          {colleague.department_names && (
                            <View style={styles.deptBadgePill}>
                              <Text style={styles.deptBadgeText} numberOfLines={1}>
                                {colleague.department_names}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.coworkerSub} numberOfLines={1}>
                          {colleague.email}
                          {colleague.mobile_number ? ` • ${colleague.mobile_number}` : ''}
                        </Text>
                      </View>

                      {isSelected && whoCanPost === 'SELECTED_MEMBERS' && (
                        <TouchableOpacity
                          style={[
                            styles.postPermissionBadge,
                            isPoster ? styles.postPermissionBadgeActive : styles.postPermissionBadgeReadOnly,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleCanPost(colleague.id);
                          }}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Text
                            style={[
                              styles.postPermissionText,
                              isPoster ? styles.postPermissionTextActive : styles.postPermissionTextReadOnly,
                            ]}
                          >
                            {isPoster ? '✏️ Can Post' : '👁️ Read-only'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <View style={[styles.selectBox, isSelected && styles.selectBoxChecked]}>
                        {isSelected && <CheckIcon size={12} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* Action Buttons (Submit & Cancel) inside ScrollView so they never hide inputs or get covered by keyboard */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || (!isAnnouncement && selectedMembers.length === 0)) && styles.submitButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={submitting || (!isAnnouncement && selectedMembers.length === 0)}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isAnnouncement
                  ? 'Create Announcement Hub'
                  : `Create Group (${selectedMembers.length})`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Department Picker Bottom Sheet / Modal */}
      <Modal
        visible={isDeptModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsDeptModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setIsDeptModalOpen(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Department Unit</Text>
              <TouchableOpacity
                onPress={() => setIsDeptModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseIcon size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableDepartmentsInScope}
              keyExtractor={(item) => String(item.department_id || item.id)}
              renderItem={({ item }) => {
                const id = Number(item.department_id || item.id);
                const isSelected = selectedDeptId === id;
                return (
                  <TouchableOpacity
                    style={[styles.deptOption, isSelected && styles.deptOptionSelected]}
                    onPress={() => {
                      setSelectedDeptId(id);
                      setSelectedMembers([]);
                      setIsDeptModalOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.deptOptionTextRow}>
                      <Text style={styles.deptOptionEmoji}>🏢</Text>
                      <Text style={[styles.deptOptionName, isSelected && styles.deptOptionNameSelected]}>
                        {item.department_name || item.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.deptOptionCheck}>
                        <CheckIcon size={14} color={colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingHorizontal: spacing.md }}
              ItemSeparatorComponent={() => <View style={styles.deptSeparator} />}
            />
          </View>
        </View>
      </Modal>

      {/* Company Picker Bottom Sheet / Modal */}
      <Modal
        visible={isCompanyModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCompanyModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setIsCompanyModalOpen(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Organization / Company</Text>
              <TouchableOpacity
                onPress={() => setIsCompanyModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseIcon size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={companies}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const id = Number(item.id);
                const isSelected = selectedCompanyId === id;
                return (
                  <TouchableOpacity
                    style={[styles.deptOption, isSelected && styles.deptOptionSelected]}
                    onPress={() => {
                      setSelectedCompanyId(id);
                      setSelectedDeptId(null);
                      setSelectedMembers([]);
                      setIsCompanyModalOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.deptOptionTextRow}>
                      <Text style={styles.deptOptionEmoji}>🏛️</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deptOptionName, isSelected && styles.deptOptionNameSelected]}>
                          {item.company_name || item.name}
                          {item.is_main ? ' (Headquarters)' : ''}
                        </Text>
                        {item.company_code && (
                          <Text style={styles.companyOptionSub}>Code: {item.company_code}</Text>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.deptOptionCheck}>
                        <CheckIcon size={14} color={colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingHorizontal: spacing.md }}
              ItemSeparatorComponent={() => <View style={styles.deptSeparator} />}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderBottomWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  permissionText: {
    flex: 1,
    fontSize: fontSizes.tiny,
    color: '#92400e',
    fontWeight: fontWeights.semibold,
  },
  scrollContainer: {
    padding: spacing.md,
  },
  fieldSection: {
    marginBottom: spacing.md + 2,
  },
  fieldLabel: {
    fontSize: fontSizes.tiny + 1,
    fontWeight: fontWeights.extrabold,
    color: '#334155',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs + 2,
  },
  requiredStar: {
    color: '#ef4444',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  boundaryBadge: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.semibold,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  selectedCountText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  textInput: {
    height: 48,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md + 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.sm + 1,
    color: '#0f172a',
    fontWeight: fontWeights.medium,
  },
  pickerButton: {
    height: 48,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md + 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  pickerButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  pickerButtonText: {
    fontSize: fontSizes.sm + 1,
    fontWeight: fontWeights.semibold,
    color: '#1e293b',
    flex: 1,
  },
  pickerLoadingText: {
    fontSize: fontSizes.sm,
    color: '#94a3b8',
    marginLeft: spacing.xs,
  },
  noDeptsText: {
    fontSize: fontSizes.sm,
    color: '#ef4444',
    fontWeight: fontWeights.medium,
  },
  capsuleRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  capsuleCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.md + 2,
    padding: spacing.sm,
    minHeight: 82,
    justifyContent: 'space-between',
  },
  capsuleCardActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  capsuleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  capsuleIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capsuleTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: '#0f172a',
  },
  activeCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleDesc: {
    fontSize: fontSizes.tiny,
    color: '#64748b',
    lineHeight: 14,
    fontWeight: fontWeights.regular,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: borderRadius.md + 2,
    padding: spacing.md,
    marginBottom: spacing.md + 2,
  },
  announcementCardActive: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  customCheckboxChecked: {
    backgroundColor: '#d97706',
    borderColor: '#d97706',
  },
  announcementMeta: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: '#92400e',
  },
  hashSymbol: {
    fontSize: fontSizes.sm + 1,
    fontWeight: fontWeights.black,
    color: '#d97706',
  },
  announcementSubtitle: {
    fontSize: fontSizes.tiny,
    color: '#b45309',
    marginTop: 2,
    lineHeight: 15,
  },
  searchBar: {
    height: 44,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md + 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: '#0f172a',
    padding: 0,
    marginLeft: spacing.xs,
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  chipText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    maxWidth: 120,
  },
  coworkerListCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md + 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  coworkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  coworkerRowSelected: {
    backgroundColor: colors.primarySubtle,
  },
  coworkerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coworkerName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#0f172a',
  },
  deptBadgePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  deptBadgeText: {
    fontSize: fontSizes.tiny - 1,
    fontWeight: fontWeights.bold,
    color: '#475569',
  },
  coworkerSub: {
    fontSize: fontSizes.tiny,
    color: '#64748b',
    marginTop: 2,
  },
  selectBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  listEmptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyStateText: {
    fontSize: fontSizes.sm,
    color: '#94a3b8',
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#64748b',
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '65%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  sheetTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.extrabold,
    color: '#0f172a',
  },
  deptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  deptOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  deptOptionTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  deptOptionEmoji: {
    fontSize: fontSizes.base,
  },
  deptOptionName: {
    fontSize: fontSizes.sm + 1,
    fontWeight: fontWeights.semibold,
    color: '#1e293b',
  },
  deptOptionNameSelected: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  deptOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptSeparator: {
    height: 1,
    backgroundColor: '#f8fafc',
  },
  companyScopeToggleRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.xs + 2,
  },
  scopeOptionChip: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm + 2,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeOptionChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: colors.primary,
  },
  scopeOptionText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.semibold,
    color: '#64748b',
    textAlign: 'center',
  },
  scopeOptionTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  companyOptionSub: {
    fontSize: fontSizes.tiny,
    color: '#64748b',
    marginTop: 2,
  },
  compBadgePill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#bfdbfe',
  },
  compBadgeText: {
    fontSize: fontSizes.tiny - 1,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  postPermissionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: spacing.xs,
  },
  postPermissionBadgeActive: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  postPermissionBadgeReadOnly: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  postPermissionText: {
    fontSize: fontSizes.tiny - 1,
    fontWeight: fontWeights.bold,
  },
  postPermissionTextActive: {
    color: '#059669',
  },
  postPermissionTextReadOnly: {
    color: '#64748b',
  },
});
