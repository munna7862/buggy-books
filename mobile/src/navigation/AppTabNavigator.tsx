import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList } from './types';
import { CatalogNavigator } from './CatalogNavigator';
import { CartScreen } from '../screens/CartScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChaosScreen } from '../screens/ChaosScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TabNavigator = Tab.Navigator as unknown as React.ComponentType<any>;
const TabScreen = Tab.Screen as unknown as React.ComponentType<any>;
const IconComponent = Ionicons as unknown as React.ComponentType<any>;

export function AppTabNavigator() {
  return (
    <TabNavigator
      initialRouteName="CatalogTab"
      screenOptions={({ route }: { route: { name: keyof MainTabParamList } }) => ({
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: string;

          switch (route.name) {
            case 'CatalogTab':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'CartTab':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'ChaosTab':
              iconName = focused ? 'flash' : 'flash-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <IconComponent name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <TabScreen
        name="CatalogTab"
        component={CatalogNavigator}
        options={{
          title: 'Catalog',
          headerShown: false,
        }}
      />
      <TabScreen
        name="CartTab"
        component={CartScreen}
        options={{
          title: 'Cart',
          headerTitle: 'Shopping Cart',
        }}
      />
      <TabScreen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
      <TabScreen
        name="ChaosTab"
        component={ChaosScreen}
        options={{
          title: 'Chaos',
          headerTitle: 'Chaos Control',
        }}
      />
    </TabNavigator>
  );
}
