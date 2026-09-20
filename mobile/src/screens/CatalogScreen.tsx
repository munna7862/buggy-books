import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Book, PaginatedBooks } from '@buggybooks/types';
import type { CatalogStackParamList } from '../navigation/types';
import { apiClient } from '../api/client';
import { useCart } from '../context/CartContext';
import * as Haptics from 'expo-haptics';

type CatalogScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'Catalog'>;

interface CatalogScreenProps {
  navigation: CatalogScreenNavigationProp;
}

export function CatalogScreen({ navigation }: CatalogScreenProps) {
  const { addToCart } = useCart();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addingBookId, setAddingBookId] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addTimerRef.current) clearTimeout(addTimerRef.current);
    };
  }, []);

  const handleQuickAddToCart = (book: Book) => {
    setAddingBookId(book.id);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium)?.catch?.(() => {});

    // MOB-B3: Dynamic Add-to-Cart delay (500ms - 3500ms, 0ms in test environment)
    const dynamicDelay = process.env.NODE_ENV === 'test' ? 0 : Math.floor(Math.random() * 3000) + 500;

    if (addTimerRef.current) clearTimeout(addTimerRef.current);
    addTimerRef.current = setTimeout(async () => {
      try {
        await addToCart(book.id, 1);
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success)?.catch?.(() => {});
      } catch {
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error)?.catch?.(() => {});
      } finally {
        setAddingBookId(null);
      }
    }, dynamicDelay);
  };

  const fetchBooks = useCallback(async (query: string = '', isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else if (!books.length) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const endpoint = query.trim()
        ? `/api/books?q=${encodeURIComponent(query.trim())}`
        : '/api/books';

      const response = await apiClient.get<PaginatedBooks | Book[]>(endpoint);
      const data = response.data;

      const items: Book[] = Array.isArray(data)
        ? data
        : (data as PaginatedBooks)?.books || [];

      setBooks(items);
    } catch {
      setErrorMessage('Failed to load catalog. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and unmount cleanup
  useEffect(() => {
    fetchBooks();
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchBooks]);

  // Debounced search query
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchBooks(text);
    }, 300);
  };

  const handleRefresh = () => {
    fetchBooks(searchQuery, true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchBooks('');
  };

  const renderBookItem = ({ item }: { item: Book }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookDetail', { bookId: item.id, book: item })}
        testID={`book-card-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${item.title}`}
      >
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>📖</Text>
            </View>
          )}
          {item.genre ? (
            <View style={styles.genreBadge}>
              <Text style={styles.genreText}>{item.genre}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.author}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.bookPrice}>${item.price.toFixed(2)}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ 4.8</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.quickAddButton, addingBookId === item.id && styles.buttonDisabled]}
            onPress={(e) => {
              e?.stopPropagation?.();
              handleQuickAddToCart(item);
            }}
            disabled={addingBookId === item.id}
            testID={`btn_item_${item.id}_add`}
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.title} to cart`}
          >
            {addingBookId === item.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.quickAddButtonText}>+ Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search books by title, author..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={handleSearchChange}
            testID="input-search"
            accessibilityLabel="Search books input"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={handleClearSearch} testID="btn-clear-search">
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorBanner} testID="banner-error">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingCenter} testID="loading-indicator">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Fetching books...</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
              colors={['#6366f1']}
              testID="refresh-control"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer} testID="empty-state">
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyTitle}>No books found</Text>
              {searchQuery ? (
                <Text style={styles.emptySubtitle}>
                  No results for &quot;{searchQuery}&quot;. Try a different keyword.
                </Text>
              ) : (
                <Text style={styles.emptySubtitle}>The bookstore catalog is currently empty.</Text>
              )}
              {searchQuery ? (
                <TouchableOpacity style={styles.clearFilterButton} onPress={handleClearSearch}>
                  <Text style={styles.clearFilterButtonText}>Clear Search Filter</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
  },
  clearText: {
    color: '#94a3b8',
    fontSize: 16,
    padding: 4,
  },
  listContent: {
    padding: 12,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    width: '48%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  genreBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  genreText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  bookPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34d399',
  },
  ratingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  clearFilterButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFilterButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    margin: 12,
    padding: 10,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
  },
  quickAddButton: {
    marginTop: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
