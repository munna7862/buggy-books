import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MOBILE_TEST_IDS } from '@buggybooks/contracts';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { colors } from './src/theme';

function Root() {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return (
      <View style={styles.loading} testID={MOBILE_TEST_IDS.app.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  return state.status === 'signedIn' ? <CatalogScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <AuthProvider>
          <Root />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
