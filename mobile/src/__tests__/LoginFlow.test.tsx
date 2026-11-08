import { fireEvent, render, screen } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { MOBILE_TEST_IDS, SEEDED_USERS } from '@buggybooks/contracts';
import App from '../../App';
import { installFakeBackend } from '../test-utils/fakeBackend';

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const { login, catalog } = MOBILE_TEST_IDS;

beforeEach(() => {
  store.clear();
});

async function signIn(username: string, password: string) {
  await fireEvent.changeText(await screen.findByTestId(login.username), username);
  await fireEvent.changeText(screen.getByTestId(login.password), password);
  await fireEvent.press(screen.getByTestId(login.submit));
}

describe('Login flow (MOB_M0_01, MOB_M0_02)', () => {
  it('shows the login screen when no session is stored', async () => {
    installFakeBackend();
    await render(<App />);
    expect(await screen.findByTestId(login.screen)).toBeOnTheScreen();
  });

  it('signs in a seeded user, stores the tokens and shows the catalog', async () => {
    const { requests } = installFakeBackend();
    const { username, password } = SEEDED_USERS.testuser;
    await render(<App />);

    await signIn(username, password);

    expect(await screen.findByTestId(catalog.welcome)).toHaveTextContent(`Signed in as ${username}`);
    expect(await screen.findByText('2 books in the catalog')).toBeOnTheScreen();
    expect(requests.find((r) => r.path === '/api/login')).toMatchObject({ method: 'POST', body: { username, password } });
    expect(store.get('buggybooks.accessToken')).toBe('access-token');
    expect(store.get('buggybooks.refreshToken')).toBe('refresh-token');
  });

  it('shows the server error and stays on the login screen for bad credentials', async () => {
    installFakeBackend();
    await render(<App />);

    await signIn(SEEDED_USERS.testuser.username, 'wrong-password');

    expect(await screen.findByTestId(login.error)).toHaveTextContent('Unauthorized: Invalid credentials');
    expect(screen.getByTestId(login.screen)).toBeOnTheScreen();
    expect(store.size).toBe(0);
  });

  it('keeps the sign-in button disabled until both fields are filled', async () => {
    const { requests } = installFakeBackend();
    await render(<App />);

    await fireEvent.changeText(await screen.findByTestId(login.username), 'testuser');
    await fireEvent.press(screen.getByTestId(login.submit));

    expect(screen.getByTestId(login.submit)).toBeDisabled();
    expect(requests.some((r) => r.path === '/api/login')).toBe(false);
  });

  it('restores a stored session that the server still accepts', async () => {
    installFakeBackend();
    store.set('buggybooks.accessToken', 'access-token');
    store.set('buggybooks.refreshToken', 'refresh-token');
    await render(<App />);

    expect(await screen.findByTestId(catalog.welcome)).toHaveTextContent('Signed in as testuser');
  });

  it('discards a stored session when the refresh token is also rejected', async () => {
    installFakeBackend({ refreshRejected: true });
    store.set('buggybooks.accessToken', 'expired-token');
    store.set('buggybooks.refreshToken', 'refresh-token');
    await render(<App />);

    expect(await screen.findByTestId(login.screen)).toBeOnTheScreen();
    expect(store.size).toBe(0);
  });

  it('keeps a stored session when the server is unreachable at launch', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;
    store.set('buggybooks.accessToken', 'access-token');
    store.set('buggybooks.refreshToken', 'refresh-token');
    await render(<App />);

    expect(await screen.findByTestId(login.screen)).toBeOnTheScreen();
    expect(store.get('buggybooks.accessToken')).toBe('access-token');
    expect(store.get('buggybooks.refreshToken')).toBe('refresh-token');
  });

  it('shows an error instead of "0 books" when the books response is not paginated', async () => {
    installFakeBackend({ booksResponse: [] });
    await render(<App />);
    await signIn(SEEDED_USERS.testuser.username, SEEDED_USERS.testuser.password);

    expect(await screen.findByTestId(catalog.error)).toHaveTextContent('Unexpected response from the server');
    expect(screen.queryByTestId(catalog.bookCount)).toBeNull();
  });

  it('signs out, clears the tokens and returns to the login screen', async () => {
    const { requests } = installFakeBackend();
    await render(<App />);
    await signIn(SEEDED_USERS.testuser.username, SEEDED_USERS.testuser.password);

    await fireEvent.press(await screen.findByTestId(catalog.logout));

    expect(await screen.findByTestId(login.screen)).toBeOnTheScreen();
    expect(store.size).toBe(0);
    expect(requests.some((r) => r.method === 'POST' && r.path === '/api/logout')).toBe(true);
  });
});
