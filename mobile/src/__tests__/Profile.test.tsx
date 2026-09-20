import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ProfileScreen } from '../screens/ProfileScreen';
import { apiClient } from '../api/client';
import * as ImagePicker from 'expo-image-picker';

const mockLogout = jest.fn();

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      username: 'johndoe',
      fullName: 'John Doe',
    },
    logout: mockLogout,
    isAuthenticated: true,
  }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
  });

  it('renders profile details, username, initials, and security card', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        username: 'johndoe',
        fullName: 'John Doe',
        avatarUrl: null,
      },
    });

    const { getByTestId, getAllByText, getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByTestId('profile-fullname')).toBeTruthy();
      expect(getByTestId('profile-username')).toBeTruthy();
      expect(getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
      expect(getByText('@johndoe')).toBeTruthy();
      expect(getByText('KeyStore Protected')).toBeTruthy();
      expect(getByText('Expo SecureStore')).toBeTruthy();
    });
  });


  it('displays image source selection alert when avatar is tapped', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        username: 'johndoe',
        fullName: 'John Doe',
      },
    });

    const { getByTestId } = render(<ProfileScreen />);

    const avatarBtn = getByTestId('btn-change-avatar');
    fireEvent.press(avatarBtn);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Update Avatar',
      'Choose an option to update your profile photo:',
      expect.any(Array)
    );
  });

  it('uploads avatar from gallery successfully and updates image', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        username: 'johndoe',
        fullName: 'John Doe',
      },
    });

    jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Avatar uploaded successfully',
        avatarUrl: '/uploads/johndoe-123.jpg',
      },
    });

    const { getByTestId } = render(<ProfileScreen />);

    // Trigger change avatar
    fireEvent.press(getByTestId('btn-change-avatar'));

    // Extract Choose from Gallery button callback from Alert.alert mock call
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const updateAvatarCall = alertCalls.find((c) => c[0] === 'Update Avatar');
    const buttons = updateAvatarCall[2];
    const galleryBtn = buttons.find((b: any) => b.text === 'Choose from Gallery');

    await galleryBtn.onPress();

    await waitFor(() => {
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/profile/upload',
        expect.any(FormData)
      );
      expect(getByTestId('profile-avatar-image')).toBeTruthy();
    });
  });

  it('uploads avatar from camera successfully', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        username: 'johndoe',
        fullName: 'John Doe',
      },
    });

    jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Avatar uploaded successfully',
        avatarUrl: '/uploads/johndoe-camera.jpg',
      },
    });

    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId('btn-change-avatar'));

    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const updateAvatarCall = alertCalls.find((c) => c[0] === 'Update Avatar');
    const buttons = updateAvatarCall[2];
    const cameraBtn = buttons.find((b: any) => b.text === 'Take Photo');

    await cameraBtn.onPress();

    await waitFor(() => {
      expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/profile/upload',
        expect.any(FormData)
      );
    });
  });

  it('enforces 2MB file size audit limit and prevents upload', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { username: 'johndoe' },
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///mock/huge.jpg',
          fileName: 'huge.jpg',
          fileSize: 3 * 1024 * 1024, // 3MB > 2MB limit
        },
      ],
    });

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('btn-change-avatar'));

    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const updateAvatarCall = alertCalls.find((c) => c[0] === 'Update Avatar');
    const galleryBtn = updateAvatarCall[2].find((b: any) => b.text === 'Choose from Gallery');

    await galleryBtn.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'File Too Large',
        expect.stringContaining('2MB')
      );
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  it('triggers logout confirmation and invokes logout()', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { username: 'johndoe' },
    });

    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId('btn-logout'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Log Out',
      'Are you sure you want to sign out of BuggyBooks?',
      expect.any(Array)
    );

    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const logoutCall = alertCalls.find((c) => c[0] === 'Log Out');
    const confirmBtn = logoutCall[2].find((b: any) => b.text === 'Log Out');

    await confirmBtn.onPress();

    expect(mockLogout).toHaveBeenCalled();
  });
});
