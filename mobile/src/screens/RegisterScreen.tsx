import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { MOBILE_TEST_IDS } from '@buggybooks/contracts';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';

const ids = MOBILE_TEST_IDS.register;

export function RegisterScreen({ onShowLogin }: { onShowLogin: () => void }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onShowLogin();
      return true;
    });
    return () => subscription.remove();
  }, [onShowLogin]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await register({ username: username.trim(), password, fullName: fullName.trim() || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      testID={ids.screen}
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title} accessibilityRole="header">
        Create account
      </Text>

      <Text style={styles.label}>Full name (optional)</Text>
      <TextInput
        testID={ids.fullName}
        accessibilityLabel="Full name"
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
        returnKeyType="next"
      />

      <Text style={styles.label}>Username</Text>
      <TextInput
        testID={ids.username}
        accessibilityLabel="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        returnKeyType="next"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        testID={ids.password}
        accessibilityLabel="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      {error ? (
        <Text testID={ids.error} style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Pressable
        testID={ids.submit}
        accessibilityRole="button"
        accessibilityLabel="Create account"
        accessibilityState={{ disabled: !canSubmit, busy: submitting }}
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={({ pressed }) => [styles.button, (!canSubmit || pressed) && styles.dimmed]}
      >
        {submitting ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Create account</Text>}
      </Pressable>

      <Pressable
        testID={ids.loginLink}
        accessibilityRole="button"
        accessibilityLabel="Back to sign in"
        onPress={onShowLogin}
        style={({ pressed }) => [styles.link, pressed && styles.dimmed]}
      >
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  error: { color: colors.danger, fontSize: 14, marginBottom: 16 },
  button: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  dimmed: { opacity: 0.6 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  linkText: { color: colors.muted, fontSize: 14 },
});
