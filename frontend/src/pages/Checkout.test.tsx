import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Checkout from './Checkout';
import { api } from '../api';
import { vi } from 'vitest';

vi.mock('../api', () => ({
  api: {
    getCart: vi.fn(),
    checkout: vi.fn()
  }
}));

vi.mock('../components/OrderSummary', () => ({
  default: () => <div data-testid="order-summary-mock">Order Summary</div>
}));

describe('Checkout Component Stepper Wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 by default and validates required fields', async () => {
    vi.mocked(api.getCart).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Shipping Details')).toBeInTheDocument();

    // Elements of step 1 are visible
    const firstNameInput = document.querySelector('input[name="txt_f1"]') as HTMLInputElement;
    expect(firstNameInput).toBeInTheDocument();

    // Check stepper indicators
    const stepIndicator1 = document.getElementById('step-indicator-1');
    expect(stepIndicator1).toHaveClass('step-active');

    // Click Next Step immediately to trigger validation errors
    const nextBtn = document.getElementById('wizard-next-btn') as HTMLButtonElement;
    fireEvent.click(nextBtn);

    // Validation messages should appear
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Address must be at least 5 characters')).toBeInTheDocument();
    expect(screen.getByText('City is required')).toBeInTheDocument();
  });

  it('navigates through steps when input is valid', async () => {
    vi.mocked(api.getCart).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    // 1. Fill step 1 inputs
    const firstNameInput = document.querySelector('input[name="txt_f1"]') as HTMLInputElement;
    const lastNameInput = document.querySelector('input[name="txt_f2"]') as HTMLInputElement;
    const addressInput = document.querySelector('input[name="txt_addr_12"]') as HTMLInputElement;
    const cityInput = document.querySelector('input[name="txt_city_34"]') as HTMLInputElement;

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(addressInput, { target: { value: '123 Test Lane' } });
    fireEvent.change(cityInput, { target: { value: 'Test City' } });

    // 2. Click Next
    const nextBtn = document.getElementById('wizard-next-btn') as HTMLButtonElement;
    fireEvent.click(nextBtn);

    // 3. Assert on Step 2
    expect(screen.getByText('Billing & Payment')).toBeInTheDocument();
    const cardInput = document.querySelector('input[name="txt_c99"]') as HTMLInputElement;
    expect(cardInput).toBeInTheDocument();

    // Fill step 2 inputs
    const expInput = document.querySelector('input[name="txt_exp_56"]') as HTMLInputElement;
    const cvvInput = document.querySelector('input[name="txt_cvv_78"]') as HTMLInputElement;

    // Trigger validation error in Step 2
    fireEvent.change(cardInput, { target: { value: 'invalid-card' } });
    fireEvent.change(expInput, { target: { value: '12-30' } });
    fireEvent.change(cvvInput, { target: { value: '99' } });
    fireEvent.click(nextBtn);

    expect(await screen.findByText('Credit card must be exactly 16 digits')).toBeInTheDocument();
    expect(screen.getByText('Expiry date must be in MM/YY format')).toBeInTheDocument();
    expect(screen.getByText('CVV must be exactly 3 digits')).toBeInTheDocument();

    // Fill valid card details
    fireEvent.change(cardInput, { target: { value: '1234567812345678' } });
    fireEvent.change(expInput, { target: { value: '12/30' } });
    fireEvent.change(cvvInput, { target: { value: '999' } });

    // Click Next
    fireEvent.click(nextBtn);

    // 4. Assert on Step 3
    expect(screen.getByText('Review & Confirm')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('**** **** **** 5678')).toBeInTheDocument();
  });

  it('submits checkout form with proper payload on Step 3', async () => {
    vi.mocked(api.getCart).mockResolvedValue([{ id: '1', title: 'Book', price: 10 }]);
    vi.mocked(api.checkout).mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    await screen.findByTestId('order-summary-mock');

    // Fill Step 1
    fireEvent.change(document.querySelector('input[name="txt_f1"]')!, { target: { value: 'John' } });
    fireEvent.change(document.querySelector('input[name="txt_f2"]')!, { target: { value: 'Doe' } });
    fireEvent.change(document.querySelector('input[name="txt_addr_12"]')!, { target: { value: '123 Test Street' } });
    fireEvent.change(document.querySelector('input[name="txt_city_34"]')!, { target: { value: 'Gotham' } });
    fireEvent.click(document.getElementById('wizard-next-btn')!);

    // Fill Step 2
    fireEvent.change(document.querySelector('input[name="txt_c99"]')!, { target: { value: '1111222233334444' } });
    fireEvent.change(document.querySelector('input[name="txt_exp_56"]')!, { target: { value: '12/28' } });
    fireEvent.change(document.querySelector('input[name="txt_cvv_78"]')!, { target: { value: '123' } });
    fireEvent.click(document.getElementById('wizard-next-btn')!);

    // Submit on Step 3
    const submitBtn = document.querySelector('button[name="btn_submit_rnd"]') as HTMLButtonElement;
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.checkout).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        creditCard: '1111222233334444'
      });
    });

    expect(await screen.findByText(/Payment Successful!/)).toBeInTheDocument();
  });
});
