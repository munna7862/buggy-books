import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { API_ROUTES, MOBILE_TEST_IDS } from '@buggybooks/contracts';
import type { Book } from '@buggybooks/types';
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';

const ids = MOBILE_TEST_IDS.catalog;

/** Placeholder catalog for Sprint M0.1: proves a signed-in session against the real API. */
export function CatalogScreen() {
  const { state, logout } = useAuth();
  const [bookCount, setBookCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<Book[]>(API_ROUTES.books)
      .then((books) => {
        if (active) setBookCount(Array.isArray(books) ? books.length : 0);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load books');
      });
    return () => {
      active = false;
    };
  }, []);

  const username = state.status === 'signedIn' ? state.username : '';

  return (
    <View style={styles.container} testID={ids.screen}>
      <Text testID={ids.welcome} style={styles.title} accessibilityRole="header">
        Signed in as {username}
      </Text>

      {error ? (
        <Text testID={ids.error} style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : (
        <Text testID={ids.bookCount} style={styles.body}>
          {bookCount === null ? 'Loading books…' : `${bookCount} books in the catalog`}
        </Text>
      )}

      <Pressable
        testID={ids.logout}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={logout}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12 },
  body: { fontSize: 16, color: colors.muted, marginBottom: 32 },
  error: { color: colors.danger, fontSize: 14, marginBottom: 32 },
  button: { borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  buttonPressed: { opacity: 0.6 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
