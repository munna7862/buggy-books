import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MOBILE_TEST_IDS } from '@buggybooks/contracts';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { BookDetailScreen } from './src/screens/BookDetailScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { colors } from './src/theme';

function SignedOutRoot() {
  const [registering, setRegistering] = useState(false);
  const showLogin = useCallback(() => setRegistering(false), []);
  return registering ? <RegisterScreen onShowLogin={showLogin} /> : <LoginScreen onShowRegister={() => setRegistering(true)} />;
}

function SignedInRoot() {
  const [bookId, setBookId] = useState<string | null>(null);
  const closeBook = useCallback(() => setBookId(null), []);
  return (
    <>
      {/* The catalog stays mounted so search text and scroll position survive a visit to a book. */}
      <View style={bookId ? styles.hidden : styles.fill}>
        <CatalogScreen onOpenBook={setBookId} />
      </View>
      {bookId ? <BookDetailScreen bookId={bookId} onBack={closeBook} /> : null}
    </>
  );
}

function Root() {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return (
      <View style={styles.loading} testID={MOBILE_TEST_IDS.app.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  return state.status === 'signedIn' ? <SignedInRoot /> : <SignedOutRoot />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.fillBackground}>
        <StatusBar style="light" />
        <AuthProvider>
          <Root />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { display: 'none' },
  fillBackground: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
