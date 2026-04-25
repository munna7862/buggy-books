import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Cart from './Cart';
import { api } from '../api';
import { vi } from 'vitest';

vi.mock('../api', () => ({
  api: {
    getCart: vi.fn()
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
});
