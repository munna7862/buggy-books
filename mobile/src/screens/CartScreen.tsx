import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';

interface CartScreenProps {
  navigation: BottomTabNavigationProp<MainTabParamList, 'CartTab'>;
}

export function CartScreen({ navigation }: CartScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🛒</Text>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>
          Your shopping cart is ready for checkout. Add titles from the catalog to get started.
        </Text>

        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('CatalogTab')}
          testID="btn-browse-catalog"
          accessibilityRole="button"
          accessibilityLabel="Browse books catalog"
        >
          <Text style={styles.browseButtonText}>Explore Catalog</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
