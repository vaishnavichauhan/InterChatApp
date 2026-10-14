import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/common/AppHeader';
import {
  UserIcon,
  LockIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldUserIcon,
  BuildingIcon,
  BuildingOfficeIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshIcon,
  PlusIcon,
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
  CloseIcon,
  GlobeIcon,
  NetworkIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '../../components/icons/SvgIcons';
import { createUserByAdmin, getUserTypes } from '../../api/adminApi';
import { getDepartments } from '../../api/departmentApi';
import { getCompanies, Company } from '../../api/companyApi';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';

interface CreateUserScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateUser'>;
}

export const CreateUserScreen: React.FC<CreateUserScreenProps> = ({ navigation }) => {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Lists from backend
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [userTypes, setUserTypes] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Modal visibility states for dropdowns
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const [singleDeptModalVisible, setSingleDeptModalVisible] = useState(false);
  const [singleDeptSearch, setSingleDeptSearch] = useState('');

  // ── Step 1: Form Fields ──────────────────────────────────────
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameCustomized, setIsUsernameCustomized] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [mobNo, setMobNo] = useState('');
  const [dateOfJoin, setDateOfJoin] = useState(new Date().toISOString().split('T')[0]);
  const [deviceVerificationRequired, setDeviceVerificationRequired] = useState(false);

  // ── Step 2: Role, Vendor Policy & Department Assignment ──────
  const [userTypeId, setUserTypeId] = useState<string>('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [deptRole, setDeptRole] = useState<'USER' | 'ADMIN'>('USER');
  const [isVendor, setIsVendor] = useState(false);
  const [canChatWithVendors, setCanChatWithVendors] = useState(false);

  // Mode: 'SINGLE' or 'MULTIPLE'
  const [deptAssignmentMode, setDeptAssignmentMode] = useState<'SINGLE' | 'MULTIPLE'>('MULTIPLE');
  const [selectedSingleDept, setSelectedSingleDept] = useState<number | null>(null);
  const [selectedMultiDepts, setSelectedMultiDepts] = useState<number[]>([]);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');

  // ── Step 3: Inter-Department Chat Permissions ─────────────────
  const [chatScopeMode, setChatScopeMode] = useState<'OWN' | 'ALL' | 'CUSTOM'>('OWN');
  const [customChatDepts, setCustomChatDepts] = useState<number[]>([]);
  const [chatDeptSearchQuery, setChatDeptSearchQuery] = useState('');

  // ── Step 4: Inter-Company Cross-Entity Access ─────────────────
  const [interCompanyMode, setInterCompanyMode] = useState<'NONE' | 'ALL' | 'CUSTOM'>('NONE');
  const [selectedInterCompanies, setSelectedInterCompanies] = useState<number[]>([]);
  const [interCompanyDeptScope, setInterCompanyDeptScope] = useState<'ALL' | 'CUSTOM'>('ALL');
  const [selectedInterCompanyDepts, setSelectedInterCompanyDepts] = useState<number[]>([]);

  useEffect(() => {
    loadFormDependencies();
  }, []);

  const loadFormDependencies = async () => {
    setLoadingOptions(true);
    try {
      const [typesRes, deptsRes, compRes] = await Promise.allSettled([
        getUserTypes(),
        getDepartments(false),
        getCompanies(false),
      ]);

      if (compRes.status === 'fulfilled') {
        const cRes = compRes.value;
        const cList = cRes?.companies || cRes?.data || (Array.isArray(cRes) ? cRes : []);
        const validComps = Array.isArray(cList) ? cList : [];
        setCompaniesList(validComps);
        if (validComps.length > 0) {
          const mainComp = validComps.find((c: any) => c.is_main) || validComps[0];
          setSelectedCompanyId(mainComp.id);
        }
      }

      if (typesRes.status === 'fulfilled') {
        const tVal = typesRes.value;
        const tList = tVal.data?.data || tVal.data || [];
        const validTypes = Array.isArray(tList) ? tList : [];
        setUserTypes(validTypes);
        if (validTypes.length > 0) {
          const defaultType =
            validTypes.find(
              (t: any) =>
                t.type_name?.toLowerCase().includes('specialist') ||
                t.type_name?.toLowerCase().includes('member') ||
                t.type_name?.toLowerCase().includes('staff')
            ) || validTypes[0];

          setUserTypeId(String(defaultType.id));
          const name = (defaultType.type_name || '').toLowerCase();
          const isSuper = name.includes('super admin') || defaultType.id === 1;
          const isDeptAdm = name.includes('department admin') || name.includes('dept admin') || defaultType.id === 2;
          const isVendorRole = Boolean(defaultType.is_vendor) || name.includes('vendor');

          setRole(isSuper ? 'admin' : 'user');
          setDeptRole(isSuper || isDeptAdm ? 'ADMIN' : 'USER');
          setIsVendor(isVendorRole);
        }
      }

      if (deptsRes.status === 'fulfilled') {
        const dVal = deptsRes.value;
        const dList =
          dVal?.departments ||
          dVal?.data ||
          (Array.isArray(dVal) ? dVal : []);
        const validDepts = Array.isArray(dList) ? dList : [];
        setDepartmentsList(validDepts);
        if (validDepts.length > 0) {
          setSelectedSingleDept(validDepts[0].id);
          setSelectedMultiDepts([validDepts[0].id]);
        }
      }
    } catch (err) {
      console.error('Failed to load user dependencies:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Selected company object
  const selectedCompanyObj = useMemo(() => {
    return companiesList.find((c) => Number(c.id) === Number(selectedCompanyId)) || null;
  }, [companiesList, selectedCompanyId]);

  // Selected user type object
  const selectedTypeObj = useMemo(() => {
    return userTypes.find((t) => String(t.id) === String(userTypeId)) || null;
  }, [userTypes, userTypeId]);

  // Selected single department object
  const selectedSingleDeptObj = useMemo(() => {
    return departmentsList.find((d) => Number(d.id) === Number(selectedSingleDept)) || null;
  }, [departmentsList, selectedSingleDept]);

  // Filter departments for Step 2 by company and query
  const filteredDepartments = useMemo(() => {
    if (!selectedCompanyId) return departmentsList;
    const matched = departmentsList.filter(
      (d) => !d.company_id || Number(d.company_id) === Number(selectedCompanyId)
    );
    return matched.length > 0 ? matched : departmentsList;
  }, [departmentsList, selectedCompanyId]);

  const searchedAssignDepts = useMemo(() => {
    if (!deptSearchQuery.trim()) return filteredDepartments;
    const q = deptSearchQuery.toLowerCase();
    return filteredDepartments.filter((d) =>
      (d.department_name && d.department_name.toLowerCase().includes(q)) ||
      (d.company_name && d.company_name.toLowerCase().includes(q))
    );
  }, [filteredDepartments, deptSearchQuery]);

  // Filter departments for Step 3
  const searchedChatDepts = useMemo(() => {
    if (!chatDeptSearchQuery.trim()) return departmentsList;
    const q = chatDeptSearchQuery.toLowerCase();
    return departmentsList.filter((d) =>
      d.department_name && d.department_name.toLowerCase().includes(q)
    );
  }, [departmentsList, chatDeptSearchQuery]);

  // Filter companies in modal
  const searchedCompanies = useMemo(() => {
    if (!companySearch.trim()) return companiesList;
    const q = companySearch.toLowerCase();
    return companiesList.filter((c) =>
      (c.company_name && c.company_name.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }, [companiesList, companySearch]);

  // Filter departments in single-dept modal
  const searchedSingleDepts = useMemo(() => {
    if (!singleDeptSearch.trim()) return filteredDepartments;
    const q = singleDeptSearch.toLowerCase();
    return filteredDepartments.filter((d) =>
      d.department_name && d.department_name.toLowerCase().includes(q)
    );
  }, [filteredDepartments, singleDeptSearch]);

  // Auto-generate username from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isUsernameCustomized) {
      const autoSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
      setUsername(autoSlug);
    }
  };

  // Auto-generate secure password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
    Alert.alert('Secure Password Generated', `Generated: ${pass}`);
  };

  // Handle Role selection change
  const handleRoleSelect = (type: any) => {
    const typeId = String(type.id);
    const typeName = (type.type_name || '').toLowerCase();
    const isSuper = typeName.includes('super admin') || type.id === 1;
    const isDeptAdm =
      typeName.includes('department admin') || typeName.includes('dept admin') || type.id === 2;
    const isVendorRole = Boolean(type.is_vendor) || typeName.includes('vendor');

    setUserTypeId(typeId);
    setRole(isSuper ? 'admin' : 'user');
    setIsVendor(isVendorRole);

    if (isSuper || isDeptAdm) {
      setDeptRole('ADMIN');
      setDeptAssignmentMode('MULTIPLE');
      if (isSuper && departmentsList.length > 0) {
        setSelectedMultiDepts(departmentsList.map((d) => d.id));
      }
    } else {
      setDeptRole('USER');
    }
    setRoleModalVisible(false);
  };

  // Step 2: Multi-dept assignment toggles
  const toggleMultiDept = (id: number) => {
    setSelectedMultiDepts((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          Alert.alert('Selection Required', 'At least one department must remain selected.');
          return prev;
        }
        return prev.filter((d) => d !== id);
      }
      return [...prev, id];
    });
  };

  const selectAllAssignDepts = () => {
    setSelectedMultiDepts(filteredDepartments.map((d) => d.id));
  };

  const clearAllAssignDepts = () => {
    if (filteredDepartments.length > 0) {
      setSelectedMultiDepts([filteredDepartments[0].id]);
      setSelectedSingleDept(filteredDepartments[0].id);
    } else {
      setSelectedMultiDepts([]);
    }
  };

  // Step 3: Inter-department permissions
  const toggleCustomChatDept = (id: number) => {
    setCustomChatDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectAllChatDepts = () => {
    setCustomChatDepts(departmentsList.map((d) => d.id));
  };

  const clearAllChatDepts = () => {
    setCustomChatDepts([]);
  };

  // Step 4: Inter-company permissions
  const toggleInterCompany = (id: number) => {
    setSelectedInterCompanies((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAllInterCompanies = () => {
    const others = companiesList
      .filter((c) => Number(c.id) !== Number(selectedCompanyId))
      .map((c) => c.id);
    setSelectedInterCompanies(others.length > 0 ? others : companiesList.map((c) => c.id));
  };

  const clearAllInterCompanies = () => {
    setSelectedInterCompanies([]);
  };

  const toggleInterCompanyDept = (id: number) => {
    setSelectedInterCompanyDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectAllInterCompanyDepts = () => {
    setSelectedInterCompanyDepts(departmentsList.map((d) => d.id));
  };

  const clearAllInterCompanyDepts = () => {
    setSelectedInterCompanyDepts([]);
  };

  // ── Submit Account Creation ──────────────────────────────────
  const handleCreateUser = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter employee Full Name.');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid Username.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid Email address.');
      return;
    }
    if (!password || password.length < 4) {
      Alert.alert('Validation Error', 'Password must be at least 4 characters.');
      return;
    }
    if (!selectedCompanyId) {
      Alert.alert('Validation Error', 'Please select a Primary Company Entity.');
      return;
    }
    if (!userTypeId) {
      Alert.alert('Validation Error', 'Please select a User Role / Security Profile.');
      return;
    }

    // Build department payload
    let departmentsPayload: any[] = [];
    const isDepartmentAdminRole = deptRole === 'ADMIN' || role === 'admin';

    if (isDepartmentAdminRole) {
      if (selectedMultiDepts.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one authorized department for this admin.');
        return;
      }
      departmentsPayload = selectedMultiDepts.map((id) => ({
        departmentId: Number(id),
        role: 'ADMIN',
      }));
    } else {
      if (deptAssignmentMode === 'MULTIPLE') {
        if (selectedMultiDepts.length === 0) {
          Alert.alert('Validation Error', 'Please select at least one assigned department.');
          return;
        }
        departmentsPayload = selectedMultiDepts.map((id) => ({
          departmentId: Number(id),
          role: 'USER',
        }));
      } else {
        if (!selectedSingleDept) {
          Alert.alert('Validation Error', 'Please assign the user to a department.');
          return;
        }
        departmentsPayload = [
          {
            departmentId: Number(selectedSingleDept),
            role: 'USER',
          },
        ];
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        userTypeId: Number(userTypeId),
        companyId: Number(selectedCompanyId),
        mobNo: mobNo.trim() || null,
        dateOfJoin: dateOfJoin.trim() || null,
        deviceVerificationRequired,
        role,
        departments: departmentsPayload,
        canChatWithVendors: Boolean(canChatWithVendors),
        isVendor: Boolean(isVendor),
        mustChangePassword: true,
        canChatAllDepartments: chatScopeMode === 'ALL',
        allowedChatDepartments: chatScopeMode === 'CUSTOM' ? customChatDepts : [],
        canChatAllCompanies: interCompanyMode === 'ALL',
        allowedChatCompanies:
          interCompanyMode === 'CUSTOM'
            ? {
                companyIds: selectedInterCompanies,
                departmentIds: interCompanyDeptScope === 'ALL' ? [] : selectedInterCompanyDepts,
              }
            : { companyIds: [], departmentIds: [] },
      };

      const res = await createUserByAdmin(payload);
      if (res.data?.success || res.status === 201 || res.status === 200) {
        Alert.alert('Success', `User account "${name}" created successfully!`, [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to create user account.');
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Failed to create user account.';
      Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isRoleAdmin = deptRole === 'ADMIN' || role === 'admin';

  return (
    <View style={styles.container}>
      <AppHeader
        title="Create User Account"
        showBack
        rightAction
        onBack={() => navigation.goBack()}
      />

      {loadingOptions ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading role profiles, departments & companies...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Header Banner ── */}
          <View style={styles.headerBanner}>
            <View style={styles.headerTagRow}>
              <View style={styles.headerTagPill}>
                <Text style={styles.headerTagText}>ENTERPRISE DIRECTORY</Text>
              </View>
              <View style={styles.headerCountPills}>
                <Text style={styles.countPillText}>{departmentsList.length} Depts</Text>
                <Text style={styles.countPillDot}>•</Text>
                <Text style={styles.countPillText}>{companiesList.length} Companies</Text>
                <Text style={styles.countPillDot}>•</Text>
                <Text style={styles.countPillText}>{userTypes.length} Roles</Text>
              </View>
            </View>
            <Text style={styles.headerBannerTitle}>Create User Account</Text>
            <Text style={styles.headerBannerSub}>
              Setup employee credentials, assign single or multiple departments, and define organizational messaging scope.
            </Text>
          </View>

          {/* ── CARD 1: Account Identity & Credentials ── */}
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIconBox}>
                <UserIcon size={18} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderTextBox}>
                <Text style={styles.cardHeaderTitle}>1. Account Identity & Credentials</Text>
                <Text style={styles.cardHeaderSubtitle}>
                  Employee personal profile details, authentication keys, and security settings
                </Text>
              </View>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 1</Text>
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Full Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <UserIcon size={16} color={colors.textLight} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Alex Rivera"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={handleNameChange}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Username <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={[styles.textInput, styles.fontMono]}
                  placeholder="e.g. alex_rivera"
                  placeholderTextColor={colors.textLight}
                  value={username}
                  onChangeText={(val) => {
                    setIsUsernameCustomized(true);
                    setUsername(val.toLowerCase().replace(/\s+/g, ''));
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.inputHelpText}>Used for system login and enterprise mentions</Text>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Email Address <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefixIcon}>✉</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. alex@company.com"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRowBetween}>
                <Text style={styles.inputLabel}>
                  Password <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={handleGeneratePassword}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.autoGenBtn}
                >
                  <RefreshIcon size={12} color={colors.primary} />
                  <Text style={styles.autoGenBtnText}>Auto-Generate</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <LockIcon size={16} color={colors.textLight} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter secure password"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? (
                    <EyeOffIcon size={16} color={colors.textMuted} />
                  ) : (
                    <EyeIcon size={16} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <PhoneIcon size={16} color={colors.textLight} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={colors.textLight}
                  value={mobNo}
                  onChangeText={setMobNo}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Date of Joining */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRowBetween}>
                <Text style={styles.inputLabel}>Date of Joining</Text>
                <TouchableOpacity
                  onPress={() => setDateOfJoin(new Date().toISOString().split('T')[0])}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.todayText}>Set Today</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <CalendarIcon size={16} color={colors.primary} />
                <TextInput
                  style={[styles.textInput, styles.fontMono]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textLight}
                  value={dateOfJoin}
                  onChangeText={setDateOfJoin}
                  maxLength={10}
                />
              </View>
              <Text style={styles.inputHelpText}>Format: YYYY-MM-DD (e.g. 2026-09-24)</Text>
            </View>

            {/* Hardware Fingerprint Device Verification Switch */}
            <View style={styles.deviceVerifBox}>
              <View style={styles.deviceVerifTextCol}>
                <View style={styles.deviceVerifHeaderRow}>
                  <LockIcon size={14} color={colors.primary} />
                  <Text style={styles.deviceVerifTitle}>
                    Require Hardware Fingerprint Device Verification on First Login
                  </Text>
                </View>
                <Text style={styles.deviceVerifSubtitle}>
                  When enabled, administrator must approve the user's PC or mobile hardware signature before they can login.
                </Text>
              </View>
              <Switch
                value={deviceVerificationRequired}
                onValueChange={setDeviceVerificationRequired}
                trackColor={{ false: '#e2e8f0', true: colors.primary }}
                thumbColor={deviceVerificationRequired ? '#ffffff' : '#f8fafc'}
                ios_backgroundColor="#e2e8f0"
              />
            </View>
          </View>

          {/* ── CARD 2: Role & Department Assignment ── */}
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: '#f5f3ff' }]}>
                <ShieldUserIcon size={18} color="#7c3aed" />
              </View>
              <View style={styles.cardHeaderTextBox}>
                <Text style={styles.cardHeaderTitle}>2. Role & Department Assignment</Text>
                <Text style={styles.cardHeaderSubtitle}>
                  Enterprise entity affiliation, permission level, and workgroup allocation
                </Text>
              </View>
              <View style={[styles.stepBadge, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
                <Text style={[styles.stepBadgeText, { color: '#7c3aed' }]}>STEP 2</Text>
              </View>
            </View>

            {/* 1. Primary Company Entity DROPDOWN (Requested by User) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Primary Company Entity <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => {
                  setCompanySearch('');
                  setCompanyModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownLeftCol}>
                  <BuildingOfficeIcon size={18} color="#2563eb" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownValueText} numberOfLines={1}>
                      {selectedCompanyObj
                        ? selectedCompanyObj.company_name
                        : '-- Select Company --'}
                    </Text>
                    {selectedCompanyObj?.is_main && (
                      <Text style={styles.dropdownSubBadge}>★ Primary Legal Entity</Text>
                    )}
                  </View>
                </View>
                <View style={styles.dropdownChevronBox}>
                  <ChevronDownIcon size={16} color="#64748b" />
                </View>
              </TouchableOpacity>
              <Text style={styles.inputHelpText}>
                The main enterprise organization this employee is legally affiliated with.
              </Text>
            </View>

            {/* 2. User Role / Security Profile DROPDOWN (Requested by User) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                User Role / Security Profile <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setRoleModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownLeftCol}>
                  <ShieldUserIcon size={18} color="#7c3aed" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownValueText} numberOfLines={1}>
                      {selectedTypeObj
                        ? selectedTypeObj.type_name
                        : '-- Select Role --'}
                    </Text>
                    {selectedTypeObj?.is_vendor ? (
                      <Text style={[styles.dropdownSubBadge, { color: '#d97706' }]}>
                        Restricted Vendor Profile
                      </Text>
                    ) : (
                      <Text style={styles.dropdownSubBadge}>
                        {isRoleAdmin ? 'Administrative Privileges' : 'Standard Member Privileges'}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.dropdownChevronBox}>
                  <ChevronDownIcon size={16} color="#64748b" />
                </View>
              </TouchableOpacity>
              <Text style={styles.inputHelpText}>
                Controls administrative permissions and feature authorizations.
              </Text>
            </View>

            {/* Vendor Access Policy Strip */}
            <View style={styles.vendorPolicyBox}>
              {isVendor ? (
                <View style={styles.vendorAlertBox}>
                  <View style={styles.vendorAlertIconCircle}>
                    <ShieldCheckIcon size={18} color="#b45309" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.vendorAlertTitleRow}>
                      <Text style={styles.vendorAlertTitle}>External Vendor / Partner Account</Text>
                      <View style={styles.vendorRestrictedPill}>
                        <Text style={styles.vendorRestrictedPillText}>RESTRICTED ISOLATION</Text>
                      </View>
                    </View>
                    <Text style={styles.vendorAlertDesc}>
                      Vendors can safely receive messages and chat with authorized staff members who reach out to them. By corporate security policy, external vendors cannot initiate new conversations or communicate with other external vendors.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.vendorToggleCard}>
                  <View style={styles.vendorToggleTextCol}>
                    <View style={styles.vendorToggleHeaderRow}>
                      <UsersIcon size={16} color="#7c3aed" />
                      <Text style={styles.vendorToggleTitle}>
                        Allow Direct Chat with External Vendors
                      </Text>
                    </View>
                    <Text style={styles.vendorToggleDesc}>
                      Grant this employee explicit permission to initiate 1-to-1 conversations with external vendors and add vendors to group workgroups.
                    </Text>
                  </View>
                  <Switch
                    value={canChatWithVendors}
                    onValueChange={setCanChatWithVendors}
                    trackColor={{ false: '#e2e8f0', true: '#7c3aed' }}
                    thumbColor={canChatWithVendors ? '#ffffff' : '#f8fafc'}
                    ios_backgroundColor="#e2e8f0"
                  />
                </View>
              )}
            </View>

            {/* Department Workgroup Scope */}
            <View style={styles.deptScopeSection}>
              <View style={styles.deptScopeHeaderRow}>
                <View>
                  <Text style={styles.inputLabel}>
                    Department Workgroup Scope <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <Text style={styles.inputHelpText}>
                    {isRoleAdmin
                      ? 'Admins require multiple department supervisory authorizations'
                      : 'Choose between single primary home department or multi-workgroup'}
                  </Text>
                </View>

                {/* Mode Selector (Single vs Multi) */}
                {!isRoleAdmin && (
                  <View style={styles.modeTabsRow}>
                    <TouchableOpacity
                      style={[
                        styles.modeTabBtn,
                        deptAssignmentMode === 'SINGLE' && styles.modeTabBtnActive,
                      ]}
                      onPress={() => setDeptAssignmentMode('SINGLE')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.modeTabBtnText,
                          deptAssignmentMode === 'SINGLE' && styles.modeTabBtnTextActive,
                        ]}
                      >
                        Single
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modeTabBtn,
                        deptAssignmentMode === 'MULTIPLE' && styles.modeTabBtnActive,
                      ]}
                      onPress={() => setDeptAssignmentMode('MULTIPLE')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.modeTabBtnText,
                          deptAssignmentMode === 'MULTIPLE' && styles.modeTabBtnTextActive,
                        ]}
                      >
                        Multiple
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* SINGLE MODE: Dropdown for Primary Department */}
              {deptAssignmentMode === 'SINGLE' && !isRoleAdmin ? (
                <View style={{ marginTop: spacing.sm }}>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => {
                      setSingleDeptSearch('');
                      setSingleDeptModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownLeftCol}>
                      <BuildingIcon size={18} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dropdownValueText} numberOfLines={1}>
                          {selectedSingleDeptObj
                            ? selectedSingleDeptObj.department_name
                            : '-- Select Department --'}
                        </Text>
                        <Text style={styles.dropdownSubBadge}>Primary Home Department</Text>
                      </View>
                    </View>
                    <View style={styles.dropdownChevronBox}>
                      <ChevronDownIcon size={16} color="#64748b" />
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                /* MULTIPLE MODE: Search bar & Checkbox List */
                <View style={{ marginTop: spacing.sm }}>
                  {/* Search and Action Bar */}
                  <View style={styles.deptSearchAndActionRow}>
                    <View style={styles.deptSearchInputWrap}>
                      <SearchIcon size={14} color="#94a3b8" />
                      <TextInput
                        style={styles.deptSearchInput}
                        placeholder="Filter departments..."
                        placeholderTextColor="#94a3b8"
                        value={deptSearchQuery}
                        onChangeText={setDeptSearchQuery}
                      />
                      {deptSearchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setDeptSearchQuery('')}>
                          <CloseIcon size={14} color="#94a3b8" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.quickActionGroup}>
                      <TouchableOpacity onPress={selectAllAssignDepts} style={styles.quickActionBtn}>
                        <Text style={styles.quickActionBtnText}>Select All</Text>
                      </TouchableOpacity>
                      <Text style={styles.quickActionDiv}>|</Text>
                      <TouchableOpacity onPress={clearAllAssignDepts} style={styles.quickActionBtn}>
                        <Text style={[styles.quickActionBtnText, { color: '#64748b' }]}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Multi-Dept Checkbox List */}
                  {searchedAssignDepts.length === 0 ? (
                    <View style={styles.emptyDeptsBox}>
                      <BuildingIcon size={16} color="#94a3b8" />
                      <Text style={styles.emptyDeptsText}>No matching departments found</Text>
                    </View>
                  ) : (
                    <View style={styles.departmentsGrid}>
                      {searchedAssignDepts.map((dept) => {
                        const isChecked = selectedMultiDepts.includes(dept.id);
                        return (
                          <TouchableOpacity
                            key={dept.id}
                            style={[
                              styles.deptCheckCard,
                              isChecked && styles.deptCheckCardActive,
                            ]}
                            onPress={() => toggleMultiDept(dept.id)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.checkboxBox,
                                isChecked && styles.checkboxBoxChecked,
                              ]}
                            >
                              {isChecked && <CheckIcon size={11} color="#ffffff" />}
                            </View>
                            <Text
                              style={[
                                styles.deptCheckCardText,
                                isChecked && styles.deptCheckCardTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {dept.department_name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                  <Text style={styles.deptSelectedCountText}>
                    ✓ {selectedMultiDepts.length} of {filteredDepartments.length} department(s) assigned
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── CARD 3: Inter-Department Chat Permissions ── */}
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: '#ecfdf5' }]}>
                <BuildingIcon size={18} color="#059669" />
              </View>
              <View style={styles.cardHeaderTextBox}>
                <Text style={styles.cardHeaderTitle}>3. Inter-Department Chat Permissions</Text>
                <Text style={styles.cardHeaderSubtitle}>
                  Cross-department messaging rules within the company
                </Text>
              </View>
              <View style={[styles.stepBadge, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                <Text style={[styles.stepBadgeText, { color: '#059669' }]}>STEP 3</Text>
              </View>
            </View>

            {/* 3 Scope Options */}
            <View style={styles.scopeCardsGrid}>
              {/* Option 1: Own Dept Only */}
              <TouchableOpacity
                style={[
                  styles.scopeOptionCard,
                  chatScopeMode === 'OWN' && styles.scopeOptionCardActiveBlue,
                ]}
                onPress={() => setChatScopeMode('OWN')}
                activeOpacity={0.7}
              >
                <View style={styles.scopeOptionHeader}>
                  <View style={[styles.scopeIconBox, { backgroundColor: '#dbeafe' }]}>
                    <BuildingIcon size={14} color="#1d4ed8" />
                  </View>
                  <View style={[styles.radioCircle, chatScopeMode === 'OWN' && styles.radioCircleActiveBlue]}>
                    {chatScopeMode === 'OWN' && <View style={[styles.radioInner, { backgroundColor: '#1d4ed8' }]} />}
                  </View>
                </View>
                <Text style={styles.scopeOptionTitle}>Own Dept Only</Text>
                <Text style={styles.scopeOptionDesc}>
                  Chats limited strictly within assigned department(s)
                </Text>
              </TouchableOpacity>

              {/* Option 2: All Departments */}
              <TouchableOpacity
                style={[
                  styles.scopeOptionCard,
                  chatScopeMode === 'ALL' && styles.scopeOptionCardActiveGreen,
                ]}
                onPress={() => setChatScopeMode('ALL')}
                activeOpacity={0.7}
              >
                <View style={styles.scopeOptionHeader}>
                  <View style={[styles.scopeIconBox, { backgroundColor: '#dcfce7' }]}>
                    <GlobeIcon size={14} color="#15803d" />
                  </View>
                  <View style={[styles.radioCircle, chatScopeMode === 'ALL' && styles.radioCircleActiveGreen]}>
                    {chatScopeMode === 'ALL' && <View style={[styles.radioInner, { backgroundColor: '#15803d' }]} />}
                  </View>
                </View>
                <Text style={styles.scopeOptionTitle}>All Departments</Text>
                <Text style={styles.scopeOptionDesc}>
                  Unrestricted messaging with any department across company
                </Text>
              </TouchableOpacity>

              {/* Option 3: Specific Depts */}
              <TouchableOpacity
                style={[
                  styles.scopeOptionCard,
                  chatScopeMode === 'CUSTOM' && styles.scopeOptionCardActivePurple,
                ]}
                onPress={() => setChatScopeMode('CUSTOM')}
                activeOpacity={0.7}
              >
                <View style={styles.scopeOptionHeader}>
                  <View style={[styles.scopeIconBox, { backgroundColor: '#f3e8ff' }]}>
                    <NetworkIcon size={14} color="#7e22ce" />
                  </View>
                  <View style={[styles.radioCircle, chatScopeMode === 'CUSTOM' && styles.radioCircleActivePurple]}>
                    {chatScopeMode === 'CUSTOM' && <View style={[styles.radioInner, { backgroundColor: '#7e22ce' }]} />}
                  </View>
                </View>
                <Text style={styles.scopeOptionTitle}>Specific Depts</Text>
                <Text style={styles.scopeOptionDesc}>
                  Permit chats only with chosen partner departments
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom allowed departments selection */}
            {chatScopeMode === 'CUSTOM' && (
              <View style={styles.customWhitelistContainer}>
                <View style={styles.customWhitelistHeader}>
                  <Text style={styles.customWhitelistTitle}>Allowed Chat Partner Departments:</Text>
                  <View style={styles.quickActionGroup}>
                    <TouchableOpacity onPress={selectAllChatDepts} style={styles.quickActionBtn}>
                      <Text style={[styles.quickActionBtnText, { color: '#7e22ce' }]}>Select All</Text>
                    </TouchableOpacity>
                    <Text style={styles.quickActionDiv}>|</Text>
                    <TouchableOpacity onPress={clearAllChatDepts} style={styles.quickActionBtn}>
                      <Text style={[styles.quickActionBtnText, { color: '#64748b' }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Filter input */}
                <View style={[styles.deptSearchInputWrap, { marginBottom: 8 }]}>
                  <SearchIcon size={14} color="#94a3b8" />
                  <TextInput
                    style={styles.deptSearchInput}
                    placeholder="Search allowed departments..."
                    placeholderTextColor="#94a3b8"
                    value={chatDeptSearchQuery}
                    onChangeText={setChatDeptSearchQuery}
                  />
                </View>

                {/* Checklist */}
                <View style={styles.departmentsGrid}>
                  {searchedChatDepts.map((d) => {
                    const isChecked = customChatDepts.includes(d.id);
                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={[
                          styles.deptCheckCard,
                          isChecked && styles.deptCheckCardActivePurple,
                        ]}
                        onPress={() => toggleCustomChatDept(d.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.checkboxBox,
                            isChecked && styles.checkboxBoxCheckedPurple,
                          ]}
                        >
                          {isChecked && <CheckIcon size={11} color="#ffffff" />}
                        </View>
                        <Text
                          style={[
                            styles.deptCheckCardText,
                            isChecked && { color: '#581c87', fontWeight: fontWeights.bold },
                          ]}
                          numberOfLines={1}
                        >
                          {d.department_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.deptSelectedCountText}>
                  ✓ {customChatDepts.length} allowed partner department(s) configured
                </Text>
              </View>
            )}
          </View>

          {/* ── CARD 4: Inter-Company Cross-Entity Access ── */}
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: '#fdf4ff' }]}>
                <GlobeIcon size={18} color="#a21caf" />
              </View>
              <View style={styles.cardHeaderTextBox}>
                <Text style={styles.cardHeaderTitle}>4. Inter-Company Cross-Entity Access</Text>
                <Text style={styles.cardHeaderSubtitle}>
                  Cross-organization messaging rules across enterprise subsidiaries
                </Text>
              </View>
              <View style={[styles.stepBadge, { backgroundColor: '#fdf4ff', borderColor: '#f5d0fe' }]}>
                <Text style={[styles.stepBadgeText, { color: '#a21caf' }]}>STEP 4</Text>
              </View>
            </View>

            {/* 3 Scope Options */}
            <View style={styles.scopeCardsGrid}>
              {/* Option 1: Disabled */}
              <TouchableOpacity
                style={[
                  styles.scopeOptionCard,
                  interCompanyMode === 'NONE' && styles.scopeOptionCardActiveBlue,
                ]}
                onPress={() => setInterCompanyMode('NONE')}
                activeOpacity={0.7}
              >
                <View style={styles.scopeOptionHeader}>
                  <View style={[styles.scopeIconBox, { backgroundColor: '#e2e8f0' }]}>
                    <LockIcon size={14} color="#475569" />
                  </View>
                  <View style={[styles.radioCircle, interCompanyMode === 'NONE' && styles.radioCircleActiveBlue]}>
                    {interCompanyMode === 'NONE' && <View style={[styles.radioInner, { backgroundColor: '#1d4ed8' }]} />}
                  </View>
                </View>
                <Text style={styles.scopeOptionTitle}>Disabled</Text>
                <Text style={styles.scopeOptionDesc}>
                  User can only communicate internally within home company
                </Text>
              </TouchableOpacity>

              {/* Option 2: All Entities */}
              <TouchableOpacity
                style={[
                  styles.scopeOptionCard,
                  interCompanyMode === 'ALL' && styles.scopeOptionCardActiveGreen,
                ]}
                onPress={() => setInterCompanyMode('ALL')}
                activeOpacity={0.7}
              >
                <View style={styles.scopeOptionHeader}>
                  <View style={[styles.scopeIconBox, { backgroundColor: '#dcfce7' }]}>
                    <GlobeIcon size={14} color="#15803d" />
                  </View>
                  <View style={[styles.radioCircle, interCompanyMode === 'ALL' && styles.radioCircleActiveGreen]}>
                    {interCompanyMode === 'ALL' && <View style={[styles.radioInner, { backgroundColor: '#15803d' }]} />}
                  </View>
                </View>
                <Text style={styles.scopeOptionTitle}>All Entities</Text>
                <Text style={styles.scopeOptionDesc}>
                  Unrestricted messaging across all partner companies
                </Text>
              </TouchableOpacity>

              {/* Option 3: Specific Entities */}
              <TouchableOpacity
                style={[
                  styles.scopeOptionCard,
                  interCompanyMode === 'CUSTOM' && styles.scopeOptionCardActivePurple,
                ]}
                onPress={() => setInterCompanyMode('CUSTOM')}
                activeOpacity={0.7}
              >
                <View style={styles.scopeOptionHeader}>
                  <View style={[styles.scopeIconBox, { backgroundColor: '#f3e8ff' }]}>
                    <NetworkIcon size={14} color="#7e22ce" />
                  </View>
                  <View style={[styles.radioCircle, interCompanyMode === 'CUSTOM' && styles.radioCircleActivePurple]}>
                    {interCompanyMode === 'CUSTOM' && <View style={[styles.radioInner, { backgroundColor: '#7e22ce' }]} />}
                  </View>
                </View>
                <Text style={styles.scopeOptionTitle}>Specific Entities</Text>
                <Text style={styles.scopeOptionDesc}>
                  Select authorized external corporate partners
                </Text>
              </TouchableOpacity>
            </View>

            {/* Specific Entities Settings */}
            {interCompanyMode === 'CUSTOM' && (
              <View style={styles.customWhitelistContainer}>
                {/* 1. Companies checklist */}
                <View style={{ marginBottom: 14 }}>
                  <View style={styles.customWhitelistHeader}>
                    <Text style={styles.customWhitelistTitle}>1. Allowed Partner Companies:</Text>
                    <View style={styles.quickActionGroup}>
                      <TouchableOpacity onPress={selectAllInterCompanies} style={styles.quickActionBtn}>
                        <Text style={[styles.quickActionBtnText, { color: '#7e22ce' }]}>Select All</Text>
                      </TouchableOpacity>
                      <Text style={styles.quickActionDiv}>|</Text>
                      <TouchableOpacity onPress={clearAllInterCompanies} style={styles.quickActionBtn}>
                        <Text style={[styles.quickActionBtnText, { color: '#64748b' }]}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.departmentsGrid}>
                    {companiesList.map((c) => {
                      const isCurrentPrimary = Number(c.id) === Number(selectedCompanyId);
                      const isChecked = selectedInterCompanies.includes(c.id);
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.deptCheckCard,
                            isChecked && styles.deptCheckCardActivePurple,
                          ]}
                          onPress={() => toggleInterCompany(c.id)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.checkboxBox,
                              isChecked && styles.checkboxBoxCheckedPurple,
                            ]}
                          >
                            {isChecked && <CheckIcon size={11} color="#ffffff" />}
                          </View>
                          <Text
                            style={[
                              styles.deptCheckCardText,
                              isChecked && { color: '#581c87', fontWeight: fontWeights.bold },
                            ]}
                            numberOfLines={1}
                          >
                            {c.company_name}
                          </Text>
                          {isCurrentPrimary && (
                            <View style={styles.homeBadge}>
                              <Text style={styles.homeBadgeText}>Home</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Department Access Scope within Partner Companies */}
                <View>
                  <Text style={[styles.customWhitelistTitle, { marginBottom: 8 }]}>
                    2. External Department Scope:
                  </Text>
                  <View style={styles.radioChoiceRow}>
                    <TouchableOpacity
                      style={[
                        styles.radioChoiceBtn,
                        interCompanyDeptScope === 'ALL' && styles.radioChoiceBtnActive,
                      ]}
                      onPress={() => setInterCompanyDeptScope('ALL')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircleSmall, interCompanyDeptScope === 'ALL' && styles.radioCircleSmallActive]}>
                        {interCompanyDeptScope === 'ALL' && <View style={styles.radioInnerSmall} />}
                      </View>
                      <Text style={styles.radioChoiceText}>All Departments</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.radioChoiceBtn,
                        interCompanyDeptScope === 'CUSTOM' && styles.radioChoiceBtnActive,
                      ]}
                      onPress={() => setInterCompanyDeptScope('CUSTOM')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircleSmall, interCompanyDeptScope === 'CUSTOM' && styles.radioCircleSmallActive]}>
                        {interCompanyDeptScope === 'CUSTOM' && <View style={styles.radioInnerSmall} />}
                      </View>
                      <Text style={styles.radioChoiceText}>Specific Departments</Text>
                    </TouchableOpacity>
                  </View>

                  {interCompanyDeptScope === 'CUSTOM' && (
                    <View style={{ marginTop: 10 }}>
                      <View style={styles.customWhitelistHeader}>
                        <Text style={styles.inputHelpText}>Select external departments allowed:</Text>
                        <View style={styles.quickActionGroup}>
                          <TouchableOpacity onPress={selectAllInterCompanyDepts} style={styles.quickActionBtn}>
                            <Text style={[styles.quickActionBtnText, { color: '#7e22ce' }]}>All</Text>
                          </TouchableOpacity>
                          <Text style={styles.quickActionDiv}>|</Text>
                          <TouchableOpacity onPress={clearAllInterCompanyDepts} style={styles.quickActionBtn}>
                            <Text style={[styles.quickActionBtnText, { color: '#64748b' }]}>Clear</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.departmentsGrid}>
                        {departmentsList.map((d) => {
                          const isChecked = selectedInterCompanyDepts.includes(d.id);
                          return (
                            <TouchableOpacity
                              key={d.id}
                              style={[
                                styles.deptCheckCard,
                                isChecked && styles.deptCheckCardActivePurple,
                              ]}
                              onPress={() => toggleInterCompanyDept(d.id)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.checkboxBox,
                                  isChecked && styles.checkboxBoxCheckedPurple,
                                ]}
                              >
                                {isChecked && <CheckIcon size={11} color="#ffffff" />}
                              </View>
                              <Text
                                style={[
                                  styles.deptCheckCardText,
                                  isChecked && { color: '#581c87', fontWeight: fontWeights.bold },
                                ]}
                                numberOfLines={1}
                              >
                                {d.department_name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* ── STICKY/BOTTOM SUMMARY BAR ── */}
          <View style={[styles.summaryCard, shadows.md]}>
            <View style={styles.summaryAvatarCircle}>
              <Text style={styles.summaryAvatarText}>
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.summaryNameRow}>
                <Text style={styles.summaryNameText} numberOfLines={1}>
                  {name || 'New Employee Account'}
                </Text>
                {username ? (
                  <Text style={styles.summaryUsernameText} numberOfLines={1}>
                    @{username}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.summaryMetaText} numberOfLines={1}>
                🏢 {selectedCompanyObj?.company_name || 'Company'} • 🛡️ {selectedTypeObj?.type_name || 'Role'} •{' '}
                <Text style={{ color: '#4f46e5', fontWeight: fontWeights.bold }}>
                  🏬 {deptAssignmentMode === 'SINGLE' && !isRoleAdmin ? '1 Dept' : `${selectedMultiDepts.length} Depts Assigned`}
                </Text>
              </Text>
            </View>
          </View>

          {/* ── ACTION BUTTONS ── */}
          <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={[styles.createAccountBtn, submitting && { opacity: 0.7 }]}
              onPress={handleCreateUser}
              disabled={submitting}
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
                  <LinearGradient id="createUserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                    <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="100" fill="url(#createUserGrad)" />
              </Svg>

              <View style={styles.createAccountBtnInner}>
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.createAccountBtnText}>Creating Account...</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.submitIconCircle}>
                      <PlusIcon size={14} color={colors.primary} />
                    </View>
                    <Text style={styles.createAccountBtnText}>Create User Account</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL 1: COMPANY ENTITY DROPDOWN PICKER
      ════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={companyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCompanyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setCompanyModalVisible(false)}
          />
          <View style={styles.bottomSheetContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalHeaderIconBox}>
                  <BuildingOfficeIcon size={18} color="#2563eb" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Select Company Entity</Text>
                  <Text style={styles.modalSubtitle}>Affiliated enterprise organization</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setCompanyModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search Input if companies > 3 */}
            {companiesList.length > 3 && (
              <View style={styles.modalSearchBox}>
                <SearchIcon size={16} color="#94a3b8" />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search companies..."
                  placeholderTextColor="#94a3b8"
                  value={companySearch}
                  onChangeText={setCompanySearch}
                />
              </View>
            )}

            {/* List */}
            <FlatList
              data={searchedCompanies}
              keyExtractor={(item) => String(item.id)}
              style={styles.modalList}
              renderItem={({ item }) => {
                const isSelected = Number(selectedCompanyId) === Number(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOptionItem,
                      isSelected && styles.modalOptionItemActive,
                    ]}
                    onPress={() => {
                      setSelectedCompanyId(item.id);
                      setCompanyModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalRadioCircle, isSelected && styles.modalRadioCircleActive]}>
                      {isSelected && <View style={styles.modalRadioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalOptionTitle, isSelected && styles.modalOptionTitleActive]}>
                        {item.company_name}
                      </Text>
                      {item.address ? (
                        <Text style={styles.modalOptionSub} numberOfLines={1}>
                          📍 {item.address}
                        </Text>
                      ) : null}
                    </View>
                    {item.is_main ? (
                      <View style={styles.hqBadge}>
                        <Text style={styles.hqBadgeText}>Primary Entity</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />

            {/* Modal Done */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setCompanyModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
          MODAL 2: USER ROLE / SECURITY PROFILE DROPDOWN PICKER
      ════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setRoleModalVisible(false)}
          />
          <View style={styles.bottomSheetContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={[styles.modalHeaderIconBox, { backgroundColor: '#f5f3ff' }]}>
                  <ShieldUserIcon size={18} color="#7c3aed" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Select User Role Profile</Text>
                  <Text style={styles.modalSubtitle}>Authorization level & features</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setRoleModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
              data={userTypes}
              keyExtractor={(item) => String(item.id)}
              style={styles.modalList}
              renderItem={({ item }) => {
                const isSelected = String(userTypeId) === String(item.id);
                const isVendorRole = Boolean(item.is_vendor) || (item.type_name || '').toLowerCase().includes('vendor');
                const isAdminRole = (item.type_name || '').toLowerCase().includes('admin');
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOptionItem,
                      isSelected && styles.modalOptionItemActivePurple,
                    ]}
                    onPress={() => handleRoleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalRadioCircle, isSelected && styles.modalRadioCircleActivePurple]}>
                      {isSelected && <View style={[styles.modalRadioInner, { backgroundColor: '#7c3aed' }]} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalOptionTitle, isSelected && { color: '#6d28d9', fontWeight: fontWeights.bold }]}>
                        {item.type_name}
                      </Text>
                      {item.description ? (
                        <Text style={styles.modalOptionSub} numberOfLines={1}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    {isVendorRole ? (
                      <View style={[styles.hqBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                        <Text style={[styles.hqBadgeText, { color: '#b45309' }]}>Vendor Account</Text>
                      </View>
                    ) : isAdminRole ? (
                      <View style={[styles.hqBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                        <Text style={[styles.hqBadgeText, { color: '#1d4ed8' }]}>Admin Access</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[styles.modalDoneBtn, { backgroundColor: '#7c3aed' }]}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
          MODAL 3: SINGLE PRIMARY DEPARTMENT PICKER
      ════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={singleDeptModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSingleDeptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setSingleDeptModalVisible(false)}
          />
          <View style={styles.bottomSheetContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalHeaderIconBox}>
                  <BuildingIcon size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Select Primary Department</Text>
                  <Text style={styles.modalSubtitle}>Assigned home department</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSingleDeptModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchBox}>
              <SearchIcon size={16} color="#94a3b8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search departments..."
                placeholderTextColor="#94a3b8"
                value={singleDeptSearch}
                onChangeText={setSingleDeptSearch}
              />
            </View>

            {/* List */}
            <FlatList
              data={searchedSingleDepts}
              keyExtractor={(item) => String(item.id)}
              style={styles.modalList}
              renderItem={({ item }) => {
                const isSelected = Number(selectedSingleDept) === Number(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOptionItem,
                      isSelected && styles.modalOptionItemActive,
                    ]}
                    onPress={() => {
                      setSelectedSingleDept(item.id);
                      setSingleDeptModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalRadioCircle, isSelected && styles.modalRadioCircleActive]}>
                      {isSelected && <View style={styles.modalRadioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalOptionTitle, isSelected && styles.modalOptionTitleActive]}>
                        {item.department_name}
                      </Text>
                      {item.company_name ? (
                        <Text style={styles.modalOptionSub}>🏢 {item.company_name}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setSingleDeptModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
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
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontWeight: fontWeights.medium,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  headerBanner: {
    marginBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
    gap: 6,
  },
  headerTagPill: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  headerTagText: {
    fontSize: 10,
    fontWeight: fontWeights.black,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  headerCountPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countPillText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  countPillDot: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  headerBannerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerBannerSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardHeaderTextBox: {
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
  },
  cardHeaderSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  stepBadge: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  stepBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.black,
    color: colors.primary,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  requiredAsterisk: {
    color: '#ef4444',
  },
  labelRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  autoGenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoGenBtnText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  todayText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
    marginLeft: spacing.xs,
  },
  fontMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: fontWeights.semibold,
  },
  atSymbol: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  inputPrefixIcon: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  inputHelpText: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
    marginLeft: 2,
  },
  deviceVerifBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    marginTop: 4,
  },
  deviceVerifTextCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  deviceVerifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  deviceVerifTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  deviceVerifSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },

  /* ── DROPDOWN TRIGGER BUTTONS ── */
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 10,
    minHeight: 48,
  },
  dropdownLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownValueText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  dropdownSubBadge: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    color: '#2563eb',
    marginTop: 1,
  },
  dropdownChevronBox: {
    marginLeft: 8,
    padding: 2,
  },

  /* ── VENDOR POLICY BOX ── */
  vendorPolicyBox: {
    marginBottom: spacing.md,
  },
  vendorAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  vendorAlertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  vendorAlertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  vendorAlertTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.black,
    color: '#78350f',
  },
  vendorRestrictedPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  vendorRestrictedPillText: {
    fontSize: 8,
    fontWeight: fontWeights.black,
    color: '#b45309',
  },
  vendorAlertDesc: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16,
    marginTop: 3,
  },
  vendorToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  vendorToggleTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  vendorToggleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  vendorToggleTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#581c87',
  },
  vendorToggleDesc: {
    fontSize: 11,
    color: '#7e22ce',
    lineHeight: 15,
  },

  /* ── DEPARTMENT WORKGROUP SCOPE ── */
  deptScopeSection: {
    marginTop: 4,
  },
  deptScopeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  modeTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modeTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  modeTabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabBtnText: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
  },
  modeTabBtnTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.black,
  },
  deptSearchAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  deptSearchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 36,
  },
  deptSearchInput: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  quickActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionBtn: {
    paddingVertical: 2,
  },
  quickActionBtnText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  quickActionDiv: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  emptyDeptsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyDeptsText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  departmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptCheckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    maxWidth: '100%',
  },
  deptCheckCardActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryMuted,
  },
  deptCheckCardActivePurple: {
    backgroundColor: '#f5f3ff',
    borderColor: '#c4b5fd',
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxBoxCheckedPurple: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  deptCheckCardText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  deptCheckCardTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  deptSelectedCountText: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginTop: 6,
    marginLeft: 2,
  },

  /* ── SCOPE OPTIONS (STEPS 3 & 4) ── */
  scopeCardsGrid: {
    gap: 8,
  },
  scopeOptionCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
  },
  scopeOptionCardActiveBlue: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  scopeOptionCardActiveGreen: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  scopeOptionCardActivePurple: {
    borderColor: '#9333ea',
    backgroundColor: '#faf5ff',
  },
  scopeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scopeIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActiveBlue: {
    borderColor: '#2563eb',
  },
  radioCircleActiveGreen: {
    borderColor: '#16a34a',
  },
  radioCircleActivePurple: {
    borderColor: '#9333ea',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scopeOptionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  scopeOptionDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    marginTop: 2,
  },
  customWhitelistContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  customWhitelistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customWhitelistTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  homeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  homeBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: '#1d4ed8',
  },
  radioChoiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radioChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  radioChoiceBtnActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#c4b5fd',
  },
  radioCircleSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSmallActive: {
    borderColor: '#7c3aed',
  },
  radioInnerSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7c3aed',
  },
  radioChoiceText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },

  /* ── SUMMARY BOTTOM CARD ── */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: spacing.sm,
  },
  summaryAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryAvatarText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  summaryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  summaryNameText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#0f172a',
  },
  summaryUsernameText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textMuted,
  },
  summaryMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* ── ACTIONS ── */
  actionButtonsCol: {
    gap: 10,
  },
  createAccountBtn: {
    height: 48,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  createAccountBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: '100%',
  },
  submitIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountBtnText: {
    color: '#ffffff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },

  /* ── MODAL / BOTTOM SHEET STYLES ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
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
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: spacing.sm,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  modalList: {
    maxHeight: 320,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 6,
    backgroundColor: '#f8fafc',
  },
  modalOptionItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  modalOptionItemActivePurple: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  modalRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRadioCircleActive: {
    borderColor: '#2563eb',
  },
  modalRadioCircleActivePurple: {
    borderColor: '#7c3aed',
  },
  modalRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2563eb',
  },
  modalOptionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  modalOptionTitleActive: {
    color: '#1d4ed8',
    fontWeight: fontWeights.bold,
  },
  modalOptionSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  hqBadge: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  hqBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: '#1e40af',
  },
  modalDoneBtn: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
});
