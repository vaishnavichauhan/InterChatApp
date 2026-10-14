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
  Linking,
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
  EyeIcon,
  EyeOffIcon,
  RefreshIcon,
} from '../../components/icons/SvgIcons';
import {
  getStorageConfig,
  saveStorageConfig,
  testStorageConnection,
  getOneDriveAuthUrl,
} from '../../api/adminApi';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';

interface CloudStorageMasterScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CloudStorageMaster'>;
}

export type StorageDriver = 'ONEDRIVE' | 'MICROSOFT' | 'GDRIVE' | 'LOCAL' | 'GCS';

const DRIVER_OPTIONS: {
  key: StorageDriver;
  title: string;
  badge: string;
  subtext: string;
  icon: (selected: boolean) => React.ReactNode;
  activeColor: string;
  badgeBg: string;
  badgeText: string;
  cardActiveBg: string;
  cardActiveBorder: string;
  iconBg: string;
}[] = [
    {
    key: 'LOCAL',
    title: 'Local Disk',
    badge: 'Zero Config',
    subtext: 'Direct storage on your server disk.',
    icon: (selected: boolean) => (
      <HardDriveIcon size={24} color={selected ? colors.primary : colors.primaryDark} />
    ),
    activeColor: colors.primary,
    badgeBg: colors.primarySubtle,
    badgeText: colors.primary,
    cardActiveBg: colors.primarySubtle,
    cardActiveBorder: colors.primaryMuted,
    iconBg: colors.primarySubtle,
  },
  {
    key: 'ONEDRIVE',
    title: 'OneDrive',
    badge: '1 TB Cloud',
    subtext: 'Your 1 TB Microsoft 365 account storage.',
    icon: (selected: boolean) => (
      <CloudIcon size={24} color={selected ? '#2563eb' : '#1d4ed8'} />
    ),
    activeColor: '#2563eb',
    badgeBg: '#dbeafe',
    badgeText: '#1d4ed8',
    cardActiveBg: '#eff6ff',
    cardActiveBorder: '#3b82f6',
    iconBg: '#dbeafe',
  },
  {
    key: 'MICROSOFT',
    title: 'Azure Blob',
    badge: 'Azure Key',
    subtext: 'Microsoft Azure Blob Storage account.',
    icon: (selected: boolean) => (
      <CloudIcon size={24} color={selected ? '#0284c7' : '#0369a1'} />
    ),
    activeColor: '#0284c7',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
    cardActiveBg: '#f0f9ff',
    cardActiveBorder: '#38bdf8',
    iconBg: '#e0f2fe',
  },
  {
    key: 'GDRIVE',
    title: 'Google Drive',
    badge: '15 GB Free',
    subtext: 'Personal Google Drive storage with service account.',
    icon: (selected: boolean) => (
      <FolderIcon size={24} color={selected ? '#059669' : '#047857'} />
    ),
    activeColor: '#059669',
    badgeBg: '#d1fae5',
    badgeText: '#047857',
    cardActiveBg: '#ecfdf5',
    cardActiveBorder: '#34d399',
    iconBg: '#d1fae5',
  },

  {
    key: 'GCS',
    title: 'Google Cloud',
    badge: 'Enterprise GCS',
    subtext: 'Enterprise GCS bucket.',
    icon: (selected: boolean) => (
      <CloudIcon size={24} color={selected ? '#7c3aed' : '#6d28d9'} />
    ),
    activeColor: '#7c3aed',
    badgeBg: '#ede9fe',
    badgeText: '#6d28d9',
    cardActiveBg: '#f5f3ff',
    cardActiveBorder: '#a78bfa',
    iconBg: '#ede9fe',
  },
];

export const CloudStorageMasterScreen: React.FC<CloudStorageMasterScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectingOneDrive, setConnectingOneDrive] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Storage Config State
  const [driver, setDriver] = useState<StorageDriver>('LOCAL');

  // Microsoft OneDrive (1 TB)
  const [onedriveClientId, setOnedriveClientId] = useState('');
  const [onedriveClientSecret, setOnedriveClientSecret] = useState('');
  const [onedriveFolderName, setOnedriveFolderName] = useState('InterChat_Uploads');
  const [hasOnedriveRefresh, setHasOnedriveRefresh] = useState(false);
  const [onedriveUserEmail, setOnedriveUserEmail] = useState('');
  const [showOneDriveSecret, setShowOneDriveSecret] = useState(false);

  // Microsoft Azure Blob Storage
  const [azureConnectionString, setAzureConnectionString] = useState('');
  const [azureContainerName, setAzureContainerName] = useState('interchat-files');
  const [azureAccountName, setAzureAccountName] = useState('');
  const [azureAccountKey, setAzureAccountKey] = useState('');
  const [showAzureKey, setShowAzureKey] = useState(false);

  // Google Drive
  const [gdriveFolderId, setGdriveFolderId] = useState('');
  const [gdriveClientEmail, setGdriveClientEmail] = useState('');
  const [gdrivePrivateKey, setGdrivePrivateKey] = useState('');

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

        // OneDrive
        setOnedriveClientId(c.onedriveClientId || '');
        setOnedriveClientSecret(c.onedriveClientSecretMasked || '');
        setOnedriveFolderName(c.onedriveFolderName || 'InterChat_Uploads');
        setHasOnedriveRefresh(Boolean(c.hasOnedriveRefresh));
        setOnedriveUserEmail(c.onedriveUserEmail || '');

        // Azure
        setAzureConnectionString(c.azureConnectionStringMasked || '');
        setAzureContainerName(c.azureContainerName || 'interchat-files');
        setAzureAccountName(c.azureAccountName || '');
        setAzureAccountKey(c.azureAccountKeyMasked || '');

        // GCS
        setProjectId(c.projectId || '');
        setBucketName(c.bucketName || '');
        setClientEmail(c.clientEmail || c.gdriveClientEmail || '');
        setPrivateKey(c.privateKeyMasked || c.gdrivePrivateKeyMasked || '');

        // Google Drive
        setGdriveFolderId(c.gdriveFolderId || '');
        setGdriveClientEmail(c.gdriveClientEmail || c.clientEmail || '');
        setGdrivePrivateKey(c.gdrivePrivateKeyMasked || c.privateKeyMasked || '');
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
    if (d === 'ONEDRIVE') return 'Microsoft OneDrive (1 TB)';
    if (d === 'MICROSOFT') return 'Microsoft Azure Blob Storage';
    if (d === 'GDRIVE') return 'Google Drive (15 GB Free)';
    if (d === 'GCS') return 'Google Cloud Storage (GCS)';
    return 'Local Server Disk';
  };

  const handleConnectOneDrive = async () => {
    if (!onedriveClientId || !onedriveClientId.trim()) {
      Alert.alert('Client ID Required', 'Please enter your Application (client) ID first.');
      return;
    }

    setConnectingOneDrive(true);
    try {
      const res = await getOneDriveAuthUrl({
        clientId: onedriveClientId.trim(),
        clientSecret: onedriveClientSecret ? onedriveClientSecret.trim() : '',
      });

      if (res.data?.success && res.data.authUrl) {
        const supported = await Linking.canOpenURL(res.data.authUrl);
        if (supported) {
          await Linking.openURL(res.data.authUrl);
        } else {
          Alert.alert('Cannot Open Browser', 'Unable to launch browser on this device.');
        }
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to generate authorization URL');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to initiate OneDrive connection');
    } finally {
      setConnectingOneDrive(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const payload = {
      driver,
      onedriveClientId,
      onedriveClientSecret,
      onedriveFolderName,
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
      gdriveUserEmail: 'raj.jeenweb@gmail.com',
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
      onedriveClientId,
      onedriveClientSecret,
      onedriveFolderName,
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
      gdriveUserEmail: 'raj.jeenweb@gmail.com',
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
        rightAction
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
          {/* ── Full-Screen Storage Workspace (Border Removed) ── */}
          <View style={styles.fullScreenWorkspace}>
            {/* Integrated Active Status Header */}
            <View style={styles.activeStatusHeaderRow}>
              <View style={styles.activeStatusLeft}>
                <View
                  style={[
                    styles.activeIconWrap,
                    driver === 'ONEDRIVE'
                      ? { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
                      : driver === 'MICROSOFT'
                      ? { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }
                      : driver === 'GDRIVE'
                      ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
                      : driver === 'GCS'
                      ? { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }
                      : { backgroundColor: colors.primarySubtle, borderColor: colors.primaryMuted },
                  ]}
                >
                  {driver === 'LOCAL' ? (
                    <HardDriveIcon size={20} color={colors.primary} />
                  ) : driver === 'GDRIVE' ? (
                    <FolderIcon size={20} color="#059669" />
                  ) : driver === 'ONEDRIVE' ? (
                    <CloudIcon size={20} color="#2563eb" />
                  ) : driver === 'MICROSOFT' ? (
                    <CloudIcon size={20} color="#0284c7" />
                  ) : (
                    <CloudIcon size={20} color="#7c3aed" />
                  )}
                </View>

                <View style={styles.activeTextCol}>
                  <Text style={styles.activeLabel}>CURRENT ACTIVE STORAGE PROVIDER</Text>
                  <Text style={styles.activeDriverName}>{getDriverTitle(driver)}</Text>
                </View>
              </View>

              {/* Online & Ready Badge */}
             
            </View>

      


            {/* Storage Driver Selection */}
            <View style={styles.driverSelectionSection}>
              <Text style={styles.sectionHeading}>SELECT STORAGE DRIVER</Text>

              <ScrollView
                horizontal
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalCardsScrollView}
                contentContainerStyle={styles.horizontalCardsScroll}
              >
                {DRIVER_OPTIONS.map((item) => {
                  const isSelected = driver === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.boxCard,
                        isSelected
                          ? {
                              backgroundColor: item.cardActiveBg,
                              borderColor: item.cardActiveBorder,
                              borderWidth: 2,
                            }
                          : {
                              backgroundColor: '#ffffff',
                              borderColor: '#e2e8f0',
                              borderWidth: 1.5,
                            },
                      ]}
                      onPress={() => setDriver(item.key)}
                      activeOpacity={0.75}
                    >
                      {/* Top Row: Provider Icon + Selected Indicator */}
                      <View style={styles.boxCardTopRow}>
                        <View style={[styles.boxIconWrap, { backgroundColor: item.iconBg }]}>
                          {item.icon(isSelected)}
                        </View>

                        {isSelected ? (
                          <View style={[styles.boxCheckWrap, { backgroundColor: item.activeColor }]}>
                            <CheckIcon size={12} color="#ffffff" />
                          </View>
                        ) : (
                          <View style={styles.boxRadioWrap} />
                        )}
                      </View>

                      {/* Title */}
                      <Text style={styles.boxCardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>

                      {/* Badge */}
                      <View style={[styles.boxBadgePill, { backgroundColor: item.badgeBg }]}>
                        <Text style={[styles.boxBadgeText, { color: item.badgeText }]}>
                          {item.badge}
                        </Text>
                      </View>

                      {/* Description Subtext */}
                      <Text style={styles.boxCardSubtext} numberOfLines={2}>
                        {item.subtext}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── DRIVER SPECIFIC FIELDS ── */}

            {/* 1. MICROSOFT ONEDRIVE (1 TB) */}
            {driver === 'ONEDRIVE' && (
              <View style={styles.driverConfigBox}>
                <View style={styles.guideCalloutBlue}>
                  <Text style={styles.guideTitleBlue}>Connect Your 1 TB OneDrive Account (Simple 3 Steps):</Text>
                  <Text style={styles.guideStepBlue}>
                    1. Go to Azure Portal ➔ App registrations and tap New registration.
                  </Text>
                  <Text style={styles.guideStepBlue}>
                    2. Name it "InterChat OneDrive". Select multi-tenant & personal Microsoft accounts.
                  </Text>
                  <Text style={styles.guideStepBlue}>
                    3. Copy Application (client) ID and Client Secret Value below.
                  </Text>
                  <Text style={styles.guideStepBlue}>
                    4. Tap the blue "Connect 1 TB OneDrive Account" button to sign in!
                  </Text>
                </View>

                {/* Connection Status Card */}
                {hasOnedriveRefresh ? (
                  <View style={styles.onedriveStatusConnected}>
                    <View style={styles.onedriveStatusLeft}>
                      <View style={styles.onedriveStatusIconWrapGreen}>
                        <CheckIcon size={18} color="#ffffff" />
                      </View>
                      <View style={styles.onedriveStatusTextCol}>
                        <View style={styles.onedriveBadgeRow}>
                          <Text style={styles.onedriveConnectedTitle}>1 TB OneDrive Linked & Active</Text>
                          <View style={styles.readyBadgePill}>
                            <Text style={styles.readyBadgeText}>READY</Text>
                          </View>
                        </View>
                        <Text style={styles.onedriveConnectedSubtext}>
                          {onedriveUserEmail ? `Account: ${onedriveUserEmail}` : 'Microsoft 365 Cloud Drive Connected'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.reconnectBtn}
                      onPress={handleConnectOneDrive}
                      disabled={connectingOneDrive}
                    >
                      <RefreshIcon size={12} color="#065f46" />
                      <Text style={styles.reconnectBtnText}>Reconnect</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.onedriveStatusUnlinked}>
                    <View style={styles.onedriveStatusIconWrapAmber}>
                      <CloudIcon size={18} color="#ffffff" />
                    </View>
                    <View style={styles.onedriveStatusTextCol}>
                      <Text style={styles.onedriveUnlinkedTitle}>Account Not Connected Yet</Text>
                      <Text style={styles.onedriveUnlinkedSubtext}>
                        Enter your Application ID below, then tap "Connect 1 TB OneDrive Account" to link your 1,000 GB storage.
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Application (client) ID <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, styles.fontMono]}
                    placeholder="e.g. 7f9a1234-abcd-5678-ef90-..."
                    placeholderTextColor={colors.textLight}
                    value={onedriveClientId}
                    onChangeText={setOnedriveClientId}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRowBetween}>
                    <Text style={styles.inputLabel}>Client Secret Value (Optional / Recommended)</Text>
                    <TouchableOpacity
                      onPress={() => setShowOneDriveSecret(!showOneDriveSecret)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.toggleKeyText}>{showOneDriveSecret ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.input, styles.fontMono]}
                    placeholder="Enter Client Secret Value from Azure"
                    placeholderTextColor={colors.textLight}
                    value={onedriveClientSecret}
                    onChangeText={setOnedriveClientSecret}
                    secureTextEntry={!showOneDriveSecret}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Target Folder in OneDrive</Text>
                  <TextInput
                    style={[styles.input, styles.fontMono]}
                    placeholder="InterChat_Uploads"
                    placeholderTextColor={colors.textLight}
                    value={onedriveFolderName}
                    onChangeText={setOnedriveFolderName}
                    autoCapitalize="none"
                  />
                  <Text style={styles.fieldHelperText}>
                    Uploaded images, videos, and files will automatically appear inside this folder in your 1 TB OneDrive.
                  </Text>
                </View>

                {/* Connect OneDrive Action Button */}
                <TouchableOpacity
                  style={[styles.connectOneDriveBtn, (!onedriveClientId || connectingOneDrive) && { opacity: 0.6 }]}
                  onPress={handleConnectOneDrive}
                  disabled={connectingOneDrive || !onedriveClientId}
                  activeOpacity={0.8}
                >
                  {connectingOneDrive ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.connectOneDriveBtnText}>Opening Microsoft Login...</Text>
                    </>
                  ) : (
                    <>
                      <CloudIcon size={16} color="#ffffff" />
                      <Text style={styles.connectOneDriveBtnText}>
                        {hasOnedriveRefresh ? 'Re-authorize 1 TB OneDrive Account' : 'Connect 1 TB OneDrive Account'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 2. MICROSOFT AZURE BLOB STORAGE */}
            {driver === 'MICROSOFT' && (
              <View style={styles.driverConfigBox}>
                <View style={styles.guideCalloutSky}>
                  <Text style={styles.guideTitleSky}>Microsoft Azure Storage Guide:</Text>
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
                    <Text style={styles.inputLabel}>Storage Account Access Key (Optional if Connection String provided)</Text>
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

            {/* 3. GOOGLE DRIVE */}
            {driver === 'GDRIVE' && (
              <View style={styles.driverConfigBox}>
                <View style={styles.guideCalloutGreen}>
                  <Text style={styles.guideTitleGreen}>Google Drive Configuration Guide:</Text>
                  <Text style={styles.guideStepGreen}>
                    1. Create folder named "InterChat_Files" in Google Drive (drive.google.com).
                  </Text>
                  <Text style={styles.guideStepGreen}>
                    2. Right-click folder ➔ Share ➔ paste Client Email below as Editor.
                  </Text>
                  <Text style={styles.guideStepGreen}>
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

            {/* 4. LOCAL SERVER DISK */}
            {driver === 'LOCAL' && (
              <View style={styles.localInfoCard}>
                <View style={styles.localInfoHeader}>
                  <HardDriveIcon size={16} color={colors.primary} />
                  <Text style={styles.localInfoTitle}>Local Server Disk Storage Active</Text>
                </View>
                <Text style={styles.localInfoDesc}>
                  All chat documents and images are stored securely on the hosting server in the local directory.
                </Text>
                <Text style={styles.localInfoMuted}>Zero cloud API configuration required.</Text>
              </View>
            )}

            {/* 5. GOOGLE CLOUD STORAGE (GCS) */}
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
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.testBtnText}>Testing Cloud Connection...</Text>
                    </>
                  ) : (
                    <>
                      <CheckIcon size={14} color={colors.primary} />
                      <Text style={styles.testBtnText}>
                        Test {driver === 'ONEDRIVE' ? 'OneDrive' : driver === 'MICROSOFT' ? 'Microsoft Cloud' : driver === 'GDRIVE' ? 'Google Drive' : 'GCS'} Connection
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
                      <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                      <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },

  /* ── Full-Screen Storage Workspace ── */
  fullScreenWorkspace: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  activeStatusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: spacing.md,
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

  /* ── Storage Driver Selection Section ── */
  driverSelectionSection: {
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: fontWeights.extrabold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  horizontalCardsScrollView: {
    marginHorizontal: -18,
  },
  horizontalCardsScroll: {
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  boxCard: {
    width: 150,
    minHeight: 175,
    borderRadius: 16,
    padding: 13,
    justifyContent: 'space-between',
  },
  boxCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  boxIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCheckWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxRadioWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  boxCardTitle: {
    fontSize: 14,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  boxBadgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginBottom: 6,
  },
  boxBadgeText: {
    fontSize: 9.5,
    fontWeight: fontWeights.black,
    letterSpacing: 0.3,
  },
  boxCardSubtext: {
    fontSize: 10.5,
    color: colors.textMuted,
    lineHeight: 14,
  },

  /* ── Main Form Card ── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  driverConfigBox: {
    paddingTop: spacing.xs,
  },

  /* ── Guide Boxes ── */
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
  guideCalloutGreen: {
    backgroundColor: '#ecfdf5',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    gap: 3,
  },
  guideTitleGreen: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    color: '#047857',
    marginBottom: 2,
  },
  guideStepGreen: {
    fontSize: 10.5,
    color: '#065f46',
    lineHeight: 15,
  },

  /* ── OneDrive Status Cards ── */
  onedriveStatusConnected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  onedriveStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  onedriveStatusIconWrapGreen: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onedriveStatusTextCol: {
    flex: 1,
  },
  onedriveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onedriveConnectedTitle: {
    fontSize: 12,
    fontWeight: fontWeights.extrabold,
    color: '#064e3b',
  },
  readyBadgePill: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  readyBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    color: '#065f46',
  },
  onedriveConnectedSubtext: {
    fontSize: 10.5,
    color: '#047857',
    marginTop: 1,
  },
  reconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  reconnectBtnText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    color: '#065f46',
  },
  onedriveStatusUnlinked: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onedriveStatusIconWrapAmber: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onedriveUnlinkedTitle: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    color: '#78350f',
  },
  onedriveUnlinkedSubtext: {
    fontSize: 10,
    color: '#92400e',
    marginTop: 1,
    lineHeight: 14,
  },
  connectOneDriveBtn: {
    height: 42,
    borderRadius: borderRadius.lg,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  connectOneDriveBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },

  /* ── Form Inputs ── */
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
    color: colors.primary,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm + 4,
    height: 42,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    fontSize: 11,
    color: colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  fontMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fieldHelperText: {
    fontSize: 10.5,
    color: colors.textLight,
    marginTop: 4,
    lineHeight: 14,
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
    color: colors.primary,
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
