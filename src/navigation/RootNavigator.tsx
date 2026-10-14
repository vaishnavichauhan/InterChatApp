import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { MainTabNavigator } from './MainTabNavigator';
import { ChatDetailScreen } from '../screens/chat/ChatDetailScreen';
import { NewChatScreen } from '../screens/chat/NewChatScreen';
import { CreateGroupScreen } from '../screens/chat/CreateGroupScreen';
import { FileViewerScreen } from '../screens/chat/FileViewerScreen';
import { UserMasterScreen } from '../screens/admin/UserMasterScreen';
import { CreateUserScreen } from '../screens/admin/CreateUserScreen';
import { UserTypeMasterScreen } from '../screens/admin/UserTypeMasterScreen';
import { CompanyMasterScreen } from '../screens/admin/CompanyMasterScreen';
import { CreateCompanyScreen } from '../screens/admin/CreateCompanyScreen';
import { DepartmentMasterScreen } from '../screens/admin/DepartmentMasterScreen';
import { CloudStorageMasterScreen } from '../screens/admin/CloudStorageMasterScreen';
import { BulkUserImportScreen } from '../screens/admin/BulkUserImportScreen';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useAppUpdateStore } from '../store/useAppUpdateStore';
import { CURRENT_APP_VERSION, triggerApkDownload } from '../api/appUpdateApi';
import { CompulsoryUpdateModal } from '../components/common/CompulsoryUpdateModal';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../theme';
import { EpoxyHouseBrandLogo } from '../components/common/EpoxyHouseBrandLogo';
import { WatermarkOverlay } from '../components/common/WatermarkOverlay';
import { ToastBanner } from '../components/common/ToastBanner';
import { CallProvider } from '../context/CallContext';
import { IncomingCallModal } from '../components/call/IncomingCallModal';
import { ActiveCallModal } from '../components/call/ActiveCallModal';
import { MinimizedCallBar } from '../components/call/MinimizedCallBar';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const { updateInfo } = useAppUpdateStore();
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const isAlertOpenRef = useRef(false);

  const showUpdateRequiredAlert = useCallback(
    (latestVersion?: string, downloadUrl?: string, apkAvailable?: boolean) => {
      if (isAlertOpenRef.current) return;
      isAlertOpenRef.current = true;

      const currentInfo = useAppUpdateStore.getState().updateInfo;
      const latest = latestVersion || currentInfo?.latestVersion || 'latest';
      const url = downloadUrl !== undefined ? downloadUrl : currentInfo?.downloadUrl;
      const isApk = apkAvailable !== undefined ? apkAvailable : currentInfo?.apkAvailable;

      Alert.alert(
        'Update Required',
        `Update is compulsory. A new version (${latest}) is available. Please update the application to continue.`,
        [
          {
            text: 'Close',
            style: 'cancel',
            onPress: () => {
              isAlertOpenRef.current = false;
            },
          },
          {
            text: 'Update Now',
            onPress: () => {
              isAlertOpenRef.current = false;
              triggerApkDownload(url, isApk, latest);
            },
          },
        ],
        { cancelable: false }
      );
    },
    []
  );

  const checkUpdateAndEnforce = useCallback(async () => {
    try {
      const res = await useAppUpdateStore.getState().checkForUpdates();
      if (res?.updateRequired) {
        // If user is currently authenticated on any screen, log out and show Update Required alert
        if (useAuthStore.getState().isAuthenticated) {
          await useAuthStore.getState().logout();
          showUpdateRequiredAlert(res.latestVersion, res.downloadUrl, res.apkAvailable);
        }
      }
    } catch (err) {
      console.warn('[RootNavigator] Update check error:', err);
    }
  }, [showUpdateRequiredAlert]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initial update check on app launch & AppState listener on foreground return
  useEffect(() => {
    checkUpdateAndEnforce();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkUpdateAndEnforce();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkUpdateAndEnforce]);

  // Periodic update check while user is authenticated on any screen (every 60s)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      checkUpdateAndEnforce();
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkUpdateAndEnforce]);

  useEffect(() => {
    if (isAuthenticated) {
      useChatStore.getState().setupSocketListeners();
      useChatStore.getState().loadConversations(false);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <EpoxyHouseBrandLogo size="lg" variant="dark" />
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <CallProvider>
      <NavigationContainer>
        <View style={styles.rootContainer}>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {!isAuthenticated ? (
              <Stack.Screen name="Auth" component={AuthStack} />
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
                <Stack.Screen
                  name="NewChat"
                  component={NewChatScreen}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                  name="CreateGroup"
                  component={CreateGroupScreen}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                  name="FileViewer"
                  component={FileViewerScreen}
                  options={{ presentation: 'fullScreenModal' }}
                />
                <Stack.Screen name="UserMaster" component={UserMasterScreen} />
                <Stack.Screen name="CreateUser" component={CreateUserScreen} />
                <Stack.Screen name="UserTypeMaster" component={UserTypeMasterScreen} />
                <Stack.Screen name="CompanyMaster" component={CompanyMasterScreen} />
                <Stack.Screen name="CreateCompany" component={CreateCompanyScreen} />
                <Stack.Screen name="DepartmentMaster" component={DepartmentMasterScreen} />
                <Stack.Screen name="CloudStorageMaster" component={CloudStorageMasterScreen} />
                <Stack.Screen name="BulkUserImport" component={BulkUserImportScreen} />
              </>
            )}
          </Stack.Navigator>
          {isAuthenticated && <WatermarkOverlay />}
          <ToastBanner />
          {isAuthenticated && (
            <>
              <IncomingCallModal />
              <ActiveCallModal />
              <MinimizedCallBar />
            </>
          )}
          <CompulsoryUpdateModal
            visible={updateModalVisible}
            latestVersion={updateInfo?.latestVersion}
            currentVersion={CURRENT_APP_VERSION}
            onUpdate={() => {
              setUpdateModalVisible(false);
              triggerApkDownload(
                updateInfo?.downloadUrl,
                updateInfo?.apkAvailable,
                updateInfo?.latestVersion
              );
            }}
            onClose={() => {
              setUpdateModalVisible(false);
            }}
          />
        </View>
      </NavigationContainer>
    </CallProvider>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: fontSizes.display,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
  },
  brandTagline: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: fontWeights.medium,
  },
});
