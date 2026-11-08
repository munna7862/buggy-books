import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { API_ROUTES, MOBILE_TEST_IDS, SEEDED_USERS, bookRowTestId } from '@buggybooks/contracts';
import App from '../../App';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { type FakeBook, installFakeBackend } from '../test-utils/fakeBackend';

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const { login, register, catalog, bookDetail } = MOBILE_TEST_IDS;

function storeSession(token = 'access-token', refreshToken = 'refresh-token') {
  store.set('buggybooks.accessToken', token);
  store.set('buggybooks.refreshToken', refreshToken);
}

const manyBooks: FakeBook[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  title: `Book number ${i + 1}`,
  author: 'An Author',
  price: 10,
}));

beforeEach(() => {
  store.clear();
});

describe('Registration (MOB_M1_01)', () => {
  async function fillAndSubmit(username: string) {
    await render(<App />);
    await fireEvent.press(await screen.findByTestId(login.registerLink));
    await fireEvent.changeText(screen.getByTestId(register.fullName), 'New Reader');
    await fireEvent.changeText(screen.getByTestId(register.username), username);
    await fireEvent.changeText(screen.getByTestId(register.password), 'a-password');
    await fireEvent.press(screen.getByTestId(register.submit));
  }

  it('creates the account, stores the tokens and shows the catalog', async () => {
    const { requests } = installFakeBackend();
    await fillAndSubmit('new-reader');

    expect(await screen.findByTestId(catalog.welcome)).toHaveTextContent('Signed in as new-reader');
    expect(requests.find((r) => r.path === API_ROUTES.register.path)?.body).toEqual({
      username: 'new-reader',
      password: 'a-password',
      fullName: 'New Reader',
    });
    expect(store.get('buggybooks.refreshToken')).toBe('refresh-token');
  });

  it('shows the conflict error for a username that is taken', async () => {
    installFakeBackend();
    await fillAndSubmit(SEEDED_USERS.testuser.username);

    expect(await screen.findByTestId(register.error)).toHaveTextContent('Conflict: Username already exists');
    expect(store.size).toBe(0);
  });

  it('returns to the login screen from the link', async () => {
    installFakeBackend();
    await render(<App />);
    await fireEvent.press(await screen.findByTestId(login.registerLink));
    await fireEvent.press(screen.getByTestId(register.loginLink));

    expect(screen.getByTestId(login.screen)).toBeOnTheScreen();
  });
});

describe('Silent refresh (MOB_M1_02)', () => {
  it('refreshes a rejected access token at launch and stores the rotated pair', async () => {
    const { requests } = installFakeBackend();
    storeSession('expired-token');
    await render(<App />);

    expect(await screen.findByTestId(catalog.welcome)).toHaveTextContent('Signed in as testuser');
    expect(requests.find((r) => r.path === API_ROUTES.refresh.path)?.body).toEqual({ refreshToken: 'refresh-token' });
    expect(store.get('buggybooks.accessToken')).toBe('access-token-1');
    expect(store.get('buggybooks.refreshToken')).toBe('refresh-token-1');
  });

  it('shares one refresh between concurrent requests', async () => {
    const { requests, expireAccessToken } = installFakeBackend();
    storeSession();
    let auth: ReturnType<typeof useAuth> | undefined;

    function Probe() {
      auth = useAuth();
      return null;
    }

    await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(auth?.state.status).toBe('signedIn'));
    expireAccessToken();

    const results = await Promise.all([auth!.authedRequest(API_ROUTES.profile), auth!.authedRequest(API_ROUTES.profile)]);

    expect(results).toHaveLength(2);
    expect(requests.filter((r) => r.path === API_ROUTES.refresh.path)).toHaveLength(1);
  });

  it('signs out when a mid-session refresh is rejected', async () => {
    const { expireAccessToken } = installFakeBackend({ refreshRejected: true });
    storeSession();
    let auth: ReturnType<typeof useAuth> | undefined;

    function Probe() {
      auth = useAuth();
      return null;
    }

    await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(auth?.state.status).toBe('signedIn'));
    expireAccessToken();

    await expect(auth!.authedRequest(API_ROUTES.profile)).rejects.toThrow('Forbidden');

    await waitFor(() => expect(auth?.state.status).toBe('signedOut'));
    expect(store.size).toBe(0);
  });
});

describe('Sign out (MOB_M1_03)', () => {
  it('sends the refresh token so the server can revoke the session', async () => {
    const { requests } = installFakeBackend();
    storeSession();
    await render(<App />);

    await fireEvent.press(await screen.findByTestId(catalog.logout));

    expect(await screen.findByTestId(login.screen)).toBeOnTheScreen();
    expect(requests.find((r) => r.path === API_ROUTES.logout.path)?.body).toEqual({ refreshToken: 'refresh-token' });
  });
});

describe('Catalog (MOB_M1_04)', () => {
  it('lists the first page and loads the next one on request', async () => {
    const { requests } = installFakeBackend({ books: manyBooks });
    storeSession();
    await render(<App />);

    expect(await screen.findByText('10 books in the catalog')).toBeOnTheScreen();
    expect(screen.getByTestId(bookRowTestId('8'))).toBeOnTheScreen();
    expect(screen.queryByTestId(bookRowTestId('9'))).toBeNull();

    await fireEvent.press(screen.getByTestId(catalog.loadMore));

    expect(await screen.findByTestId(bookRowTestId('9'))).toBeOnTheScreen();
    expect(screen.getByTestId(bookRowTestId('1'))).toBeOnTheScreen();
    expect(screen.queryByTestId(catalog.loadMore)).toBeNull();
    expect(requests.filter((r) => r.path === API_ROUTES.books.path).map((r) => r.query.page)).toEqual(['1', '2']);
  });

  it('searches on the server and shows an empty state when nothing matches', async () => {
    const { requests } = installFakeBackend();
    storeSession();
    await render(<App />);
    await screen.findByTestId(bookRowTestId('1'));

    await fireEvent.changeText(screen.getByTestId(catalog.search), 'refactor');

    expect(await screen.findByText('1 book in the catalog')).toBeOnTheScreen();
    expect(screen.queryByTestId(bookRowTestId('1'))).toBeNull();
    expect(requests.at(-1)?.query).toMatchObject({ q: 'refactor', page: '1' });

    await fireEvent.changeText(screen.getByTestId(catalog.search), 'no such book');

    expect(await screen.findByTestId(catalog.empty)).toBeOnTheScreen();
  });

  it('ignores a slow response from an older search', async () => {
    const { fetchMock } = installFakeBackend();
    storeSession();
    await render(<App />);
    await screen.findByTestId(bookRowTestId('1'));

    const real = fetchMock.getMockImplementation()!;
    let releaseSlow: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    fetchMock.mockImplementationOnce(async (input, init) => {
      await gate;
      return real(input, init);
    });

    await fireEvent.changeText(screen.getByTestId(catalog.search), 'clean');
    await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('q=clean'));
    await fireEvent.changeText(screen.getByTestId(catalog.search), 'refactor');
    expect(await screen.findByTestId(bookRowTestId('2'))).toBeOnTheScreen();

    releaseSlow();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByTestId(bookRowTestId('2'))).toBeOnTheScreen();
    expect(screen.queryByTestId(bookRowTestId('1'))).toBeNull();
  });

  it('shows an error and recovers on retry', async () => {
    const { fetchMock } = installFakeBackend();
    storeSession();
    const real = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      if (input.includes(API_ROUTES.books.path)) throw new TypeError('Network request failed');
      return real(input, init);
    });
    await render(<App />);

    expect(await screen.findByTestId(catalog.error)).toHaveTextContent('Cannot reach the BuggyBooks server');

    fetchMock.mockImplementation(real);
    await fireEvent.press(screen.getByTestId(catalog.retry));

    expect(await screen.findByTestId(bookRowTestId('1'))).toBeOnTheScreen();
  });
});

describe('Book detail (MOB_M1_05)', () => {
  it('opens a book from the catalog and goes back to it', async () => {
    installFakeBackend();
    storeSession();
    await render(<App />);

    await fireEvent.press(await screen.findByTestId(bookRowTestId('1')));

    expect(await screen.findByTestId(bookDetail.title)).toHaveTextContent('Clean Code');
    expect(screen.getByTestId(bookDetail.author)).toHaveTextContent('Robert Martin');
    expect(screen.getByTestId(bookDetail.price)).toHaveTextContent('$30.00');
    expect(screen.getByTestId(bookDetail.stock)).toHaveTextContent('4 in stock');
    expect(screen.getByTestId(bookDetail.description)).toHaveTextContent('On craftsmanship.');

    await fireEvent.press(screen.getByTestId(bookDetail.back));

    expect(screen.queryByTestId(bookDetail.screen)).toBeNull();
    expect(screen.getByTestId(bookRowTestId('1'))).toBeOnTheScreen();
  });

  it('shows out of stock when none are left', async () => {
    installFakeBackend();
    storeSession();
    await render(<App />);

    await fireEvent.press(await screen.findByTestId(bookRowTestId('2')));

    expect(await screen.findByTestId(bookDetail.stock)).toHaveTextContent('Out of stock');
  });
});
