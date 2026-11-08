import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { API_ROUTES, MOBILE_TEST_IDS } from '@buggybooks/contracts';
import type { Book } from '@buggybooks/types';
import { apiRequest } from '../api/client';
import { colors } from '../theme';

const ids = MOBILE_TEST_IDS.bookDetail;

export function BookDetailScreen({ bookId, onBack }: { bookId: string; onBack: () => void }) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest<Book>(API_ROUTES.bookById, { params: { id: bookId } })
      .then((data) => {
        if (active) setBook(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load this book');
      });
    return () => {
      active = false;
    };
  }, [bookId, attempt]);

  function retry() {
    setError(null);
    setBook(null);
    setAttempt((current) => current + 1);
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);

  return (
    <View style={styles.container} testID={ids.screen}>
      <Pressable
        testID={ids.back}
        accessibilityRole="button"
        accessibilityLabel="Back to catalog"
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>‹ Catalog</Text>
      </Pressable>

      {error ? (
        <View>
          <Text testID={ids.error} style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {error}
          </Text>
          <Pressable
            testID={ids.retry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            onPress={retry}
            style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      ) : book ? (
        <ScrollView>
          {book.image ? <Image source={{ uri: book.image }} style={styles.image} resizeMode="cover" accessible={false} /> : null}
          <Text testID={ids.title} style={styles.title} accessibilityRole="header">
            {book.title}
          </Text>
          <Text testID={ids.author} style={styles.muted}>
            {book.author}
          </Text>
          <Text testID={ids.price} style={styles.price}>
            ${book.price.toFixed(2)}
          </Text>
          {book.stock !== undefined ? (
            <Text testID={ids.stock} style={styles.muted}>
              {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}
            </Text>
          ) : null}
          {book.description ? (
            <Text testID={ids.description} style={styles.description}>
              {book.description}
            </Text>
          ) : null}
        </ScrollView>
      ) : (
        <ActivityIndicator color={colors.primary} size="large" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  backButton: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center', marginBottom: 8 },
  image: { width: '100%', height: 220, borderRadius: 8, backgroundColor: colors.surface, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  muted: { fontSize: 15, color: colors.muted },
  price: { fontSize: 20, fontWeight: '700', color: colors.text, marginVertical: 12 },
  description: { fontSize: 16, lineHeight: 24, color: colors.text, marginTop: 16 },
  error: { color: colors.danger, fontSize: 14, marginBottom: 12 },
  outlineButton: { borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 48 },
  pressed: { opacity: 0.6 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
