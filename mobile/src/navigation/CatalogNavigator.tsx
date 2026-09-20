import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from './types';
import { CatalogScreen } from '../screens/CatalogScreen';
import { BookDetailScreen } from '../screens/BookDetailScreen';

const Stack = createNativeStackNavigator<CatalogStackParamList>();
const StackNavigator = Stack.Navigator as unknown as React.ComponentType<any>;
const StackScreen = Stack.Screen as unknown as React.ComponentType<any>;

export function CatalogNavigator() {
  return (
    <StackNavigator
      initialRouteName="Catalog"
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: '700' },
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <StackScreen
        name="Catalog"
        component={CatalogScreen}
        options={{
          title: 'BuggyBooks Catalog',
          headerTitleAlign: 'center',
        }}
      />
      <StackScreen
        name="BookDetail"
        component={BookDetailScreen}
        options={{
          title: 'Book Details',
          headerBackTitle: 'Catalog',
        }}
      />
    </StackNavigator>
  );
}
