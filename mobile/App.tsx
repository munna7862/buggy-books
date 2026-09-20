import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import type { AuthUser, Book } from '@buggybooks/types';

export default function App() {
  const [activeUser] = useState<AuthUser | null>({
    username: 'mobile_guest',
    type: 'access',
    fullName: 'Guest Reader',
  });

  const [sampleBook] = useState<Book>({
    id: '1',
    title: 'The Clean Architecture Guide',
    author: 'Robert C. Martin',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    genre: 'Architecture',
    stock: 15,
    description: 'A Craftsman Guide to Software Structure and Design.',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.header}>
        <Text style={styles.badge}>BuggyBooks Mobile v1.0</Text>
        <Text style={styles.title}>BuggyBooks</Text>
        <Text style={styles.subtitle}>Cross-Platform Expo Monorepo</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Dual-Auth Session Active</Text>
        <Text style={styles.cardText}>User: {activeUser?.username} ({activeUser?.fullName})</Text>
        <Text style={styles.tokenTag}>Bearer Token Supported</Text>
      </View>

      <View style={styles.bookCard}>
        <Text style={styles.bookTitle}>{sampleBook.title}</Text>
        <Text style={styles.bookAuthor}>By {sampleBook.author}</Text>
        <View style={styles.bookRow}>
          <Text style={styles.bookPrice}>${sampleBook.price.toFixed(2)}</Text>
          <Text style={styles.bookRating}>{sampleBook.genre} • Stock: {sampleBook.stock}</Text>
        </View>
        <TouchableOpacity style={styles.button} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Explore Catalog</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Phase 11: Cross-Platform Mobile App Foundations</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 24,
    alignItems: 'center',
  },
  badge: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 12,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  tokenTag: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '600',
  },
  bookCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 12,
  },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38bdf8',
  },
  bookRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
  },
  button: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  footer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
  },
});
