import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { apiClient, getBaseUrl } from '../api/client';
import * as Haptics from 'expo-haptics';

interface UserProfileData {
  username: string;
  fullName?: string;
  avatarUrl?: string;
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<UserProfileData>('/api/profile')
      .then((res) => {
        if (isMounted && res.data) {
          setProfile(res.data);
          if (res.data.avatarUrl) {
            setAvatarUrl(res.data.avatarUrl);
          }
        }
      })
      .catch(() => {
        // Fallback to AuthContext user if profile endpoint is unreachable
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChooseImageSource = () => {
    Alert.alert('Update Avatar', 'Choose an option to update your profile photo:', [
      {
        text: 'Take Photo',
        onPress: handleTakePhoto,
      },
      {
        text: 'Choose from Gallery',
        onPress: handlePickFromGallery,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is required to take an avatar photo. Please enable permissions in your device settings.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatarAsset(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Unable to access camera.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Photo library access is required to choose an avatar. Please enable permissions in your device settings.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatarAsset(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Unable to open photo library.');
    }
  };

  const uploadAvatarAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    // Security audit: check 2MB limit before dispatch
    if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Selected image exceeds the 2MB size limit. Please choose a smaller image.');
      return;
    }

    setIsUploading(true);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium)?.catch?.(() => {});

    try {
      const formData = new FormData();
      const fileName = asset.fileName || `avatar_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';

      formData.append('avatar', {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as unknown as Blob);

      // Omit Content-Type header so Axios allows the native runtime to compute boundary
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        avatarUrl: string;
      }>('/api/profile/upload', formData);

      if (response.data.avatarUrl) {
        setAvatarUrl(response.data.avatarUrl);
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success)?.catch?.(() => {});
        Alert.alert('Success', 'Your profile avatar has been updated!');
      }
    } catch (err: unknown) {
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error)?.catch?.(() => {});
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const message =
        axiosErr.response?.data?.error || 'Failed to upload avatar. Please try again.';
      Alert.alert('Upload Error', message);
    } finally {
      setIsUploading(false);
    }
  };

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

  const displayName = profile?.fullName || user?.fullName || user?.username || 'BuggyBooks Reader';
  const displayUsername = profile?.username || user?.username || 'user';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const resolvedAvatarUri = avatarUrl
    ? avatarUrl.startsWith('http')
      ? avatarUrl
      : `${getBaseUrl()}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar and Profile Heading */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleChooseImageSource}
            disabled={isUploading}
            testID="btn-change-avatar"
            accessibilityLabel="Change profile avatar"
            accessibilityRole="button"
          >
            {isUploading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            ) : resolvedAvatarUri ? (
              <Image
                source={{ uri: resolvedAvatarUri }}
                style={styles.avatarImage}
                testID="profile-avatar-image"
              />
            ) : (
              <View style={styles.avatarPlaceholder} testID="profile-avatar-initials">
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}

            <View style={styles.editBadge} testID="avatar-edit-badge">
              <Text style={styles.editBadgeIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.fullName} testID="profile-fullname">
            {displayName}
          </Text>
          <Text style={styles.username} testID="profile-username">
            @{displayUsername}
          </Text>
          <Text style={styles.avatarHint}>Tap avatar to update photo</Text>
        </View>

        {/* Account Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>👤 Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{displayUsername}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{displayName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Status</Text>
            <Text style={styles.activeBadge}>Active Reader</Text>
          </View>
        </View>

        {/* Security & Token Storage Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🔐 Security & Hardware Storage</Text>

          <View style={styles.badgeRow}>
            <View style={styles.securityBadge}>
              <Text style={styles.securityBadgeText}>KeyStore Protected</Text>
            </View>
            <View style={styles.securityBadge}>
              <Text style={styles.securityBadgeText}>Expo SecureStore</Text>
            </View>
          </View>

          <Text style={styles.securityDesc}>
            Your authentication session is hardware-encrypted on this device. Access tokens rotate
            automatically via serialized mutex queues upon expiration.
          </Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
          testID="btn-logout"
          accessibilityRole="button"
          accessibilityLabel="Sign out of BuggyBooks"
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#334155',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '800',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#0f172a',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadgeIcon: {
    fontSize: 16,
  },
  avatarHint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#818cf8',
    fontWeight: '600',
  },
  card: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  securityBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  securityBadgeText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
  },
  securityDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
