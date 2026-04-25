import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Catalog from './Catalog';
import { api } from '../api';
import { vi } from 'vitest';

// Mock the api module
vi.mock('../api', () => ({
  api: {
    getBooks: vi.fn(),
    addToCart: vi.fn()
  }
}));

describe('Catalog Component grid rendering', () => {
  it('renders the grid layout structure and maps table into cards', async () => {
    // Setup mock data
    const mockBooks = [
      { id: '1', title: 'Test Book 1', author: 'Author One', price: 9.99, image: 'img1.png' },
      { id: '2', title: 'Test Book 2', author: 'Author Two', price: 14.99, image: 'img2.png' }
    ];
    vi.mocked(api.getBooks).mockResolvedValue(mockBooks);

    render(
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>
    );

    expect(screen.getByText('Book Catalog')).toBeInTheDocument();
    
    // Wait for the mock api data to render
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    });

    // Check we preserved the strange class names but they rendered correctly
    const tableElements = document.querySelectorAll('.complex-item-box-alpha');
    expect(tableElements.length).toBe(2);
    expect(tableElements[0].tagName.toLowerCase()).toBe('table');
  });
});
