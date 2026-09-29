import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MessagesSquareIcon, UserIcon } from '../components/icons/SvgIcons';
import { colors, fontWeights } from '../theme';
import { useAuthStore, isUserAdminRole } from '../store/authStore';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Material 3 style capsule icon wrapper
interface TabCapsuleIconProps {
  Icon: React.ComponentType<{ size: number; color: string }>;
  focused: boolean;
  activeColor?: string;
  activeBgColor?: string;
}

const TabCapsuleIcon: React.FC<TabCapsuleIconProps> = ({
  Icon,
  focused,
  activeColor = colors.primary,
  activeBgColor = colors.primaryMuted,
}) => (
  <View
    style={[
      styles.iconCapsule,
      focused && [styles.iconCapsuleActive, { backgroundColor: activeBgColor }],
    ]}
  >
    <Icon size={20} color={focused ? activeColor : colors.textMuted} />
  </View>
);

export const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const isAdmin = isUserAdminRole(user);

  // Dynamic bottom inset ensuring tabs sit fully above the gesture handle line and 3-button navigation bar
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 0);

  return (
    <Tab.Navigator
      initialRouteName="ChatTab"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarButton: (props) => (
          <Pressable
            {...props}
            android_ripple={{ color: 'transparent' }}
            style={props.style}
          >
            {props.children}
          </Pressable>
        ),
        tabBarItemStyle: {
          backgroundColor: '#ffffff',
        },
        tabBarStyle: [
          styles.tabBar,
          {
            height: 62 + bottomInset,
            paddingBottom: Math.max(bottomInset, 8),
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
     
      <Tab.Screen
        name="ChatTab"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ focused }) => (
            <TabCapsuleIcon Icon={MessagesSquareIcon} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabCapsuleIcon Icon={UserIcon} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 6,
    elevation: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    marginTop: 2,
  },
  iconCapsule: {
    width: 58,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconCapsuleActive: {
    backgroundColor: colors.primaryMuted,
  },
});
