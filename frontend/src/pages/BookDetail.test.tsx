import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BookDetail from './BookDetail';
import { api } from '../api';
import { vi } from 'vitest';

// Mock the api module
vi.mock('../api', () => ({
  api: {
    getBookById: vi.fn(),
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

describe('BookDetail Component', () => {
  const mockBook = {
    id: '1',
    title: 'Detail Test Book',
    author: 'Detail Author',
    price: 19.99,
    image: 'detail.png',
    genre: 'Mystery',
    description: 'This is a test description.'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders book details correctly', async () => {
    vi.mocked(api.getBookById).mockResolvedValue(mockBook);

    render(
      <MemoryRouter initialEntries={['/books/1']}>
        <Routes>
          <Route path="/books/:id" element={<BookDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Detail Test Book')).toBeInTheDocument();
      expect(screen.getByText('by Detail Author')).toBeInTheDocument();
      expect(screen.getByText('$19.99')).toBeInTheDocument();
      expect(screen.getByText('Mystery')).toBeInTheDocument();
      expect(screen.getByText('This is a test description.')).toBeInTheDocument();
    });
  });

  it('shows not found state when book does not exist', async () => {
    vi.mocked(api.getBookById).mockRejectedValue(new Error('Not Found'));

    render(
      <MemoryRouter initialEntries={['/books/999']}>
        <Routes>
          <Route path="/books/:id" element={<BookDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Book Not Found')).toBeInTheDocument();
      expect(screen.getByText(/back to catalog/i)).toBeInTheDocument();
    });
  });

  it('calls addToCart when add button is clicked', async () => {
    vi.mocked(api.getBookById).mockResolvedValue(mockBook);
    vi.mocked(api.addToCart).mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={['/books/1']}>
        <Routes>
          <Route path="/books/:id" element={<BookDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Add to Cart'));

    const addBtn = screen.getByText('Add to Cart');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(api.addToCart).toHaveBeenCalledWith('1');
    });
  });
});
