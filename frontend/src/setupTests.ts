import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Boot MSW request interception for all component and hook tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
