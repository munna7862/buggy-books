import { render, screen, waitFor } from '@testing-library/react';
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

// Mock the Shadow DOM OrderSummary to avoid complex test DOM structure
vi.mock('../components/OrderSummary', () => ({
  default: () => <div data-testid="order-summary-mock">Order Summary</div>
}));

describe('Checkout Component rendering', () => {
  it('renders complex checkout form without blowing up DOM locators', () => {
    vi.mocked(api.getCart).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    expect(screen.getByText('Checkout')).toBeInTheDocument();
    
    // Test the form elements maintain their messy classes for QA
    const formElement = document.querySelector('.form-container-xyz');
    expect(formElement).toBeInTheDocument();
    
    const inputElement = document.querySelector('.input-group-rnd-9182');
    expect(inputElement).toBeInTheDocument();
  });

  it('submits checkout form with proper payload', async () => {
    vi.mocked(api.getCart).mockResolvedValue([{ id: '1', title: 'Book', price: 10 }]);
    vi.mocked(api.checkout).mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    // Wait for cart to load so total isn't 0
    await screen.findByTestId('order-summary-mock');

    const firstNameInput = document.querySelector('input[name="txt_f1"]') as HTMLInputElement;
    const lastNameInput = document.querySelector('input[name="txt_f2"]') as HTMLInputElement;
    const cardInput = document.querySelector('input[name="txt_c99"]') as HTMLInputElement;
    const submitBtn = document.querySelector('button[name="btn_submit_rnd"]') as HTMLButtonElement;

    // Simulate filling form
    firstNameInput.value = 'John';
    lastNameInput.value = 'Doe';
    cardInput.value = '1234567812345678';

    // Submit
    submitBtn.click();

    await waitFor(() => {
      expect(api.checkout).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        creditCard: '1234567812345678'
      });
    });
  });
});
