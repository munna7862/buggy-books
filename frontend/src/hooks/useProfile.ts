import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';

export function useProfile() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProfile();
      setUsername(data.username);
      setFullName(data.fullName);
      setAvatarUrl(data.avatarUrl);
    } catch (err: any) {
      console.error('Failed to load profile details:', err);
      toast.error('Unable to fetch profile details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const uploadAvatar = useCallback(async (file: File) => {
    setUploading(true);
    setUploadStatus('');
    setUploadError('');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const data = await api.uploadAvatar(formData);
      setAvatarUrl(data.avatarUrl);
      setUploadStatus('Avatar updated successfully!');
      toast.success('Avatar uploaded successfully!');
      return data.avatarUrl;
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setUploadError(err.message || 'Failed to upload avatar');
      toast.error(err.message || 'Failed to upload avatar');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    username,
    fullName,
    avatarUrl,
    loading,
    uploading,
    uploadError,
    uploadStatus,
    setUploadStatus,
    setUploadError,
    uploadAvatar,
    refreshProfile: fetchProfile
  };
}
