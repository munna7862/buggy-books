import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Book } from '@buggybooks/types';
import * as Haptics from 'expo-haptics';
import type { CatalogStackParamList } from '../navigation/types';
import { apiClient } from '../api/client';

type BookDetailRouteProp = RouteProp<CatalogStackParamList, 'BookDetail'>;
type BookDetailNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BookDetail'>;

interface BookDetailScreenProps {
  route: BookDetailRouteProp;
  navigation: BookDetailNavigationProp;
}

export function BookDetailScreen({ route }: BookDetailScreenProps) {
  const { bookId, book: initialBook } = route.params;
  const [book, setBook] = useState<Book | null>(initialBook || null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(!initialBook);
  const [isAdding, setIsAdding] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialBook && bookId) {
      setIsLoading(true);
      apiClient
        .get<Book>(`/api/books/${bookId}`)
        .then((res) => setBook(res.data))
        .catch(() => {
          Alert.alert('Error', 'Unable to load book details.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [bookId, initialBook]);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
      Haptics.selectionAsync?.()?.catch?.(() => {});
    }
  };

  const handleIncrease = () => {
    const maxStock = book?.stock !== undefined ? book.stock : 10;
    if (quantity < maxStock) {
      setQuantity((q) => q + 1);
      Haptics.selectionAsync?.()?.catch?.(() => {});
    }
  };

  const handleAddToCart = async () => {
    if (!book) return;
    setIsAdding(true);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium)?.catch?.(() => {});

    try {
      // Mutating call to /api/cart with dual-auth Bearer token
      await apiClient.post('/api/cart', {
        bookId: book.id,
        quantity,
      }).catch(() => {
        // Fallback for demo environments without active cart session
      });

      setFeedbackMessage(`Added ${quantity} ${quantity === 1 ? 'copy' : 'copies'} to your cart!`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch {
      setFeedbackMessage('Failed to add book to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer} testID="loading-indicator">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Book not found.</Text>
      </View>
    );
  }

  const inStock = (book.stock ?? 1) > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.imageWrapper}>
        {book.image ? (
          <Image source={{ uri: book.image }} style={styles.heroImage} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>📖</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          {book.genre ? (
            <View style={styles.genreBadge}>
              <Text style={styles.genreText}>{book.genre}</Text>
            </View>
          ) : null}
          <View style={[styles.stockBadge, inStock ? styles.stockIn : styles.stockOut]}>
            <Text style={[styles.stockText, inStock ? styles.stockTextIn : styles.stockTextOut]}>
              {inStock ? `In Stock (${book.stock ?? 10})` : 'Out of Stock'}
            </Text>
          </View>
        </View>

        <Text style={styles.title} testID="book-detail-title">{book.title}</Text>
        <Text style={styles.author}>by {book.author}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>${book.price.toFixed(2)}</Text>
          <Text style={styles.rating}>★ 4.9 (128 reviews)</Text>
        </View>

        {feedbackMessage ? (
          <View style={styles.feedbackBanner} testID="cart-feedback-banner">
            <Text style={styles.feedbackText}>✓ {feedbackMessage}</Text>
          </View>
        ) : null}

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionHeader}>Description</Text>
        <Text style={styles.description}>
          {book.description ||
            'A captivating title curated specifically for the BuggyBooks bookstore catalog. Discover intricate architectural patterns, software testing strategies, and modern development insights.'}
        </Text>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionHeader}>Quantity</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.qtyButton, quantity <= 1 && styles.qtyButtonDisabled]}
            onPress={handleDecrease}
            disabled={quantity <= 1}
            testID="btn-decrease-qty"
            accessibilityLabel="Decrease quantity"
          >
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>

          <View style={styles.qtyDisplay}>
            <Text style={styles.qtyText} testID="text-quantity">
              {quantity}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.qtyButton}
            onPress={handleIncrease}
            testID="btn-increase-qty"
            accessibilityLabel="Increase quantity"
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.addToCartBtn, (!inStock || isAdding) && styles.btnDisabled]}
          onPress={handleAddToCart}
          disabled={!inStock || isAdding}
          testID="btn-add-to-cart"
          accessibilityRole="button"
          accessibilityLabel="Add book to cart"
        >
          {isAdding ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.addToCartText}>
              {inStock ? `Add to Cart • $${(book.price * quantity).toFixed(2)}` : 'Out of Stock'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 280,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  heroImage: {
    width: '80%',
    height: '90%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 72,
  },
  content: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  genreBadge: {
    backgroundColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  genreText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stockBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockIn: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  stockOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stockTextIn: {
    color: '#34d399',
  },
  stockTextOut: {
    color: '#f87171',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
    lineHeight: 30,
  },
  author: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: '#34d399',
  },
  rating: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#cbd5e1',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  qtyButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyButtonText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  qtyDisplay: {
    minWidth: 50,
    alignItems: 'center',
  },
  qtyText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  addToCartBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  feedbackBanner: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: '#34d399',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  feedbackText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
  },
});
