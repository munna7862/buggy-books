import { API_ROUTES } from '@buggybooks/contracts';
import { ApiError, apiRequest, getBaseUrl } from '../api/client';
import { installFakeBackend } from '../test-utils/fakeBackend';

describe('apiRequest', () => {
  it('sends the contract method and path to the configured base URL', async () => {
    const { requests } = installFakeBackend();
    await apiRequest(API_ROUTES.books);

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ method: 'GET', path: '/api/books' });
  });

  it('adds a Bearer header only when a token is given', async () => {
    const { requests } = installFakeBackend();
    await apiRequest(API_ROUTES.profile, { token: 'access-token' });
    await apiRequest(API_ROUTES.books);

    expect(requests[0]?.headers.Authorization).toBe('Bearer access-token');
    expect(requests[1]?.headers.Authorization).toBeUndefined();
  });

  it('turns an error response into an ApiError with the server message and status', async () => {
    installFakeBackend();
    await expect(apiRequest(API_ROUTES.login, { body: { username: 'nobody', password: 'x' } })).rejects.toEqual(
      expect.objectContaining({ name: 'ApiError', status: 401, message: 'Unauthorized: Invalid credentials' }),
    );
  });

  it('reports an unreachable server as status 0', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;
    const error = await apiRequest(API_ROUTES.books).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, message: 'Cannot reach the BuggyBooks server' });
  });

  it('defaults to the Android emulator host when EXPO_PUBLIC_API_URL is not set', () => {
    const original = process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(getBaseUrl()).toBe('http://10.0.2.2:4000');
    process.env.EXPO_PUBLIC_API_URL = original;
  });
});
