import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { api } from '../api';
import Catalog from '../pages/Catalog';
import Checkout from '../pages/Checkout';
import { AuthProvider } from '../AuthContext';
import { ChaosProvider } from '../ChaosContext';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MSW API Mocking Test Suite', () => {

  it('MSW_01: Mock Books Endpoint returns the 3 mock books without a real backend', async () => {
    const data = await api.getBooks();
    expect(data.books).toHaveLength(3);
    expect(data.books[0].title).toBe('The Great Buggy Gatsby');
    expect(data.books[1].title).toBe('To Kill a Mockingbird Exception');
    expect(data.books[2].title).toBe('1984 Bugs');
  });

  it('MSW_02: Mock Login Success returns 200 with username for testuser', async () => {
    const response = await api.login('testuser', 'password123');
    expect(response.username).toBe('testuser');
    expect(response.message).toBe('Login successful');
  });

  it('MSW_03: Override Handler Per Test - GET /api/books returns empty array and Catalog renders empty state', async () => {
    server.use(
      http.get('http://localhost:4000/api/books', () => {
        return HttpResponse.json({
          books: [],
          total: 0,
          page: 1,
          totalPages: 1
        });
      })
    );

    render(
      <BrowserRouter>
        <Catalog />
      </BrowserRouter>
    );

    const emptyMsg = await screen.findByText(/no books found/i);
    expect(emptyMsg).toBeInTheDocument();
  });


  it('MSW_04: Override Checkout to Always Fail - POST /api/checkout/process returns 500 and Checkout renders error banner', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.post('http://localhost:4000/api/checkout/process', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error: Payment processor unavailable' },
          { status: 500 }
        );
      })
    );

    render(
      <AuthProvider>
        <ChaosProvider>
          <BrowserRouter>
            <Checkout />
          </BrowserRouter>
        </ChaosProvider>
      </AuthProvider>
    );

    // Step 1: Fill shipping details and click Next Step
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const addressInput = screen.getByPlaceholderText(/123 buggy lane/i);
    const cityInput = screen.getByPlaceholderText(/stack city/i);

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(addressInput, { target: { value: '123 Buggy Lane' } });
    fireEvent.change(cityInput, { target: { value: 'Stack City' } });

    const nextStepBtn = screen.getByRole('button', { name: /next step/i });
    fireEvent.click(nextStepBtn);

    // Step 2: Fill payment details and click Next Step
    const cardInput = await screen.findByPlaceholderText(/16-digit card number/i);
    const expiryInput = screen.getByPlaceholderText(/mm\/yy/i);
    const cvvInput = screen.getByPlaceholderText(/3 digits/i);

    fireEvent.change(cardInput, { target: { value: '4111222233334444' } });
    fireEvent.change(expiryInput, { target: { value: '12/28' } });
    fireEvent.change(cvvInput, { target: { value: '123' } });

    const nextStepPaymentBtn = screen.getByRole('button', { name: /next step/i });
    fireEvent.click(nextStepPaymentBtn);

    // Step 3: Complete Payment
    const completePaymentBtn = await screen.findByRole('button', { name: /complete payment/i });
    fireEvent.click(completePaymentBtn);

    // Assert error banner displays server failure message
    const errorBanner = await screen.findByText(/payment processing failed due to server error/i);
    expect(errorBanner).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

});
