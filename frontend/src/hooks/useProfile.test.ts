import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfile } from './useProfile';
import { api } from '../api';
import toast from 'react-hot-toast';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  api: {
    getProfile: vi.fn(),
    uploadAvatar: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useProfile Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches profile data successfully on mount', async () => {
    const mockProfile = {
      username: 'alice',
      fullName: 'Alice Smith',
      avatarUrl: '/uploads/alice.png',
    };
    vi.mocked(api.getProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useProfile());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.username).toBe('alice');
      expect(result.current.fullName).toBe('Alice Smith');
      expect(result.current.avatarUrl).toBe('/uploads/alice.png');
    });

    expect(api.getProfile).toHaveBeenCalledTimes(1);
  });

  it('handles error on initial profile fetch', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.getProfile).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith('Unable to fetch profile details');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('allows manual refresh via refreshProfile', async () => {
    const initialProfile = {
      username: 'bob',
      fullName: 'Bob Brown',
      avatarUrl: null,
    };
    const updatedProfile = {
      username: 'bob',
      fullName: 'Bob Brown Jr.',
      avatarUrl: '/uploads/bob.png',
    };

    vi.mocked(api.getProfile)
      .mockResolvedValueOnce(initialProfile)
      .mockResolvedValueOnce(updatedProfile);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.fullName).toBe('Bob Brown');
    });

    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(result.current.fullName).toBe('Bob Brown Jr.');
    expect(result.current.avatarUrl).toBe('/uploads/bob.png');
    expect(api.getProfile).toHaveBeenCalledTimes(2);
  });

  it('handles failure in refreshProfile gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.getProfile)
      .mockResolvedValueOnce({ username: 'user1', fullName: 'User 1', avatarUrl: null })
      .mockRejectedValueOnce(new Error('Refresh failed'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(toast.error).toHaveBeenCalledWith('Unable to fetch profile details');
    expect(result.current.loading).toBe(false);
    consoleSpy.mockRestore();
  });

  it('uploads avatar successfully', async () => {
    vi.mocked(api.getProfile).mockResolvedValue({
      username: 'charlie',
      fullName: 'Charlie Davis',
      avatarUrl: null,
    });
    vi.mocked(api.uploadAvatar).mockResolvedValue({
      success: true,
      message: 'Avatar uploaded',
      avatarUrl: '/uploads/new-avatar.png',
    });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['content'], 'avatar.png', { type: 'image/png' });

    let uploadedUrl: string | undefined;
    await act(async () => {
      uploadedUrl = await result.current.uploadAvatar(file);
    });

    expect(uploadedUrl).toBe('/uploads/new-avatar.png');
    expect(result.current.avatarUrl).toBe('/uploads/new-avatar.png');
    expect(result.current.uploadStatus).toBe('Avatar updated successfully!');
    expect(toast.success).toHaveBeenCalledWith('Avatar uploaded successfully!');
    expect(api.uploadAvatar).toHaveBeenCalledWith(expect.any(FormData));
  });

  it('handles avatar upload failure with Error message and non-Error fallback', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.getProfile).mockResolvedValue({
      username: 'dana',
      fullName: 'Dana White',
      avatarUrl: null,
    });
    vi.mocked(api.uploadAvatar).mockRejectedValueOnce(new Error('File too large'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['dummy'], 'avatar.jpg', { type: 'image/jpeg' });

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.uploadAvatar(file);
      } catch (err) {
        thrownError = err;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('File too large');
    expect(result.current.uploadError).toBe('File too large');
    expect(result.current.uploading).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('File too large');

    // Non-Error fallback test
    vi.mocked(api.uploadAvatar).mockRejectedValueOnce('string error');
    let stringError: unknown;
    await act(async () => {
      try {
        await result.current.uploadAvatar(file);
      } catch (err) {
        stringError = err;
      }
    });

    expect(stringError).toBe('string error');
    expect(result.current.uploadError).toBe('Failed to upload avatar');
    expect(result.current.uploading).toBe(false);

    consoleSpy.mockRestore();
  });

  it('supports directly updating uploadStatus and uploadError', () => {
    vi.mocked(api.getProfile).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useProfile());

    act(() => {
      result.current.setUploadStatus('Custom status');
      result.current.setUploadError('Custom error');
    });

    expect(result.current.uploadStatus).toBe('Custom status');
    expect(result.current.uploadError).toBe('Custom error');
  });
});
