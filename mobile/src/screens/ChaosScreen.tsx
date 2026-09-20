import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

export function ChaosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.title}>Chaos Engineering</Text>
        <Text style={styles.subtitle}>
          Mobile Chaos Testing and Resiliency Diagnostics for BuggyBooks.
        </Text>

        <View style={styles.chaosCard}>
          <Text style={styles.cardHeader}>🌪️ Active Chaos Capabilities</Text>
          <View style={styles.item}>
            <Text style={styles.itemTitle}>Network Latency Injection</Text>
            <Text style={styles.itemDesc}>Simulates 2G/3G flaky networks and connection timeouts.</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemTitle}>Silent Token Expiration</Text>
            <Text style={styles.itemDesc}>Verifies 403 Forbidden interceptor mutex recovery.</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemTitle}>Concurrent Request Storm</Text>
            <Text style={styles.itemDesc}>Validates serialized refresh token queue stability.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  chaosCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 16,
    width: '100%',
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  item: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
