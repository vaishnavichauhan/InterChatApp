import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DeviceRegistrationScreen } from '../screens/auth/DeviceRegistrationScreen';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
   <Stack.Screen name="Welcome" component={WelcomeScreen} /> 
      <Stack.Screen name="Login" component={LoginScreen} /> 
     <Stack.Screen name="DeviceRegistration" component={DeviceRegistrationScreen} /> 
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
    </Stack.Navigator>
  );
};
