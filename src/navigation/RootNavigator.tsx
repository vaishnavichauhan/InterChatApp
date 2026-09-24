import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
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
import { DepartmentMasterScreen } from '../screens/admin/DepartmentMasterScreen';
import { useAuthStore } from '../store/authStore';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../theme';
import { MessagesSquareIcon } from '../components/icons/SvgIcons';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <MessagesSquareIcon size={32} color="#ffffff" />
        </View>
        <Text style={styles.brandTitle}>
          Inter<Text style={{ color: colors.primary }}>Chat</Text>
        </Text>
        <Text style={styles.brandTagline}>Enterprise Workspace</Text>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
            <Stack.Screen name="DepartmentMaster" component={DepartmentMasterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
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
