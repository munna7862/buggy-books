import React from 'react';
import { Text, Button } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as storage from '../utils/storage';
import { apiClient } from '../api/client';

jest.mock('../utils/storage');
jest.mock('../api/client', () => {
  const actual = jest.requireActual('../api/client');
  return {
    ...actual,
    apiClient: {
      post: jest.fn(),
    },
  };
});

declare const Buffer: {
  from: (str: string, encoding?: string) => {
    toString: (encoding?: string) => string;
  };
};

// Helper to create a fake valid JWT with base64 payload
function createFakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${header}.${body}.fakeSignature`;
}

function TestConsumer() {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();

  if (isLoading) {
    return <Text testID="loading">Loading Session...</Text>;
  }

  return (
    <>
      <Text testID="auth-status">{isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</Text>
      <Text testID="user-name">{user?.username || 'Guest'}</Text>
      <Button
        title="Login"
        testID="btn-login"
        onPress={() => login('alice', 'password123')}
      />
      <Button
        title="Register"
        testID="btn-register"
        onPress={() => register('bob', 'password123', 'Bob Smith')}
      />
      <Button title="Logout" testID="btn-logout" onPress={() => logout()} />
    </>
  );
}

describe('AuthContext Mobile Authentication State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.saveTokens as jest.Mock).mockResolvedValue(undefined);
    (storage.clearTokens as jest.Mock).mockResolvedValue(undefined);
  });

  it('hydrates authenticated session from SecureStore on startup (MOB_AUTH_01)', async () => {
    const fakeToken = createFakeJwt({ username: 'storedUser', fullName: 'Stored User' });
    (storage.getAccessToken as jest.Mock).mockResolvedValue(fakeToken);
    (storage.getRefreshToken as jest.Mock).mockResolvedValue('stored-refresh');

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('Authenticated');
      expect(getByTestId('user-name').props.children).toBe('storedUser');
    });
  });

  it('initializes as unauthenticated when SecureStore is empty', async () => {
    (storage.getAccessToken as jest.Mock).mockResolvedValue(null);
    (storage.getRefreshToken as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('Unauthenticated');
      expect(getByTestId('user-name').props.children).toBe('Guest');
    });
  });

  it('updates state and persists tokens on successful login (MOB_AUTH_01)', async () => {
    (storage.getAccessToken as jest.Mock).mockResolvedValue(null);
    (storage.getRefreshToken as jest.Mock).mockResolvedValue(null);

    const fakeToken = createFakeJwt({ username: 'alice', fullName: 'Alice Liddell' });
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: {
        token: fakeToken,
        refreshToken: 'refresh-alice',
        username: 'alice',
      },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('Unauthenticated');
    });

    fireEvent.press(getByTestId('btn-login'));

    await waitFor(() => {
      expect(storage.saveTokens).toHaveBeenCalledWith(fakeToken, 'refresh-alice');
      expect(getByTestId('auth-status').props.children).toBe('Authenticated');
      expect(getByTestId('user-name').props.children).toBe('alice');
    });
  });

  it('updates state and persists tokens on successful register (MOB_AUTH_03)', async () => {
    (storage.getAccessToken as jest.Mock).mockResolvedValue(null);
    (storage.getRefreshToken as jest.Mock).mockResolvedValue(null);

    const fakeToken = createFakeJwt({ username: 'bob', fullName: 'Bob Smith' });
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: {
        token: fakeToken,
        refreshToken: 'refresh-bob',
        username: 'bob',
      },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('Unauthenticated');
    });

    fireEvent.press(getByTestId('btn-register'));

    await waitFor(() => {
      expect(storage.saveTokens).toHaveBeenCalledWith(fakeToken, 'refresh-bob');
      expect(getByTestId('auth-status').props.children).toBe('Authenticated');
      expect(getByTestId('user-name').props.children).toBe('bob');
    });
  });

  it('clears session and purges tokens on logout (MOB_AUTH_05)', async () => {
    const fakeToken = createFakeJwt({ username: 'alice' });
    (storage.getAccessToken as jest.Mock).mockResolvedValue(fakeToken);
    (storage.getRefreshToken as jest.Mock).mockResolvedValue('refresh-alice');
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Logged out' } });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('Authenticated');
    });

    fireEvent.press(getByTestId('btn-logout'));

    await waitFor(() => {
      expect(storage.clearTokens).toHaveBeenCalled();
      expect(getByTestId('auth-status').props.children).toBe('Unauthenticated');
      expect(getByTestId('user-name').props.children).toBe('Guest');
    });
  });
});
