import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
import { DepartmentMasterScreen } from '../screens/admin/DepartmentMasterScreen';
import { CloudStorageMasterScreen } from '../screens/admin/CloudStorageMasterScreen';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
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

  useEffect(() => {
    initialize();
  }, [initialize]);

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
                <Stack.Screen name="DepartmentMaster" component={DepartmentMasterScreen} />
                <Stack.Screen name="CloudStorageMaster" component={CloudStorageMasterScreen} />
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
