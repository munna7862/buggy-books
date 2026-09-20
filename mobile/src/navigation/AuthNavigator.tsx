import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const StackNavigator = Stack.Navigator as unknown as React.ComponentType<any>;
const StackScreen = Stack.Screen as unknown as React.ComponentType<any>;

export function AuthNavigator() {
  return (
    <StackNavigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <StackScreen name="Login" component={LoginScreen} />
      <StackScreen name="Register" component={RegisterScreen} />
    </StackNavigator>
  );
}
