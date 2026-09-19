import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from './Profile';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as profileHook from '../hooks/useProfile';

describe('Profile Component', () => {
  const mockUploadAvatar = vi.fn();
  const mockSetUploadStatus = vi.fn();
  const mockSetUploadError = vi.fn();
  const mockRefreshProfile = vi.fn();

  const defaultHookValues = {
    username: 'john_doe',
    fullName: 'John Doe',
    avatarUrl: null,
    loading: false,
    uploading: false,
    uploadError: '',
    uploadStatus: '',
    setUploadStatus: mockSetUploadStatus,
    setUploadError: mockSetUploadError,
    uploadAvatar: mockUploadAvatar,
    refreshProfile: mockRefreshProfile,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(profileHook, 'useProfile').mockReturnValue({ ...defaultHookValues });
  });

  it('renders profile details with default avatar', () => {
    render(<Profile />);

    expect(screen.getByRole('heading', { name: /user profile/i })).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john_doe')).toBeInTheDocument();

    const avatarImg = screen.getByAltText('Profile Avatar') as HTMLImageElement;
    expect(avatarImg.src).toContain('data:image/svg+xml');
  });

  it('renders custom relative avatar url with server prefix', () => {
    vi.spyOn(profileHook, 'useProfile').mockReturnValue({
      ...defaultHookValues,
      avatarUrl: '/uploads/avatar1.png',
    });

    render(<Profile />);

    const avatarImg = screen.getByAltText('Profile Avatar') as HTMLImageElement;
    expect(avatarImg.src).toContain('/uploads/avatar1.png');
  });

  it('renders absolute avatar url directly', () => {
    vi.spyOn(profileHook, 'useProfile').mockReturnValue({
      ...defaultHookValues,
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    render(<Profile />);

    const avatarImg = screen.getByAltText('Profile Avatar') as HTMLImageElement;
    expect(avatarImg.src).toBe('https://example.com/avatar.jpg');
  });

  it('disables upload button when no file is selected', () => {
    render(<Profile />);

    const uploadBtn = screen.getByRole('button', { name: /upload image/i });
    expect(uploadBtn).toBeDisabled();
  });

  it('handles file selection and enables upload button', async () => {
    const user = userEvent.setup();
    render(<Profile />);

    const fileInput = document.getElementById('profile-avatar-input') as HTMLInputElement;
    const file = new File(['image bytes'], 'test-avatar.png', { type: 'image/png' });

    await user.upload(fileInput, file);

    expect(mockSetUploadStatus).toHaveBeenCalledWith('');
    expect(mockSetUploadError).toHaveBeenCalledWith('');

    const uploadBtn = screen.getByRole('button', { name: /upload image/i });
    expect(uploadBtn).not.toBeDisabled();
  });

  it('submits file upload and resets form on success', async () => {
    const user = userEvent.setup();
    mockUploadAvatar.mockResolvedValue('/uploads/new.png');

    render(<Profile />);

    const fileInput = document.getElementById('profile-avatar-input') as HTMLInputElement;
    const file = new File(['image content'], 'avatar.png', { type: 'image/png' });

    await user.upload(fileInput, file);

    const form = fileInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith(file);
      expect(fileInput.value).toBe('');
    });
  });

  it('handles upload failure gracefully in submit handler', async () => {
    const user = userEvent.setup();
    mockUploadAvatar.mockRejectedValue(new Error('Upload rejected'));

    render(<Profile />);

    const fileInput = document.getElementById('profile-avatar-input') as HTMLInputElement;
    const file = new File(['image content'], 'bad-avatar.png', { type: 'image/png' });

    await user.upload(fileInput, file);

    const form = fileInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith(file);
    });
  });

  it('displays status banner when uploadStatus is present', () => {
    vi.spyOn(profileHook, 'useProfile').mockReturnValue({
      ...defaultHookValues,
      uploadStatus: 'Avatar updated successfully!',
    });

    render(<Profile />);

    expect(screen.getByText('Avatar updated successfully!')).toBeInTheDocument();
  });

  it('displays error banner when uploadError is present', () => {
    vi.spyOn(profileHook, 'useProfile').mockReturnValue({
      ...defaultHookValues,
      uploadError: 'Invalid image format',
    });

    render(<Profile />);

    expect(screen.getByText('Invalid image format')).toBeInTheDocument();
  });

  it('shows uploading text on button during upload state', () => {
    vi.spyOn(profileHook, 'useProfile').mockReturnValue({
      ...defaultHookValues,
      uploading: true,
    });

    render(<Profile />);

    expect(screen.getByRole('button', { name: /uploading picture\.\.\./i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /uploading picture\.\.\./i })).toBeDisabled();
  });
});
