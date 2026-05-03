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

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('Catalog Component Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders books from a paginated response', async () => {
    const mockData = {
      books: [
        { id: '1', title: 'Test Book 1', author: 'Author One', price: 9.99, image: 'img1.png', genre: 'Classic' },
        { id: '2', title: 'Test Book 2', author: 'Author Two', price: 14.99, image: 'img2.png' }
      ],
      total: 2,
      page: 1,
      totalPages: 1,
      limit: 8
    };
    vi.mocked(api.getBooks).mockResolvedValue(mockData);

    render(
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>
    );

    expect(screen.getByText('Book Catalog')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
      expect(screen.getByText('Classic')).toBeInTheDocument();
    });

    const tableElements = document.querySelectorAll('.complex-item-box-alpha');
    expect(tableElements.length).toBe(2);
  });

  it('filters results when search is performed', async () => {
    const initialData = {
      books: [{ id: '1', title: 'Great Gatsby', author: 'F. Scott', price: 10.99, image: 'g.png' }],
      total: 1, page: 1, totalPages: 1, limit: 8
    };
    const filteredData = {
      books: [{ id: '2', title: '1984', author: 'George Orwell', price: 12, image: '1984.png' }],
      total: 1, page: 1, totalPages: 1, limit: 8
    };

    vi.mocked(api.getBooks)
      .mockResolvedValueOnce(initialData)
      .mockResolvedValueOnce(filteredData);

    render(
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Great Gatsby')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/search by title/i);
    const searchBtn = screen.getByRole('button', { name: /search/i });

    import('@testing-library/react').then(({ fireEvent }) => {
      fireEvent.change(searchInput, { target: { value: '1984' } });
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(api.getBooks).toHaveBeenCalledWith(expect.objectContaining({ q: '1984' }));
      expect(screen.getByText('1984')).toBeInTheDocument();
    });
  });

  it('changes page when pagination buttons are clicked', async () => {
    const page1Data = {
      books: Array(8).fill(null).map((_, i) => ({ id: `${i}`, title: `Book ${i}`, author: 'A', price: 1, image: 'i.png' })),
      total: 15, page: 1, totalPages: 2, limit: 8
    };
    const page2Data = {
      books: Array(7).fill(null).map((_, i) => ({ id: `${i+8}`, title: `Book ${i+8}`, author: 'A', price: 1, image: 'i.png' })),
      total: 15, page: 2, totalPages: 2, limit: 8
    };

    vi.mocked(api.getBooks)
      .mockResolvedValueOnce(page1Data)
      .mockResolvedValueOnce(page2Data);

    render(
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Book 0')).toBeInTheDocument());

    const nextBtn = screen.getByText('Next →');
    import('@testing-library/react').then(({ fireEvent }) => {
      fireEvent.click(nextBtn);
    });

    await waitFor(() => {
      expect(api.getBooks).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
      expect(screen.getByText('Book 8')).toBeInTheDocument();
    });
  });
});
