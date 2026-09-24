import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/common/AppHeader';
import {
  CloudIcon,
  HardDriveIcon,
  FolderIcon,
  CheckIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from '../../components/icons/SvgIcons';
import {
  getStorageConfig,
  saveStorageConfig,
  testStorageConnection,
} from '../../api/adminApi';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';

interface CloudStorageMasterScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CloudStorageMaster'>;
}

type StorageDriver = 'LOCAL' | 'GDRIVE' | 'GCS' | 'MICROSOFT';

export const CloudStorageMasterScreen: React.FC<CloudStorageMasterScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Storage Config State
  const [driver, setDriver] = useState<StorageDriver>('LOCAL');

  // Microsoft Cloud (Azure / OneDrive)
  const [azureConnectionString, setAzureConnectionString] = useState('');
  const [azureContainerName, setAzureContainerName] = useState('interchat-files');
  const [azureAccountName, setAzureAccountName] = useState('');
  const [azureAccountKey, setAzureAccountKey] = useState('');
  const [showAzureKey, setShowAzureKey] = useState(false);

  // Google Drive
  const [gdriveFolderId, setGdriveFolderId] = useState('');
  const [gdriveClientEmail, setGdriveClientEmail] = useState('');
  const [gdrivePrivateKey, setGdrivePrivateKey] = useState('');
  const [gdriveUserEmail, setGdriveUserEmail] = useState('raj.jeenweb@gmail.com');

  // Google Cloud Storage (GCS)
  const [projectId, setProjectId] = useState('');
  const [bucketName, setBucketName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStorageConfig();
      if (res.data?.success) {
        const c = res.data.config;
        setDriver(c.driver || 'LOCAL');
        setAzureConnectionString(c.azureConnectionStringMasked || '');
        setAzureContainerName(c.azureContainerName || 'interchat-files');
        setAzureAccountName(c.azureAccountName || '');
        setAzureAccountKey(c.azureAccountKeyMasked || '');

        setProjectId(c.projectId || '');
        setBucketName(c.bucketName || '');
        setClientEmail(c.clientEmail || c.gdriveClientEmail || '');
        setPrivateKey(c.privateKeyMasked || c.gdrivePrivateKeyMasked || '');

        setGdriveFolderId(c.gdriveFolderId || '');
        setGdriveClientEmail(c.gdriveClientEmail || c.clientEmail || '');
        setGdrivePrivateKey(c.gdrivePrivateKeyMasked || c.privateKeyMasked || '');
        setGdriveUserEmail(c.gdriveUserEmail || 'raj.jeenweb@gmail.com');
      }
    } catch (err) {
      console.error('Failed to load storage config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const getDriverTitle = (d: StorageDriver) => {
    if (d === 'MICROSOFT') return 'Microsoft Cloud Storage (Azure / OneDrive)';
    if (d === 'GDRIVE') return 'Google Drive (15 GB Free)';
    if (d === 'GCS') return 'Google Cloud Storage (GCS)';
    return 'Local Server Disk';
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const payload = {
      driver,
      azureConnectionString,
      azureContainerName,
      azureAccountName,
      azureAccountKey,
      projectId,
      bucketName,
      clientEmail,
      privateKey,
      gdriveFolderId,
      gdriveClientEmail,
      gdrivePrivateKey,
      gdriveUserEmail,
    };

    try {
      const res = await testStorageConnection(payload);
      setTestResult(res.data);
      if (res.data?.success) {
        Alert.alert('Connection Verified', res.data.message || 'Storage connection verified successfully!');
      } else {
        Alert.alert('Connection Failed', res.data?.message || 'Storage connection test failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Connection test failed.';
      setTestResult({ success: false, message: msg });
      Alert.alert('Connection Test Failed', msg);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    const payload = {
      driver,
      azureConnectionString,
      azureContainerName,
      azureAccountName,
      azureAccountKey,
      projectId,
      bucketName,
      clientEmail,
      privateKey,
      gdriveFolderId,
      gdriveClientEmail,
      gdrivePrivateKey,
      gdriveUserEmail,
    };

    try {
      const res = await saveStorageConfig(payload);
      if (res.data?.success) {
        Alert.alert('Saved', res.data.message || 'Storage configuration saved successfully!');
        fetchConfig();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to save configuration.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save configuration.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Cloud Storage Master"
        showBack
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading storage configuration...</Text>
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
            <View style={styles.bannerTagPill}>
              <Text style={styles.bannerTagText}>CLOUD INFRASTRUCTURE</Text>
            </View>
            <Text style={styles.bannerTitle}>Cloud Storage Master</Text>
            <Text style={styles.bannerSubtitle}>
              Configure internal document and chat file storage: Microsoft Cloud Storage (Azure / OneDrive), Google Drive (15 GB Free), Local Server Disk, or Google Cloud.
            </Text>
          </View>

          {/* ── Current Active Storage Provider Status Card ── */}
          <View style={[styles.activeStatusCard, shadows.sm]}>
            <View style={styles.activeStatusLeft}>
              <View
                style={[
                  styles.activeIconWrap,
                  driver === 'MICROSOFT'
                    ? { backgroundColor: '#f0f9ff' }
                    : driver === 'GDRIVE'
                    ? { backgroundColor: '#eff6ff' }
                    : driver === 'GCS'
                    ? { backgroundColor: '#ecfdf5' }
                    : { backgroundColor: '#eef2ff' },
                ]}
              >
                {driver === 'LOCAL' ? (
                  <HardDriveIcon size={20} color="#4f46e5" />
                ) : driver === 'GDRIVE' ? (
                  <FolderIcon size={20} color="#2563eb" />
                ) : (
                  <CloudIcon
                    size={20}
                    color={driver === 'MICROSOFT' ? '#0284c7' : '#059669'}
                  />
                )}
              </View>

              <View style={styles.activeTextCol}>
                <Text style={styles.activeLabel}>CURRENT ACTIVE STORAGE PROVIDER</Text>
                <Text style={styles.activeDriverName}>{getDriverTitle(driver)}</Text>
              </View>
            </View>

            <View
              style={[
                styles.onlineBadge,
                driver === 'MICROSOFT'
                  ? { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }
                  : driver === 'GDRIVE'
                  ? { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
                  : driver === 'GCS'
                  ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
                  : { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
              ]}
            >
              <View
                style={[
                  styles.pulseDot,
                  {
                    backgroundColor:
                      driver === 'MICROSOFT'
                        ? '#0284c7'
                        : driver === 'GDRIVE'
                        ? '#2563eb'
                        : driver === 'GCS'
                        ? '#059669'
                        : '#4f46e5',
                  },
                ]}
              />
              <Text
                style={[
                  styles.onlineBadgeText,
                  {
                    color:
                      driver === 'MICROSOFT'
                        ? '#0369a1'
                        : driver === 'GDRIVE'
                        ? '#1d4ed8'
                        : driver === 'GCS'
                        ? '#047857'
                        : '#4338ca',
                  },
                ]}
              >
                Online & Ready
              </Text>
            </View>
          </View>

          {/* ── Driver Selection Section ── */}
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.sectionHeading}>SELECT STORAGE DRIVER</Text>

            <View style={styles.driverOptionsGrid}>
              {/* 1. Microsoft Cloud */}
              <TouchableOpacity
                style={[
                  styles.driverCard,
                  driver === 'MICROSOFT' && styles.driverCardSelectedMicrosoft,
                ]}
                onPress={() => setDriver('MICROSOFT')}
                activeOpacity={0.7}
              >
                <View style={styles.driverCardRadioRow}>
                  <View style={[styles.radioCircle, driver === 'MICROSOFT' && styles.radioCircleSkyActive]}>
                    {driver === 'MICROSOFT' && <View style={styles.radioInnerSky} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.driverTitleRow}>
                      <Text style={styles.driverTitle}>Microsoft Cloud</Text>
                      <View style={styles.driverBadgeSky}>
                        <Text style={styles.driverBadgeSkyText}>Azure/MS365</Text>
                      </View>
                    </View>
                    <Text style={styles.driverSubtext}>
                      Microsoft Azure Blob Storage & OneDrive integration.
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* 2. Google Drive */}
              <TouchableOpacity
                style={[
                  styles.driverCard,
                  driver === 'GDRIVE' && styles.driverCardSelectedGDrive,
                ]}
                onPress={() => setDriver('GDRIVE')}
                activeOpacity={0.7}
              >
                <View style={styles.driverCardRadioRow}>
                  <View style={[styles.radioCircle, driver === 'GDRIVE' && styles.radioCircleBlueActive]}>
                    {driver === 'GDRIVE' && <View style={styles.radioInnerBlue} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.driverTitleRow}>
                      <Text style={styles.driverTitle}>Google Drive</Text>
                      <View style={styles.driverBadgeEmerald}>
                        <Text style={styles.driverBadgeEmeraldText}>15 GB Free</Text>
                      </View>
                    </View>
                    <Text style={styles.driverSubtext}>
                      Personal Google Drive storage with service account.
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* 3. Local Disk */}
              <TouchableOpacity
                style={[
                  styles.driverCard,
                  driver === 'LOCAL' && styles.driverCardSelectedLocal,
                ]}
                onPress={() => setDriver('LOCAL')}
                activeOpacity={0.7}
              >
                <View style={styles.driverCardRadioRow}>
                  <View style={[styles.radioCircle, driver === 'LOCAL' && styles.radioCircleIndigoActive]}>
                    {driver === 'LOCAL' && <View style={styles.radioInnerIndigo} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverTitle}>Local Server Disk</Text>
                    <Text style={styles.driverSubtext}>
                      Direct storage on your cPanel / Node server disk.
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* 4. Google Cloud Storage */}
              <TouchableOpacity
                style={[
                  styles.driverCard,
                  driver === 'GCS' && styles.driverCardSelectedGcs,
                ]}
                onPress={() => setDriver('GCS')}
                activeOpacity={0.7}
              >
                <View style={styles.driverCardRadioRow}>
                  <View style={[styles.radioCircle, driver === 'GCS' && styles.radioCircleEmeraldActive]}>
                    {driver === 'GCS' && <View style={styles.radioInnerEmerald} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverTitle}>Google Cloud (GCS)</Text>
                    <Text style={styles.driverSubtext}>
                      Enterprise GCS bucket with Google Cloud account.
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* ── DRIVER SPECIFIC FIELDS ── */}

            {/* Case 1: MICROSOFT CLOUD / AZURE */}
            {driver === 'MICROSOFT' && (
              <View style={styles.driverConfigBox}>
                <View style={styles.guideCalloutSky}>
                  <Text style={styles.guideTitleSky}>Microsoft Azure Storage & OneDrive Guide:</Text>
                  <Text style={styles.guideStepSky}>
                    1. Log in to Microsoft Azure Portal (portal.azure.com).
                  </Text>
                  <Text style={styles.guideStepSky}>
                    2. Open Storage Account ➔ Access keys.
                  </Text>
                  <Text style={styles.guideStepSky}>
                    3. Copy Connection String (or Account Name & Key) and paste below.
                  </Text>
                  <Text style={styles.guideStepSky}>
                    4. The container is automatically created and configured.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Azure Connection String (Recommended)</Text>
                  <TextInput
                    style={[styles.textArea, styles.fontMono]}
                    multiline
                    numberOfLines={3}
                    placeholder="DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=...;EndpointSuffix=core.windows.net"
                    placeholderTextColor={colors.textLight}
                    value={azureConnectionString}
                    onChangeText={setAzureConnectionString}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Container Name</Text>
                  <TextInput
                    style={[styles.input, styles.fontMono]}
                    placeholder="e.g. interchat-files"
                    placeholderTextColor={colors.textLight}
                    value={azureContainerName}
                    onChangeText={setAzureContainerName}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Storage Account Name (Optional Alternative)</Text>
                  <TextInput
                    style={[styles.input, styles.fontMono]}
                    placeholder="e.g. interchatstorage"
                    placeholderTextColor={colors.textLight}
                    value={azureAccountName}
                    onChangeText={setAzureAccountName}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRowBetween}>
                    <Text style={styles.inputLabel}>Storage Account Access Key (Optional)</Text>
                    <TouchableOpacity
                      onPress={() => setShowAzureKey(!showAzureKey)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.toggleKeyText}>{showAzureKey ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.input, styles.fontMono]}
                    placeholder="Enter Azure Account Access Key"
                    placeholderTextColor={colors.textLight}
                    value={azureAccountKey}
                    onChangeText={setAzureAccountKey}
                    secureTextEntry={!showAzureKey}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {/* Case 2: GOOGLE DRIVE */}
            {driver === 'GDRIVE' && (
              <View style={styles.driverConfigBox}>
                <View style={styles.guideCalloutBlue}>
                  <Text style={styles.guideTitleBlue}>Google Drive Configuration Guide:</Text>
                  <Text style={styles.guideStepBlue}>
                    1. Create folder named "InterChat_Files" in Google Drive (drive.google.com).
                  </Text>
                  <Text style={styles.guideStepBlue}>
                    2. Right-click folder ➔ Share ➔ paste Client Email below as Editor.
                  </Text>
                  <Text style={styles.guideStepBlue}>
                    3. Copy Folder ID from URL (folders/FOLDER_ID) and paste below.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Google Drive Folder ID</Text>
                  <TextInput
                    style={[styles.input, styles.fontMono]}
                    placeholder="e.g. 1a2B3c4D5e6F7g8H9i0jK_LmNoP"
                    placeholderTextColor={colors.textLight}
                    value={gdriveFolderId}
                    onChangeText={setGdriveFolderId}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Service Account Client Email</Text>
                  <TextInput
                    style={[styles.input, styles.fontMono]}
                    placeholder="e.g. chat-uploader@your-project.iam.gserviceaccount.com"
                    placeholderTextColor={colors.textLight}
                    value={gdriveClientEmail}
                    onChangeText={(val) => {
                      setGdriveClientEmail(val);
                      setClientEmail(val);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Service Account Private Key</Text>
                  <TextInput
                    style={[styles.textArea, styles.fontMono]}
                    multiline
                    numberOfLines={4}
                    placeholder="-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----"
                    placeholderTextColor={colors.textLight}
                    value={gdrivePrivateKey}
                    onChangeText={(val) => {
                      setGdrivePrivateKey(val);
                      setPrivateKey(val);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {/* Case 3: GOOGLE CLOUD STORAGE (GCS) */}
            {driver === 'GCS' && (
              <View style={styles.driverConfigBox}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>GCS Project ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. my-interchat-project"
                    placeholderTextColor={colors.textLight}
                    value={projectId}
                    onChangeText={setProjectId}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>GCS Bucket Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. interchat-chat-files"
                    placeholderTextColor={colors.textLight}
                    value={bucketName}
                    onChangeText={setBucketName}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Service Account Client Email</Text>
                  <TextInput
                    style={[styles.input, styles.fontMono]}
                    placeholder="e.g. storage-uploader@my-interchat-project.iam.gserviceaccount.com"
                    placeholderTextColor={colors.textLight}
                    value={clientEmail}
                    onChangeText={setClientEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Service Account Private Key</Text>
                  <TextInput
                    style={[styles.textArea, styles.fontMono]}
                    multiline
                    numberOfLines={4}
                    placeholder="-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----"
                    placeholderTextColor={colors.textLight}
                    value={privateKey}
                    onChangeText={setPrivateKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {/* Case 4: LOCAL SERVER DISK */}
            {driver === 'LOCAL' && (
              <View style={styles.localInfoCard}>
                <View style={styles.localInfoHeader}>
                  <HardDriveIcon size={16} color="#4f46e5" />
                  <Text style={styles.localInfoTitle}>Local Server Disk Storage Active</Text>
                </View>
                <Text style={styles.localInfoDesc}>
                  All chat documents and images are stored securely on the hosting server in the local directory.
                </Text>
                <Text style={styles.localInfoMuted}>Zero cloud API configuration required.</Text>
              </View>
            )}

            {/* Test Result Feedback */}
            {testResult && (
              <View
                style={[
                  styles.testResultBox,
                  testResult.success ? styles.testResultSuccess : styles.testResultError,
                ]}
              >
                <Text
                  style={[
                    styles.testResultText,
                    testResult.success ? styles.testResultTextSuccess : styles.testResultTextError,
                  ]}
                >
                  {testResult.success ? '✓ ' : '✕ '} {testResult.message}
                </Text>
              </View>
            )}

            {/* ── Action Buttons ── */}
            <View style={styles.actionsContainer}>
              {driver !== 'LOCAL' && (
                <TouchableOpacity
                  style={[styles.testBtn, testing && { opacity: 0.6 }]}
                  onPress={handleTestConnection}
                  disabled={testing}
                  activeOpacity={0.7}
                >
                  {testing ? (
                    <>
                      <ActivityIndicator size="small" color="#4f46e5" />
                      <Text style={styles.testBtnText}>Testing Cloud Connection...</Text>
                    </>
                  ) : (
                    <>
                      <CheckIcon size={14} color="#4f46e5" />
                      <Text style={styles.testBtnText}>
                        Test {driver === 'MICROSOFT' ? 'Microsoft Cloud' : driver === 'GDRIVE' ? 'Google Drive' : 'GCS'} Connection
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Save Storage Configuration Button with Linear Gradient */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveConfig}
                disabled={saving}
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
                    <LinearGradient id="saveStorageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#0056cf" />
                      <Stop offset="100%" stopColor="#4f46e5" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100" height="100" fill="url(#saveStorageGrad)" />
                </Svg>

                <View style={styles.saveBtnInner}>
                  {saving ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.saveBtnText}>Saving Storage Configuration...</Text>
                    </>
                  ) : (
                    <>
                      <CloudIcon size={16} color="#ffffff" />
                      <Text style={styles.saveBtnText}>Save Storage Configuration</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
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
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },

  /* ── Header Banner ── */
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

  /* ── Active Status Card ── */
  activeStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  activeStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  activeTextCol: {
    flex: 1,
  },
  activeLabel: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: colors.textLight,
    letterSpacing: 0.4,
  },
  activeDriverName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineBadgeText: {
    fontSize: 10.5,
    fontWeight: fontWeights.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  /* ── Main Form Card ── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: fontWeights.extrabold,
    color: colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  driverOptionsGrid: {
    gap: 8,
    marginBottom: spacing.md,
  },
  driverCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: spacing.sm + 2,
  },
  driverCardSelectedMicrosoft: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  driverCardSelectedGDrive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  driverCardSelectedLocal: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  driverCardSelectedGcs: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  driverCardRadioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSkyActive: {
    borderColor: '#0284c7',
  },
  radioInnerSky: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284c7',
  },
  radioCircleBlueActive: {
    borderColor: '#2563eb',
  },
  radioInnerBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  radioCircleIndigoActive: {
    borderColor: '#4f46e5',
  },
  radioInnerIndigo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
  },
  radioCircleEmeraldActive: {
    borderColor: '#059669',
  },
  radioInnerEmerald: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  driverTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
  },
  driverBadgeSky: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  driverBadgeSkyText: {
    fontSize: 9,
    fontWeight: fontWeights.black,
    color: '#0369a1',
  },
  driverBadgeEmerald: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  driverBadgeEmeraldText: {
    fontSize: 9,
    fontWeight: fontWeights.black,
    color: '#047857',
  },
  driverSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },

  /* ── Driver Config Box ── */
  driverConfigBox: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  guideCalloutSky: {
    backgroundColor: '#f0f9ff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    gap: 3,
  },
  guideTitleSky: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    color: '#0369a1',
    marginBottom: 2,
  },
  guideStepSky: {
    fontSize: 10.5,
    color: '#075985',
    lineHeight: 15,
  },
  guideCalloutBlue: {
    backgroundColor: '#eff6ff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    gap: 3,
  },
  guideTitleBlue: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    color: '#1d4ed8',
    marginBottom: 2,
  },
  guideStepBlue: {
    fontSize: 10.5,
    color: '#1e40af',
    lineHeight: 15,
  },

  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  labelRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  toggleKeyText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#0056cf',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    height: 42,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontSize: 11,
    color: colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  fontMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  /* ── Local Info Card ── */
  localInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: spacing.md,
    gap: 4,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  localInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  localInfoTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  localInfoDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  localInfoMuted: {
    fontSize: 10.5,
    color: colors.textLight,
  },

  /* ── Test Feedback ── */
  testResultBox: {
    padding: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  testResultSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  testResultError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  testResultText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
  testResultTextSuccess: {
    color: '#065f46',
  },
  testResultTextError: {
    color: '#991b1b',
  },

  /* ── Actions ── */
  actionsContainer: {
    gap: 10,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  testBtn: {
    height: 42,
    borderRadius: borderRadius.lg,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#4f46e5',
  },
  saveBtn: {
    height: 48,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: '100%',
  },
  saveBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
});
