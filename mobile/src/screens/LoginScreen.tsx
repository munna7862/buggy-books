import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MOBILE_TEST_IDS } from '@buggybooks/contracts';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';

const ids = MOBILE_TEST_IDS.login;

export function LoginScreen({ onShowRegister }: { onShowRegister: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container} testID={ids.screen}>
      <Text style={styles.title} accessibilityRole="header">
        BuggyBooks
      </Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <Text style={styles.label} nativeID="login-username-label">
        Username
      </Text>
      <TextInput
        testID={ids.username}
        accessibilityLabel="Username"
        accessibilityLabelledBy="login-username-label"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        returnKeyType="next"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label} nativeID="login-password-label">
        Password
      </Text>
      <TextInput
        testID={ids.password}
        accessibilityLabel="Password"
        accessibilityLabelledBy="login-password-label"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
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
        accessibilityLabel="Sign in"
        accessibilityState={{ disabled: !canSubmit, busy: submitting }}
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={({ pressed }) => [styles.button, (!canSubmit || pressed) && styles.buttonDimmed]}
      >
        {submitting ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Sign in</Text>}
      </Pressable>

      <Pressable
        testID={ids.registerLink}
        accessibilityRole="button"
        accessibilityLabel="Create an account"
        onPress={onShowRegister}
        style={({ pressed }) => [styles.link, pressed && styles.buttonDimmed]}
      >
        <Text style={styles.linkText}>New here? Create an account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 32 },
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
  buttonDimmed: { opacity: 0.6 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  linkText: { color: colors.muted, fontSize: 14 },
});
