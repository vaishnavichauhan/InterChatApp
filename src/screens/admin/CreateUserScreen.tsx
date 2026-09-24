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
  EyeIcon,
  EyeOffIcon,
  RefreshIcon,
  PlusIcon,
  CheckIcon,
} from '../../components/icons/SvgIcons';
import { createUserByAdmin, getUserTypes } from '../../api/adminApi';
import { getDepartments } from '../../api/departmentApi';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';

interface CreateUserScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateUser'>;
}

export const CreateUserScreen: React.FC<CreateUserScreenProps> = ({ navigation }) => {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // User Types & Departments
  const [userTypes, setUserTypes] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameCustomized, setIsUsernameCustomized] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [mobNo, setMobNo] = useState('');
  // Date of Joining - default to current date formatted as YYYY-MM-DD
  const [dateOfJoin, setDateOfJoin] = useState(new Date().toISOString().split('T')[0]);
  // Require Device Verification on First Login - default false
  const [deviceVerificationRequired, setDeviceVerificationRequired] = useState(false);

  // User Role & Department assignment
  const [userTypeId, setUserTypeId] = useState<string>('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [deptRole, setDeptRole] = useState<'USER' | 'ADMIN'>('USER');
  const [selectedSingleDept, setSelectedSingleDept] = useState<number | null>(null);
  const [selectedMultiDepts, setSelectedMultiDepts] = useState<number[]>([]);

  useEffect(() => {
    loadFormDependencies();
  }, []);

  const loadFormDependencies = async () => {
    setLoadingOptions(true);
    try {
      const [typesRes, deptsRes] = await Promise.all([
        getUserTypes().catch(() => ({ data: [] })),
        getDepartments(false).catch(() => ({ departments: [] })),
      ]);

      const tList = typesRes.data?.data || typesRes.data || [];
      const validTypes = Array.isArray(tList) ? tList : [];
      setUserTypes(validTypes);

      if (validTypes.length > 0) {
        const defaultType =
          validTypes.find(
            (t) =>
              t.type_name?.toLowerCase().includes('specialist') ||
              t.type_name?.toLowerCase().includes('member') ||
              t.type_name?.toLowerCase().includes('staff')
          ) || validTypes[0];

        setUserTypeId(String(defaultType.id));
        const isSuper =
          defaultType.type_name?.toLowerCase().includes('super admin') || defaultType.id === 1;
        setRole(isSuper ? 'admin' : 'user');
      }

      const dList =
        deptsRes?.departments ||
        deptsRes?.data ||
        (Array.isArray(deptsRes) ? deptsRes : []);
      const validDepts = Array.isArray(dList) ? dList : [];
      setDepartmentsList(validDepts);

      if (validDepts.length > 0) {
        setSelectedSingleDept(validDepts[0].id);
        setSelectedMultiDepts([validDepts[0].id]);
      }
    } catch (err) {
      console.error('Failed to load user dependencies:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Auto-generate username from name if not manually modified
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

    setUserTypeId(typeId);
    setRole(isSuper ? 'admin' : 'user');

    if (isSuper || isDeptAdm) {
      setDeptRole('ADMIN');
      if (isSuper && departmentsList.length > 0) {
        setSelectedMultiDepts(departmentsList.map((d) => d.id));
      }
    } else {
      setDeptRole('USER');
    }
  };

  // Toggle department for admin roles
  const toggleMultiDept = (id: number) => {
    setSelectedMultiDepts((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          Alert.alert('Required', 'At least one authorized department must remain selected.');
          return prev;
        }
        return prev.filter((d) => d !== id);
      }
      return [...prev, id];
    });
  };

  const selectAllDepartments = () => {
    setSelectedMultiDepts(departmentsList.map((d) => d.id));
  };

  const clearDepartments = () => {
    if (departmentsList.length > 0) {
      setSelectedMultiDepts([departmentsList[0].id]);
    }
  };

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

    // Build department payload
    let departmentsPayload: any[] = [];
    if (deptRole === 'ADMIN' || role === 'admin') {
      if (selectedMultiDepts.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one department scope.');
        return;
      }
      departmentsPayload = selectedMultiDepts.map((id) => ({
        departmentId: Number(id),
        role: 'ADMIN',
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

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        userTypeId: userTypeId ? Number(userTypeId) : null,
        mobNo: mobNo.trim() || null,
        dateOfJoin: dateOfJoin.trim() || null,
        deviceVerificationRequired,
        role,
        departments: departmentsPayload,
      };

      const res = await createUserByAdmin(payload);
      if (res.data?.success || res.status === 201 || res.status === 200) {
        Alert.alert(
          'Success',
          `User account "${name}" has been created successfully!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
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

  const isMultiDeptMode = deptRole === 'ADMIN' || role === 'admin';

  return (
    <View style={styles.container}>
      <AppHeader
        title="Create User Account"
        showBack
        onBack={() => navigation.goBack()}
      />

      {loadingOptions ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading role profiles & departments...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Subtitle Banner ── */}
          <View style={styles.headerBanner}>
            <View style={styles.headerTagRow}>
              <View style={styles.headerTagPill}>
                <Text style={styles.headerTagText}>EMPLOYEE ONBOARDING</Text>
              </View>
            </View>
            <Text style={styles.headerBannerTitle}>Provision Access Credentials</Text>
            <Text style={styles.headerBannerSub}>
              Setup user profile, device security enforcement, and department boundaries.
            </Text>
          </View>

          {/* ── SECTION 1: Account Identity & Credentials ── */}
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIconBox}>
                <UserIcon size={18} color="#0056cf" />
              </View>
              <View style={styles.cardHeaderTextBox}>
                <Text style={styles.cardHeaderTitle}>1. Account Identity & Credentials</Text>
                <Text style={styles.cardHeaderSubtitle}>
                  Employee personal info, login key, and joining details
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
                  <RefreshIcon size={12} color="#0056cf" />
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
                  placeholder="e.g. +1 555-0199"
                  placeholderTextColor={colors.textLight}
                  value={mobNo}
                  onChangeText={setMobNo}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Date of Joining (Requested) */}
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
                <CalendarIcon size={16} color="#0056cf" />
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

            {/* Require Device Verification on First Login (Requested) */}
            <View style={styles.deviceVerifBox}>
              <View style={styles.deviceVerifTextCol}>
                <View style={styles.deviceVerifHeaderRow}>
                  <LockIcon size={14} color="#0056cf" />
                  <Text style={styles.deviceVerifTitle}>
                    Require Device Verification on First Login
                  </Text>
                </View>
                <Text style={styles.deviceVerifSubtitle}>
                  When enabled, administrator must approve the user's PC or mobile hardware signature before they can login.
                </Text>
              </View>
              <Switch
                value={deviceVerificationRequired}
                onValueChange={setDeviceVerificationRequired}
                trackColor={{ false: '#e2e8f0', true: '#0056cf' }}
                thumbColor={deviceVerificationRequired ? '#ffffff' : '#f8fafc'}
                ios_backgroundColor="#e2e8f0"
              />
            </View>
          </View>

          {/* ── SECTION 2: Role & Department Assignment ── */}
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: '#f5f3ff' }]}>
                <ShieldUserIcon size={18} color="#7c3aed" />
              </View>
              <View style={styles.cardHeaderTextBox}>
                <Text style={styles.cardHeaderTitle}>2. Role & Department Assignment</Text>
                <Text style={styles.cardHeaderSubtitle}>
                  Assign permission profile and authorized department scope
                </Text>
              </View>
              <View style={[styles.stepBadge, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
                <Text style={[styles.stepBadgeText, { color: '#7c3aed' }]}>STEP 2</Text>
              </View>
            </View>

            {/* User Role Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                User Role <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.rolesGrid}>
                {userTypes.map((type) => {
                  const isSelected = String(type.id) === String(userTypeId);
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.roleSelectChip, isSelected && styles.roleSelectChipActive]}
                      onPress={() => handleRoleSelect(type)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.roleRadioCircle, isSelected && styles.roleRadioCircleActive]}>
                        {isSelected && <View style={styles.roleRadioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.roleChipText,
                            isSelected && styles.roleChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {type.type_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Department Assignment */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRowBetween}>
                <Text style={styles.inputLabel}>
                  {isMultiDeptMode
                    ? 'Authorized Department Scope (Admin)'
                    : 'Assigned Department'}
                  <Text style={styles.requiredAsterisk}> *</Text>
                </Text>
                {isMultiDeptMode && (
                  <View style={styles.multiActionRow}>
                    <TouchableOpacity onPress={selectAllDepartments} style={styles.quickActionLink}>
                      <Text style={styles.quickActionText}>Select All</Text>
                    </TouchableOpacity>
                    <Text style={styles.quickActionDivider}>•</Text>
                    <TouchableOpacity onPress={clearDepartments} style={styles.quickActionLink}>
                      <Text style={styles.quickActionText}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {departmentsList.length === 0 ? (
                <View style={styles.noDeptsBox}>
                  <BuildingIcon size={16} color={colors.textLight} />
                  <Text style={styles.noDeptsText}>No active departments found</Text>
                </View>
              ) : isMultiDeptMode ? (
                /* Multi Department Checkboxes */
                <View style={styles.departmentsGrid}>
                  {departmentsList.map((dept) => {
                    const isChecked = selectedMultiDepts.includes(dept.id);
                    return (
                      <TouchableOpacity
                        key={dept.id}
                        style={[
                          styles.deptCheckChip,
                          isChecked && styles.deptCheckChipChecked,
                        ]}
                        onPress={() => toggleMultiDept(dept.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.deptCheckbox,
                            isChecked && styles.deptCheckboxChecked,
                          ]}
                        >
                          {isChecked && <CheckIcon size={10} color="#ffffff" />}
                        </View>
                        <Text
                          style={[
                            styles.deptChipText,
                            isChecked && styles.deptChipTextChecked,
                          ]}
                          numberOfLines={1}
                        >
                          {dept.department_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                /* Single Department Selector */
                <View style={styles.departmentsGrid}>
                  {departmentsList.map((dept) => {
                    const isSelected = selectedSingleDept === dept.id;
                    return (
                      <TouchableOpacity
                        key={dept.id}
                        style={[
                          styles.deptCheckChip,
                          isSelected && styles.deptCheckChipChecked,
                        ]}
                        onPress={() => setSelectedSingleDept(dept.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.roleRadioCircle,
                            isSelected && styles.roleRadioCircleActive,
                          ]}
                        >
                          {isSelected && <View style={styles.roleRadioInner} />}
                        </View>
                        <Text
                          style={[
                            styles.deptChipText,
                            isSelected && styles.deptChipTextChecked,
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
            </View>
          </View>

          {/* ── SUBMIT BUTTON (WITH LINEAR GRADIENT) ── */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && { opacity: 0.7 }]}
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
                  <LinearGradient id="submitUserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#0056cf" />
                    <Stop offset="100%" stopColor="#4f46e5" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="100" fill="url(#submitUserGrad)" />
              </Svg>

              <View style={styles.submitButtonInner}>
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.submitButtonText}>Provisioning Account...</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.submitIconCircle}>
                      <PlusIcon size={14} color="#0056cf" />
                    </View>
                    <Text style={styles.submitButtonText}>Create User Account</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel & Return to User Master</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
    marginBottom: spacing.xs,
  },
  headerTagPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  headerTagText: {
    fontSize: 10,
    fontWeight: fontWeights.black,
    color: '#0056cf',
    letterSpacing: 0.5,
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
    backgroundColor: '#eff6ff',
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
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  stepBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.black,
    color: '#0056cf',
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
    color: '#0056cf',
  },
  todayText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#0056cf',
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
  rolesGrid: {
    gap: 8,
  },
  roleSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  roleSelectChipActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#c4b5fd',
  },
  roleRadioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  roleRadioCircleActive: {
    borderColor: '#7c3aed',
  },
  roleRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
  },
  roleChipText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  roleChipTextActive: {
    color: '#6d28d9',
    fontWeight: fontWeights.bold,
  },
  multiActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionLink: {
    paddingVertical: 2,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#0056cf',
  },
  quickActionDivider: {
    fontSize: 10,
    color: colors.textLight,
  },
  departmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptCheckChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  deptCheckChipChecked: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  deptCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  deptCheckboxChecked: {
    backgroundColor: '#0056cf',
    borderColor: '#0056cf',
  },
  deptChipText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  deptChipTextChecked: {
    color: '#0056cf',
    fontWeight: fontWeights.bold,
  },
  noDeptsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noDeptsText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  submitContainer: {
    marginTop: spacing.sm,
    gap: 10,
  },
  submitButton: {
    height: 48,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  submitButtonInner: {
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
  submitButtonText: {
    color: '#ffffff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  cancelButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
});
