import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out of BuggyBooks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>

        <Text style={styles.fullName} testID="profile-fullname">
          {user?.fullName || user?.username || 'BuggyBooks User'}
        </Text>
        <Text style={styles.username} testID="profile-username">
          @{user?.username || 'user'}
        </Text>

        <View style={styles.securityCard}>
          <Text style={styles.cardTitle}>🔐 Security & Storage</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Hardware SecureStore</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Dual-Auth JWT</Text>
            </View>
          </View>
          <Text style={styles.securityDescription}>
            Your session tokens are hardware-encrypted with `expo-secure-store`. Outgoing API requests
            are authenticated with `Authorization: Bearer` headers.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          testID="btn-logout"
          accessibilityRole="button"
          accessibilityLabel="Log out of BuggyBooks"
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#818cf8',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  fullName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: '#818cf8',
    marginBottom: 24,
  },
  securityCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgeText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  securityDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 10,
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: '700',
  },
});
