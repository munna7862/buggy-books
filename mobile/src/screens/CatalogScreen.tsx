import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { API_ROUTES, MOBILE_TEST_IDS, bookRowTestId } from '@buggybooks/contracts';
import type { Book, PaginatedBooks } from '@buggybooks/types';
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';

const ids = MOBILE_TEST_IDS.catalog;
const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

async function fetchPage(q: string, page: number): Promise<PaginatedBooks> {
  const data = await apiRequest<PaginatedBooks>(API_ROUTES.books, {
    query: { ...(q ? { q } : {}), page: String(page), limit: String(PAGE_SIZE) },
  });
  if (!Array.isArray(data?.books)) throw new Error('Unexpected response from the server');
  return data;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Could not load books';
}

function countLabel(total: number): string {
  return `${total} ${total === 1 ? 'book' : 'books'} in the catalog`;
}

export function CatalogScreen({ onOpenBook }: { onOpenBook: (bookId: string) => void }) {
  const { state, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PaginatedBooks | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  // Only the newest search may update the list: a slow older response is ignored.
  const latestSearch = useRef(0);
  const isFirstLoad = useRef(true);

  const loadFirstPage = useCallback(async (q: string) => {
    const search = ++latestSearch.current;
    setError(null);
    setLoadMoreError(null);
    setResult(null);
    try {
      const data = await fetchPage(q, 1);
      if (search === latestSearch.current) setResult(data);
    } catch (err) {
      if (search === latestSearch.current) setError(messageOf(err));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadFirstPage(query.trim()), isFirstLoad.current ? 0 : SEARCH_DEBOUNCE_MS);
    isFirstLoad.current = false;
    return () => clearTimeout(timer);
  }, [query, loadFirstPage]);

  async function loadMore() {
    if (!result || loadingMore) return;
    const search = latestSearch.current;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const next = await fetchPage(query.trim(), result.page + 1);
      if (search !== latestSearch.current) return;
      setResult((current) => {
        if (!current) return current;
        const seen = new Set(current.books.map((book) => book.id));
        return { ...next, books: [...current.books, ...next.books.filter((book) => !seen.has(book.id))] };
      });
    } catch (err) {
      if (search === latestSearch.current) setLoadMoreError(messageOf(err));
    } finally {
      setLoadingMore(false);
    }
  }

  const username = state.status === 'signedIn' ? state.username : '';
  const hasMore = result !== null && result.page < result.totalPages;

  function renderBook({ item }: { item: Book }) {
    return (
      <Pressable
        testID={bookRowTestId(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} by ${item.author}`}
        onPress={() => onOpenBook(item.id)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.muted}>{item.author}</Text>
        </View>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container} testID={ids.screen}>
      <View style={styles.header}>
        <Text testID={ids.welcome} style={styles.title} accessibilityRole="header">
          Signed in as {username}
        </Text>
        <Pressable
          testID={ids.logout}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={logout}
          style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </View>

      <TextInput
        testID={ids.search}
        accessibilityLabel="Search books"
        placeholder="Search by title, author or genre"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {error ? (
        <View>
          <Text testID={ids.error} style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {error}
          </Text>
          <Pressable
            testID={ids.retry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            onPress={() => loadFirstPage(query.trim())}
            style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <Text testID={ids.bookCount} style={styles.muted}>
          {result === null ? 'Loading books…' : countLabel(result.total)}
        </Text>
      )}

      {result ? (
        <FlatList
          testID={ids.list}
          style={styles.list}
          data={result.books}
          keyExtractor={(book) => book.id}
          renderItem={renderBook}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text testID={ids.empty} style={styles.muted}>
              No books match your search.
            </Text>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {loadMoreError ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {loadMoreError}
                </Text>
              ) : null}
              {hasMore ? (
                <Pressable
                  testID={ids.loadMore}
                  accessibilityRole="button"
                  accessibilityLabel="Load more books"
                  accessibilityState={{ busy: loadingMore }}
                  disabled={loadingMore}
                  onPress={loadMore}
                  style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
                >
                  {loadingMore ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Load more</Text>}
                </Pressable>
              ) : null}
            </View>
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  list: { flex: 1, marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  price: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  error: { color: colors.danger, fontSize: 14, marginBottom: 12 },
  footer: { paddingVertical: 16 },
  outlineButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  pressed: { opacity: 0.6 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
