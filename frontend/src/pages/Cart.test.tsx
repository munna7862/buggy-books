import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Cart from './Cart';
import { api } from '../api';
import { vi } from 'vitest';

vi.mock('../api', () => ({
  api: {
    getCart: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn()
  }
}));

describe('Cart Component rendering', () => {
  it('renders cart mapped beautifully', async () => {
    vi.mocked(api.getCart).mockResolvedValue([
      { id: '1', title: 'Test Cart Book', price: 9.99 }
    ]);

    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Cart Book')).toBeInTheDocument();
    });

    const listElement = document.querySelector('.cart-list');
    expect(listElement).toBeInTheDocument();
  });

  it('allows removing an item', async () => {
    vi.mocked(api.getCart).mockResolvedValue([
      { id: '1', title: 'Test Cart Book', price: 9.99 }
    ]);
    vi.mocked(api.removeFromCart).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Cart Book')).toBeInTheDocument();
    });

    const removeBtn = screen.getByText('✕');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(api.removeFromCart).toHaveBeenCalledWith('1');
      expect(screen.queryByText('Test Cart Book')).not.toBeInTheDocument();
    });
  });

  it('allows clearing the cart', async () => {
    vi.mocked(api.getCart).mockResolvedValue([
      { id: '1', title: 'Test Cart Book', price: 9.99 }
    ]);
    vi.mocked(api.clearCart).mockResolvedValue({ success: true, message: 'Cart cleared' });

    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    const clearBtn = screen.getByText('Clear All');
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(api.clearCart).toHaveBeenCalled();
      expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    });
  });
});
