import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { pick, types } from '@react-native-documents/picker';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/common/AppHeader';
import {
  FileSpreadsheetIcon,
  DownloadIcon,
  UploadCloudIcon,
  CheckIcon,
  XMarkIcon,
  SearchIcon,
  TrashIcon,
  AlertCircleIcon,
  UsersIcon,
  BuildingIcon,
  CityIcon,
  ChevronDownIcon,
  InfoIcon,
} from '../../components/icons/SvgIcons';
import { bulkImportUsers, getUserTypes } from '../../api/adminApi';
import { getCompanies, Company } from '../../api/companyApi';
import { getDepartments, Department } from '../../api/departmentApi';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';

interface BulkUserImportScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BulkUserImport'>;
}

interface ParsedUserRow {
  id: string;
  rowNumber: number;
  name: string;
  email: string;
  username: string;
  password: string;
  mobile: string;
  company: string;
  departments: string;
  deptRole: 'ADMIN' | 'USER';
  userType: string;
  role: 'admin' | 'user';
  isVendor: boolean;
  canChatWithVendors: boolean;
  deviceVerificationRequired: boolean;
  dateOfJoin: string;
  errors: string[];
  warnings: string[];
  status: 'READY' | 'WARNING' | 'ERROR';
}

export const BulkUserImportScreen: React.FC<BulkUserImportScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  // System Metadata for validation and template guide
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [userTypesList, setUserTypesList] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Uploaded File & Parsed Rows
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'WARNING' | 'ERROR'>('ALL');

  // Import Options (Defaults)
  const skipDuplicates = true;
  const defaultPassword = 'Password123!';
  const mustChangePassword = true;
  const deviceVerificationRequired = false;

  // Processing & Results
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    summary?: { total: number; created: number; skipped: number };
    createdUsers?: any[];
    skippedUsers?: Array<{ row: number; name: string; email: string; reason: string }>;
    message?: string;
  } | null>(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Load system metadata for validation and template guide
  const fetchMetadata = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [compRes, deptRes, typeRes] = await Promise.allSettled([
        getCompanies(false),
        getDepartments(false),
        getUserTypes(),
      ]);

      if (compRes.status === 'fulfilled') {
        const cData = compRes.value?.companies || compRes.value?.data || (Array.isArray(compRes.value) ? compRes.value : []);
        setCompaniesList(Array.isArray(cData) ? cData : []);
      }
      if (deptRes.status === 'fulfilled') {
        const dData = deptRes.value?.departments || deptRes.value?.data || (Array.isArray(deptRes.value) ? deptRes.value : []);
        setDepartmentsList(Array.isArray(dData) ? dData : []);
      }
      if (typeRes.status === 'fulfilled') {
        const tData = typeRes.value?.data?.data || typeRes.value?.data?.userTypes || typeRes.value?.data || [];
        setUserTypesList(Array.isArray(tData) ? tData : []);
      }
    } catch (err) {
      console.warn('Failed to load metadata for bulk import:', err);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Download Sample Excel Template
  // ─────────────────────────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      // Sheet 1: Sample Employees
      const sampleData = [
        {
          'Full Name*': 'Rajesh Patel',
          'Username': 'rajesh.patel',
          'Email*': 'rajesh.patel@example.com',
          'Password': '',
          'Mobile Number': '+91 9876543210',
          'Company': companiesList[0]?.company_name || 'Epoxy House',
          'Departments': departmentsList[0]?.department_name || 'Sales, Marketing',
          'Department Role': 'USER',
          'User Type': 'Standard User',
          'Role': 'user',
          'Is Vendor': 'No',
          'Can Chat With Vendors': 'Yes',
          'Device Verification Required': 'Yes',
          'Date of Joining': '2026-01-15',
        },
        {
          'Full Name*': 'Anita Sharma',
          'Username': 'anita.sharma',
          'Email*': 'anita.sharma@example.com',
          'Password': '',
          'Mobile Number': '+91 9876543211',
          'Company': companiesList[0]?.company_name || 'Epoxy House',
          'Departments': departmentsList[1]?.department_name || 'Operations',
          'Department Role': 'ADMIN',
          'User Type': 'Standard User',
          'Role': 'user',
          'Is Vendor': 'No',
          'Can Chat With Vendors': 'No',
          'Device Verification Required': 'Yes',
          'Date of Joining': '2026-02-01',
        },
        {
          'Full Name*': 'Vikram Malhotra',
          'Username': 'vikram.vendor',
          'Email*': 'vikram@resinsupplier.com',
          'Password': '',
          'Mobile Number': '+91 9876543212',
          'Company': companiesList[0]?.company_name || 'Epoxy House',
          'Departments': departmentsList[0]?.department_name || 'Procurement',
          'Department Role': 'USER',
          'User Type': 'Vendor / External Partner',
          'Role': 'user',
          'Is Vendor': 'Yes',
          'Can Chat With Vendors': 'No',
          'Device Verification Required': 'Yes',
          'Date of Joining': '2026-03-01',
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(sampleData);
      ws1['!cols'] = [
        { wch: 22 }, // Full Name*
        { wch: 18 }, // Username
        { wch: 28 }, // Email*
        { wch: 16 }, // Password
        { wch: 18 }, // Mobile Number
        { wch: 20 }, // Company
        { wch: 26 }, // Departments
        { wch: 18 }, // Department Role
        { wch: 26 }, // User Type
        { wch: 12 }, // Role
        { wch: 12 }, // Is Vendor
        { wch: 22 }, // Can Chat With Vendors
        { wch: 26 }, // Device Verification Required
        { wch: 16 }, // Date of Joining
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Employees_Template');

      // Sheet 2: Field Instructions & Active System Masters
      const instructionRows = [
        ['FIELD GUIDE & INSTRUCTIONS FOR BULK EMPLOYEE IMPORT', ''],
        ['', ''],
        ['Column Name', 'Requirement', 'Allowed Values / Examples', 'Description & Defaults'],
        ['Full Name*', 'REQUIRED', 'e.g. John Doe, Rajesh Patel', "Employee's full legal or display name."],
        ['Email*', 'REQUIRED', 'e.g. user@domain.com', 'Must be a valid, unique email address.'],
        ['Username', 'OPTIONAL', 'e.g. jdoe, rajesh.p', 'If empty, auto-generated from email username.'],
        ['Password', 'OPTIONAL', 'e.g. SecurePass123', "If empty, default 'Password123!' is assigned."],
        ['Mobile Number', 'OPTIONAL', 'e.g. +91 9876543210', 'Contact mobile or phone number.'],
        ['Company', 'OPTIONAL', 'Company Name or Code', 'Defaults to main company if empty.'],
        ['Departments', 'OPTIONAL', 'e.g. Sales, Support', 'Comma-separated list of department names.'],
        ['Department Role', 'OPTIONAL', 'USER or ADMIN', 'Role inside assigned department. Default is USER.'],
        ['User Type', 'OPTIONAL', 'Standard User, Vendor...', 'Defaults to Standard User if unspecified.'],
        ['Role', 'OPTIONAL', 'user or admin', 'System role. Default is user.'],
        ['Is Vendor', 'OPTIONAL', 'Yes or No', 'Set Yes for external contractors/suppliers.'],
        ['Can Chat With Vendors', 'OPTIONAL', 'Yes or No', 'Permit internal user to chat with vendors. Default No.'],
        ['Device Verification Required', 'OPTIONAL', 'Yes or No', 'Whether PC hardware approval is required. Default Yes.'],
        ['Date of Joining', 'OPTIONAL', 'YYYY-MM-DD', 'Official start date e.g. 2026-01-15.'],
        ['', ''],
        ['SECURITY NOTE', ''],
        ['All imported users will be required to change their password on first login for security.', ''],
        ['', ''],
        ['AVAILABLE COMPANIES IN SYSTEM:', ''],
        ...companiesList.map((c) => [`• ${c.company_name} (Code: ${c.company_code || 'N/A'})`, '']),
        ['', ''],
        ['AVAILABLE DEPARTMENTS IN SYSTEM:', ''],
        ...departmentsList.map((d) => [`• ${d.department_name}`, '']),
        ['', ''],
        ['AVAILABLE USER TYPES IN SYSTEM:', ''],
        ...userTypesList.map((u) => [`• ${u.type_name || u.name}${u.is_vendor ? ' (Vendor)' : ''}`, '']),
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(instructionRows);
      ws2['!cols'] = [{ wch: 34 }, { wch: 16 }, { wch: 30 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Instructions_Guide');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const dir =
        Platform.OS === 'android'
          ? RNFS.DownloadDirectoryPath || RNFS.DocumentDirectoryPath
          : RNFS.DocumentDirectoryPath;
      const fileName = `EpoxyHouse_Employee_Import_Template.xlsx`;
      const filePath = `${dir}/${fileName}`;

      await RNFS.writeFile(filePath, wbout, 'base64');

      Alert.alert(
        'Template Downloaded',
        `Sample Excel template has been saved to:\n\n${filePath}\n\nYou can fill it with employee records and attach it here for bulk import.`
      );
    } catch (err: any) {
      console.error('Template download error:', err);
      Alert.alert('Download Failed', err?.message || 'Failed to generate Excel template.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Pick & Parse Uploaded Excel / CSV
  // ─────────────────────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const [res] = await pick({
        type: [types.allFiles],
      });

      if (!res || !res.uri) return;

      const fileName = res.name || 'document.xlsx';
      const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
      const validExts = ['.xlsx', '.xls', '.csv'];

      if (!validExts.includes(fileExt)) {
        Alert.alert('Invalid File', 'Please choose a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
        return;
      }

      setUploadedFileName(fileName);
      setUploadedFileSize(res.size || null);
      setImportResult(null);

      // Read file contents as base64 using RNFS
      const base64Data = await RNFS.readFile(res.uri, 'base64');
      const workbook = XLSX.read(base64Data, { type: 'base64' });

      // Read first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawJson || rawJson.length === 0) {
        Alert.alert('Empty File', 'The selected file does not contain any data rows.');
        setParsedRows([]);
        return;
      }

      // Process and validate rows
      const seenEmails = new Set<string>();
      const processed: ParsedUserRow[] = rawJson.map((row: any, index: number) => {
        const name = String(
          row['Full Name*'] || row['Full Name'] || row['full_name'] || row['Name'] || row.name || ''
        ).trim();
        const email = String(
          row['Email*'] || row['Email'] || row['email_address'] || row.email || ''
        )
          .trim()
          .toLowerCase();
        const username = String(row['Username'] || row['User Name'] || row.username || '').trim();
        const password = String(row['Password'] || row.password || '').trim();
        const mobile = String(
          row['Mobile Number'] || row['Mobile'] || row['Phone'] || row.mobNo || row.mob_no || ''
        ).trim();
        const company = String(row['Company'] || row['Company Name'] || row.company || '').trim();
        const departments = String(
          row['Departments'] || row['Department'] || row.departments || ''
        ).trim();
        const deptRole = String(
          row['Department Role'] || row.departmentRole || row.deptRole || 'USER'
        )
          .toUpperCase()
          .trim();
        const userType = String(row['User Type'] || row.userType || '').trim();
        const role = String(row['Role'] || row.role || 'user').toLowerCase().trim();
        const isVendor = String(row['Is Vendor'] || row.isVendor || row.is_vendor || 'No').trim();
        const canChatVendor = String(
          row['Can Chat With Vendors'] || row.canChatWithVendors || 'No'
        ).trim();
        const deviceVerif = String(
          row['Device Verification Required'] || row.deviceVerificationRequired || 'Yes'
        ).trim();
        const dateOfJoin = String(
          row['Date of Joining'] || row['Joining Date'] || row.dateOfJoin || ''
        ).trim();

        // Validation checks
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!name) {
          errors.push('Full Name is missing');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
          errors.push('Email is missing');
        } else if (!emailRegex.test(email)) {
          errors.push('Invalid email format');
        } else if (seenEmails.has(email)) {
          errors.push('Duplicate email in this file');
        } else {
          seenEmails.add(email);
        }

        if (!username && email) {
          warnings.push('Username will be auto-generated from email');
        }
        if (!password) {
          warnings.push(`Default password (${defaultPassword}) will be assigned`);
        }
        if (!company && companiesList.length > 0) {
          warnings.push(`Default company (${companiesList[0]?.company_name}) will be assigned`);
        }

        const status: 'READY' | 'WARNING' | 'ERROR' =
          errors.length > 0 ? 'ERROR' : warnings.length > 0 ? 'WARNING' : 'READY';

        return {
          id: `row_${index + 1}`,
          rowNumber: index + 2,
          name,
          email,
          username: username || (email ? email.split('@')[0] : ''),
          password: password || defaultPassword,
          mobile,
          company: company || companiesList[0]?.company_name || 'Epoxy House',
          departments,
          deptRole: deptRole === 'ADMIN' ? 'ADMIN' : 'USER',
          userType: userType || 'Standard User',
          role: role === 'admin' ? 'admin' : 'user',
          isVendor: ['yes', '1', 'true', 'vendor'].includes(isVendor.toLowerCase()),
          canChatWithVendors: ['yes', '1', 'true'].includes(canChatVendor.toLowerCase()),
          deviceVerificationRequired: !['no', '0', 'false'].includes(deviceVerif.toLowerCase()),
          dateOfJoin: dateOfJoin || new Date().toISOString().split('T')[0],
          errors,
          warnings,
          status,
        };
      });

      setParsedRows(processed);
      Alert.alert('Excel Parsed', `Parsed ${processed.length} records successfully.`);
    } catch (err: any) {
      console.warn('File pick/parse error:', err);
      Alert.alert('Error', err?.message || 'Failed to read or parse Excel file.');
    }
  };

  // Remove single row from batch
  const handleRemoveRow = (rowId: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Submit Bulk Import to Backend API
  // ─────────────────────────────────────────────────────────────────────────
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.status !== 'ERROR');
    if (validRows.length === 0) {
      Alert.alert('No Valid Records', 'There are no valid records ready to import.');
      return;
    }

    try {
      setIsImporting(true);

      const payload = {
        users: validRows.map((r) => ({
          name: r.name,
          username: r.username,
          email: r.email,
          password: r.password || defaultPassword,
          mobNo: r.mobile,
          role: r.role,
          company: r.company,
          departments: r.departments,
          departmentRole: r.deptRole,
          userType: r.userType,
          isVendor: r.isVendor,
          canChatWithVendors: r.canChatWithVendors,
          deviceVerificationRequired: r.deviceVerificationRequired && deviceVerificationRequired,
          dateOfJoin: r.dateOfJoin,
        })),
        options: {
          skipDuplicates,
          defaultPassword,
          mustChangePassword,
          deviceVerificationRequired,
        },
      };

      const response = await bulkImportUsers(payload);

      if (response.data && response.data.success) {
        setImportResult(response.data);
        Alert.alert('Success', response.data.message || 'Users imported successfully!');
      } else {
        Alert.alert('Import Warning', response.data?.message || 'Import completed with notes.');
      }
    } catch (err: any) {
      console.error('Bulk Import Execution Error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to process bulk import.';
      Alert.alert('Import Failed', errMsg);
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered rows for review
  const filteredRows = useMemo(() => {
    return parsedRows.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!tableSearch) return true;
      const q = tableSearch.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.departments.toLowerCase().includes(q)
      );
    });
  }, [parsedRows, statusFilter, tableSearch]);

  const readyCount = parsedRows.filter((r) => r.status === 'READY').length;
  const warningCount = parsedRows.filter((r) => r.status === 'WARNING').length;
  const errorCount = parsedRows.filter((r) => r.status === 'ERROR').length;
  const canSubmit = readyCount + warningCount > 0 && !isImporting;

  return (
    <View style={styles.container}>
      <AppHeader
        title="Bulk Employee Import"
        showBack
        rightAction
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          parsedRows.length === 0 && styles.scrollContentEmpty,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Utility Strip: Standard Template & Guide ── */}
        <View style={[styles.templateUtilityBar, shadows.sm]}>
          <View style={styles.templateUtilityLeft}>
            <View style={styles.templateMiniIconBadge}>
              <FileSpreadsheetIcon size={16} color="#059669" />
            </View>
            <View style={styles.templateUtilityTextCol}>
              <Text style={styles.templateUtilityTitle}>Standard Template</Text>
              <Text style={styles.templateUtilitySubtitle}>Official format & roles</Text>
            </View>
          </View>

          <View style={styles.templateUtilityActions}>
            <TouchableOpacity
              style={styles.utilityDownloadBtn}
              onPress={handleDownloadTemplate}
              activeOpacity={0.8}
            >
              <DownloadIcon size={13} color="#ffffff" />
              <Text style={styles.utilityDownloadBtnText}>Download (.xlsx)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.utilityGuideBtn}
              onPress={() => setShowInstructionsModal(true)}
              activeOpacity={0.7}
            >
              <InfoIcon size={13} color={colors.textPrimary} />
              <Text style={styles.utilityGuideBtnText}>Guide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Attached File Banner (when file selected) ── */}
        {uploadedFileName ? (
          <View style={[styles.attachedFileBox, shadows.sm]}>
            <View style={styles.attachedFileLeft}>
              <View style={styles.fileIconBadge}>
                <FileSpreadsheetIcon size={20} color="#059669" />
              </View>
              <View style={styles.fileDetailsCol}>
                <Text style={styles.fileNameText} numberOfLines={1}>
                  {uploadedFileName}
                </Text>
                <Text style={styles.fileSizeText}>
                  {uploadedFileSize ? `${(uploadedFileSize / 1024).toFixed(1)} KB • ` : ''}
                  {parsedRows.length} records parsed
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.removeFileBtn}
              onPress={() => {
                setUploadedFileName(null);
                setUploadedFileSize(null);
                setParsedRows([]);
                setImportResult(null);
              }}
            >
              <XMarkIcon size={15} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Full-Screen Upload Dropzone Canvas ── */
          <View style={[styles.fullScreenDropzone, shadows.sm]}>
            <View style={styles.dropzoneCenterContent}>
              <View style={styles.dropzoneHeroIconWrap}>
                <View style={styles.dropzoneHeroAura} />
                <View style={styles.dropzoneHeroIconCircle}>
                  <UploadCloudIcon size={36} color="#059669" />
                </View>
              </View>

              <Text style={styles.dropzoneTitle}>Upload Employee Spreadsheet</Text>
              <Text style={styles.dropzoneSubtitle}>
                Select or browse Microsoft Excel (.xlsx, .xls) or CSV files from your device
              </Text>

              <View style={styles.autoMappingBadge}>
                <CheckIcon size={12} color="#059669" />
                <Text style={styles.autoMappingText}>Auto Column Mapping Enabled</Text>
              </View>

              <TouchableOpacity
                style={styles.dropzoneBrowseBtn}
                onPress={handlePickFile}
                activeOpacity={0.8}
              >
                <UploadCloudIcon size={16} color="#ffffff" />
                <Text style={styles.dropzoneBrowseBtnText}>Upload your file here</Text>
              </TouchableOpacity>

              <Text style={styles.dropzoneFileLimitsText}>
                Maximum file size: 10MB • Auto-detects company & departments
              </Text>
            </View>
          </View>
        )}

        {/* ── Parsed Data Preview & Batch Validation ── */}
        {parsedRows.length > 0 && (
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIconWrap}>
                  <UsersIcon size={16} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Review & Verify Records</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>
                  {readyCount} of {parsedRows.length} ready
                </Text>
              </View>
            </View>

            {/* KPI Summary Chips */}
            <View style={styles.kpiChipsRow}>
              <View style={styles.chipTotal}>
                <Text style={styles.chipTotalText}>Total: {parsedRows.length}</Text>
              </View>
              <View style={styles.chipReady}>
                <Text style={styles.chipReadyText}>Ready: {readyCount}</Text>
              </View>
              {warningCount > 0 && (
                <View style={styles.chipWarning}>
                  <Text style={styles.chipWarningText}>Adjusted: {warningCount}</Text>
                </View>
              )}
              {errorCount > 0 && (
                <View style={styles.chipError}>
                  <Text style={styles.chipErrorText}>Errors: {errorCount}</Text>
                </View>
              )}
            </View>

            {/* Search and Status Filter */}
            <View style={styles.searchFilterRow}>
              <View style={styles.searchBox}>
                <SearchIcon size={14} color={colors.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Filter records..."
                  placeholderTextColor={colors.textLight}
                  value={tableSearch}
                  onChangeText={setTableSearch}
                />
                {tableSearch ? (
                  <TouchableOpacity onPress={() => setTableSearch('')}>
                    <XMarkIcon size={14} color={colors.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.filterPillsRow}>
                {(['ALL', 'READY', 'WARNING', 'ERROR'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.filterPill,
                      statusFilter === st && styles.filterPillActive,
                    ]}
                    onPress={() => setStatusFilter(st)}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        statusFilter === st && styles.filterPillTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Records List */}
            <View style={styles.recordsListContainer}>
              {filteredRows.length === 0 ? (
                <View style={styles.emptyFilterBox}>
                  <Text style={styles.emptyFilterText}>No records match the current filter.</Text>
                </View>
              ) : (
                filteredRows.map((row) => (
                  <View
                    key={row.id}
                    style={[
                      styles.recordItemCard,
                      row.status === 'ERROR'
                        ? styles.recordItemError
                        : row.status === 'WARNING'
                        ? styles.recordItemWarning
                        : styles.recordItemReady,
                    ]}
                  >
                    <View style={styles.recordItemTop}>
                      <View style={styles.recordHeaderLeft}>
                        <View style={styles.rowNumberBadge}>
                          <Text style={styles.rowNumberText}>#{row.rowNumber}</Text>
                        </View>
                        <View style={styles.recordNameCol}>
                          <Text style={styles.recordNameText}>{row.name || '(No Name)'}</Text>
                          <Text style={styles.recordEmailText}>{row.email || '(No Email)'}</Text>
                        </View>
                      </View>

                      <View style={styles.recordHeaderRight}>
                        <View
                          style={[
                            styles.statusBadgePill,
                            row.status === 'READY'
                              ? styles.statusBadgeReady
                              : row.status === 'WARNING'
                              ? styles.statusBadgeWarning
                              : styles.statusBadgeError,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              row.status === 'READY'
                                ? styles.statusBadgeTextReady
                                : row.status === 'WARNING'
                                ? styles.statusBadgeTextWarning
                                : styles.statusBadgeTextError,
                            ]}
                          >
                            {row.status}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.trashRowBtn}
                          onPress={() => handleRemoveRow(row.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <TrashIcon size={14} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Meta Row: Company & Dept */}
                    <View style={styles.recordMetaRow}>
                      <View style={styles.recordMetaChip}>
                        <CityIcon size={11} color="#64748b" />
                        <Text style={styles.recordMetaText} numberOfLines={1}>
                          {row.company}
                        </Text>
                      </View>
                      {row.departments ? (
                        <View style={styles.recordMetaChip}>
                          <BuildingIcon size={11} color="#64748b" />
                          <Text style={styles.recordMetaText} numberOfLines={1}>
                            {row.departments} ({row.deptRole})
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Warnings / Errors Details */}
                    {row.errors.length > 0 && (
                      <View style={styles.errorsDetailBox}>
                        {row.errors.map((err, i) => (
                          <Text key={i} style={styles.errorDetailText}>
                            ✕ {err}
                          </Text>
                        ))}
                      </View>
                    )}
                    {row.warnings.length > 0 && row.errors.length === 0 && (
                      <View style={styles.warningsDetailBox}>
                        {row.warnings.map((warn, i) => (
                          <Text key={i} style={styles.warningDetailText}>
                            ℹ {warn}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* Execute Import Button */}
            <TouchableOpacity
              style={[styles.importSubmitBtn, !canSubmit && { opacity: 0.5 }]}
              onPress={handleExecuteImport}
              disabled={!canSubmit}
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
                  <LinearGradient id="bulkImportGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                    <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="100" fill="url(#bulkImportGrad)" />
              </Svg>

              <View style={styles.importSubmitBtnInner}>
                {isImporting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.importSubmitBtnText}>
                      Importing {readyCount + warningCount} Users...
                    </Text>
                  </>
                ) : (
                  <>
                    <UsersIcon size={16} color="#ffffff" />
                    <Text style={styles.importSubmitBtnText}>
                      Create {readyCount + warningCount} Users Now
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Import Completed Report ── */}
        {importResult && (
          <View style={[styles.resultReportCard, shadows.sm]}>
            <View style={styles.resultReportHeader}>
              <View style={styles.resultCheckIconWrap}>
                <CheckIcon size={20} color="#ffffff" />
              </View>
              <View style={styles.resultReportHeaderTextCol}>
                <Text style={styles.resultReportTitle}>Import Completed Successfully!</Text>
                <Text style={styles.resultReportSubtitle}>
                  Processed {importResult.summary?.total} records:{' '}
                  <Text style={{ fontWeight: 'bold', color: '#059669' }}>
                    {importResult.summary?.created} created
                  </Text>
                  ,{' '}
                  <Text style={{ fontWeight: 'bold', color: '#d97706' }}>
                    {importResult.summary?.skipped} skipped/duplicates
                  </Text>
                  .
                </Text>
              </View>
            </View>

            {/* Skipped Users List */}
            {importResult.skippedUsers && importResult.skippedUsers.length > 0 && (
              <View style={styles.skippedUsersBox}>
                <Text style={styles.skippedUsersTitle}>
                  Skipped Records ({importResult.skippedUsers.length})
                </Text>
                {importResult.skippedUsers.map((su, idx) => (
                  <View key={idx} style={styles.skippedUserRow}>
                    <Text style={styles.skippedUserMainText}>
                      Row {su.row}: <Text style={{ fontWeight: 'bold' }}>{su.name}</Text> ({su.email})
                    </Text>
                    <Text style={styles.skippedUserReasonText}>{su.reason}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.resultActionsRow}>
              <TouchableOpacity
                style={styles.viewUserMasterBtn}
                onPress={() => navigation.navigate('UserMaster')}
              >
                <Text style={styles.viewUserMasterBtnText}>View in User Master</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.importAnotherBtn}
                onPress={() => {
                  setImportResult(null);
                  setParsedRows([]);
                  setUploadedFileName(null);
                  setUploadedFileSize(null);
                }}
              >
                <Text style={styles.importAnotherBtnText}>Import Another File</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Field Instructions Guide Modal ── */}
      <Modal
        visible={showInstructionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInstructionsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowInstructionsModal(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom + 16, 28) },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Bulk Import Field Guide</Text>
                <Text style={styles.modalSubtitle}>Excel column specifications and requirements</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowInstructionsModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <XMarkIcon size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.guideItem}>
                <View style={styles.guideItemTop}>
                  <Text style={styles.guideColName}>Full Name*</Text>
                  <View style={styles.requiredPill}>
                    <Text style={styles.requiredPillText}>REQUIRED</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>Employee's full legal name or display name.</Text>
                <Text style={styles.guideExample}>Example: Rajesh Patel, Anita Sharma</Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideItemTop}>
                  <Text style={styles.guideColName}>Email*</Text>
                  <View style={styles.requiredPill}>
                    <Text style={styles.requiredPillText}>REQUIRED</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>Must be a valid, unique enterprise email address.</Text>
                <Text style={styles.guideExample}>Example: rajesh.patel@example.com</Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideItemTop}>
                  <Text style={styles.guideColName}>Username</Text>
                  <View style={styles.optionalPill}>
                    <Text style={styles.optionalPillText}>OPTIONAL</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>If empty, auto-generated from email username.</Text>
                <Text style={styles.guideExample}>Example: rajesh.patel</Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideItemTop}>
                  <Text style={styles.guideColName}>Company</Text>
                  <View style={styles.optionalPill}>
                    <Text style={styles.optionalPillText}>OPTIONAL</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>Company Name or Company Code. Defaults to main company.</Text>
                <Text style={styles.guideExample}>
                  Available: {companiesList.map((c) => c.company_name).join(', ') || 'Epoxy House'}
                </Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideItemTop}>
                  <Text style={styles.guideColName}>Departments</Text>
                  <View style={styles.optionalPill}>
                    <Text style={styles.optionalPillText}>OPTIONAL</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>Comma-separated department names.</Text>
                <Text style={styles.guideExample}>
                  Available: {departmentsList.map((d) => d.department_name).join(', ') || 'Sales, Operations'}
                </Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideItemTop}>
                  <Text style={styles.guideColName}>Department Role</Text>
                  <View style={styles.optionalPill}>
                    <Text style={styles.optionalPillText}>OPTIONAL</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>Role in department: USER or ADMIN. Default is USER.</Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideItemTop}>
                  <Text style={styles.guideColName}>User Type</Text>
                  <View style={styles.optionalPill}>
                    <Text style={styles.optionalPillText}>OPTIONAL</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>Profile type: Standard User, Vendor / External Partner, etc.</Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideItemTop}>
                  <Text style={styles.guideColName}>Is Vendor / Chat With Vendors</Text>
                  <View style={styles.optionalPill}>
                    <Text style={styles.optionalPillText}>OPTIONAL</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>Yes or No. Sets external partner and chat restrictions.</Text>
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },

  scrollContentEmpty: {
    flexGrow: 1,
  },

  /* ── Top Utility Strip: Standard Template & Guide ── */
  templateUtilityBar: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  templateUtilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  templateMiniIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateUtilityTextCol: {
    justifyContent: 'center',
  },
  templateUtilityTitle: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  templateUtilitySubtitle: {
    fontSize: 10,
    color: colors.textMuted,
  },
  templateUtilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  utilityDownloadBtn: {
    height: 32,
    paddingHorizontal: 9,
    borderRadius: borderRadius.md,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  utilityDownloadBtnText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  utilityGuideBtn: {
    height: 32,
    paddingHorizontal: 9,
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  utilityGuideBtnText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },

  /* ── Full-Screen Upload Dropzone Canvas ── */
  fullScreenDropzone: {
    flex: 1,
    minHeight: 380,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 320,
    width: '100%',
  },
  dropzoneHeroIconWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  dropzoneHeroAura: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ecfdf5',
    opacity: 0.8,
  },
  dropzoneHeroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneTitle: {
    fontSize: 16,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  dropzoneSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  autoMappingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 14,
  },
  autoMappingText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#059669',
  },
  dropzoneBrowseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dropzoneBrowseBtnText: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  dropzoneFileLimitsText: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
  },

  /* ── Generic Section Card & Headers ── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  summaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  summaryBadgeText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#059669',
  },

  /* ── Attached File Box ── */
  attachedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
  },
  attachedFileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  fileIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  fileDetailsCol: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
    color: '#064e3b',
  },
  fileSizeText: {
    fontSize: 10.5,
    color: '#047857',
    marginTop: 1,
  },
  removeFileBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  /* ── Step 3: Review Records ── */
  kpiChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chipTotal: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipTotalText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#475569',
  },
  chipReady: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  chipReadyText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#065f46',
  },
  chipWarning: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  chipWarningText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#92400e',
  },
  chipError: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  chipErrorText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#991b1b',
  },

  searchFilterRow: {
    gap: 8,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#ffffff',
  },

  recordsListContainer: {
    gap: 8,
    marginBottom: spacing.md,
  },
  emptyFilterBox: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyFilterText: {
    fontSize: 11,
    color: colors.textLight,
  },

  recordItemCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.sm + 2,
    gap: 6,
  },
  recordItemReady: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  recordItemWarning: {
    backgroundColor: '#fffdf5',
    borderColor: '#fde68a',
  },
  recordItemError: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
  },

  recordItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rowNumberBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  rowNumberText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: '#64748b',
  },
  recordNameCol: {
    flex: 1,
  },
  recordNameText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  recordEmailText: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  recordHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeReady: {
    backgroundColor: '#ecfdf5',
  },
  statusBadgeWarning: {
    backgroundColor: '#fffbeb',
  },
  statusBadgeError: {
    backgroundColor: '#fef2f2',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
  },
  statusBadgeTextReady: {
    color: '#065f46',
  },
  statusBadgeTextWarning: {
    color: '#92400e',
  },
  statusBadgeTextError: {
    color: '#991b1b',
  },
  trashRowBtn: {
    padding: 2,
  },

  recordMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  recordMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recordMetaText: {
    fontSize: 10,
    color: '#475569',
  },

  errorsDetailBox: {
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 6,
    gap: 2,
  },
  errorDetailText: {
    fontSize: 10,
    color: '#991b1b',
    fontWeight: fontWeights.medium,
  },
  warningsDetailBox: {
    backgroundColor: '#fffbeb',
    padding: 6,
    borderRadius: 6,
    gap: 2,
  },
  warningDetailText: {
    fontSize: 10,
    color: '#92400e',
  },

  /* ── Execute Button ── */
  importSubmitBtn: {
    height: 48,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  importSubmitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: '100%',
  },
  importSubmitBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },

  /* ── Report Card ── */
  resultReportCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 12,
  },
  resultReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultCheckIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultReportHeaderTextCol: {
    flex: 1,
  },
  resultReportTitle: {
    fontSize: 13.5,
    fontWeight: fontWeights.extrabold,
    color: '#064e3b',
  },
  resultReportSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  skippedUsersBox: {
    backgroundColor: '#fffbeb',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 4,
  },
  skippedUsersTitle: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#92400e',
    marginBottom: 2,
  },
  skippedUserRow: {
    paddingVertical: 2,
  },
  skippedUserMainText: {
    fontSize: 10.5,
    color: '#78350f',
  },
  skippedUserReasonText: {
    fontSize: 9.5,
    color: '#b45309',
    fontWeight: fontWeights.medium,
  },
  resultActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewUserMasterBtn: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewUserMasterBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  importAnotherBtn: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importAnotherBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },

  /* ── Modal ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: spacing.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  modalScroll: {
    marginVertical: 10,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  guideItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 3,
  },
  guideItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guideColName: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  requiredPill: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  requiredPillText: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: '#991b1b',
  },
  optionalPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  optionalPillText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: '#64748b',
  },
  guideDesc: {
    fontSize: 10.5,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  guideExample: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
