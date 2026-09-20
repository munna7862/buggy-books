import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CartStackParamList } from './types';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';

const Stack = createNativeStackNavigator<CartStackParamList>();
const StackNavigator = Stack.Navigator as unknown as React.ComponentType<any>;
const StackScreen = Stack.Screen as unknown as React.ComponentType<any>;

export function CartNavigator() {
  return (
    <StackNavigator
      initialRouteName="Cart"
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: '700' },
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <StackScreen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Shopping Cart',
          headerTitleAlign: 'center',
        }}
      />
      <StackScreen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: 'Checkout',
          headerBackTitle: 'Cart',
          headerTitleAlign: 'center',
        }}
      />
    </StackNavigator>
  );
}
