import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { AdminDashboardScreen } from '../screens/dashboard/AdminDashboardScreen';
import { UserHomeScreen } from '../screens/dashboard/UserHomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MessagesSquareIcon, ChartIcon, UserIcon } from '../components/icons/SvgIcons';
import { colors, fontWeights } from '../theme';
import { useAuthStore } from '../store/authStore';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ChatTabIcon = ({ color }: { color: string }) => <MessagesSquareIcon size={22} color={color} />;
const DashboardTabIcon = ({ color }: { color: string }) => <ChartIcon size={22} color={color} />;
const ProfileTabIcon = ({ color }: { color: string }) => <UserIcon size={22} color={color} />;

export const MainTabNavigator = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.username === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      

      <Tab.Screen
        name="DashboardTab"
        component={isAdmin ? AdminDashboardScreen : UserHomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: DashboardTabIcon,
        }}
      />
<Tab.Screen
        name="ChatTab"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ChatTabIcon,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ProfileTabIcon,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
});
