import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OfflineBanner } from './src/components/OfflineBanner';

const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#6366f1',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    border: '#334155',
    notification: '#ef4444',
  },
};

const NavContainer = NavigationContainer as unknown as React.ComponentType<{
  theme?: typeof appTheme;
  children?: React.ReactNode;
}>;

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavContainer theme={appTheme}>
            <StatusBar style="light" />
            <OfflineBanner />
            <RootNavigator />
          </NavContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
