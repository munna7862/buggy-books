import { render, screen } from '@testing-library/react';
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
});
