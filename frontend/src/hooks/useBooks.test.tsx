import { renderHook, waitFor, act } from '@testing-library/react';
import { useBooks } from './useBooks';
import { api } from '../api';
import type { PaginatedBooks } from '@buggybooks/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  api: {
    getBooks: vi.fn(),
  },
}));

describe('useBooks Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and sets paginated books on mount', async () => {
    const mockResponse: PaginatedBooks = {
      books: [
        { id: '1', title: 'The Pragmatic Programmer', author: 'Andy Hunt', price: 39.99, image: '/book1.png', stock: 10, genre: 'Tech' },
        { id: '2', title: 'Clean Code', author: 'Robert Martin', price: 44.99, image: '/book2.png', stock: 5, genre: 'Tech' },
      ],
      page: 1,
      limit: 8,
      totalPages: 3,
      total: 24,
    };

    vi.mocked(api.getBooks).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useBooks({ limit: 8 }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.books).toHaveLength(2);
      expect(result.current.totalPages).toBe(3);
      expect(result.current.total).toBe(24);
      expect(result.current.error).toBeNull();
    });

    expect(api.getBooks).toHaveBeenCalledWith({ q: '', page: 1, limit: 8 });
  });

  it('supports plain array responses gracefully', async () => {
    const mockArray = [
      { id: '1', title: 'JavaScript Definitive Guide', author: 'David Flanagan', price: 49.99, image: '/book3.png', stock: 8, genre: 'Tech' },
    ];

    vi.mocked(api.getBooks).mockResolvedValue(mockArray as unknown as PaginatedBooks);

    const { result } = renderHook(() => useBooks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.books).toEqual(mockArray);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.total).toBe(1);
    });
  });

  it('handles API failure on mount and sets error message', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.getBooks).mockRejectedValue(new Error('Failed to load catalog'));

    const { result } = renderHook(() => useBooks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load catalog');
    });

    consoleSpy.mockRestore();
  });

  it('handles non-Error rejection fallback', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.getBooks).mockRejectedValue('Fatal network failure');

    const { result } = renderHook(() => useBooks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch books');
    });

    consoleSpy.mockRestore();
  });

  it('resets page to 1 and updates query on search()', async () => {
    vi.mocked(api.getBooks).mockResolvedValue({
      books: [],
      page: 1,
      limit: 8,
      totalPages: 1,
      total: 0,
    });

    const { result } = renderHook(() => useBooks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.changePage(3);
    });
    expect(result.current.page).toBe(3);

    await act(async () => {
      result.current.search('JavaScript');
    });

    expect(result.current.query).toBe('JavaScript');
    expect(result.current.page).toBe(1);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('updates page and triggers refetch on changePage()', async () => {
    vi.mocked(api.getBooks).mockResolvedValue({
      books: [],
      page: 2,
      limit: 8,
      totalPages: 5,
      total: 40,
    });

    const { result } = renderHook(() => useBooks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.changePage(2);
    });

    expect(result.current.page).toBe(2);

    await waitFor(() => {
      expect(api.getBooks).toHaveBeenCalledWith({ q: '', page: 2, limit: 8 });
    });
  });

  it('allows manual refetch with fetchBooks callback', async () => {
    vi.mocked(api.getBooks).mockResolvedValue({
      books: [{ id: '1', title: 'Book 1', author: 'Author 1', price: 10, image: '/book1.png', stock: 1, genre: 'Fiction' }],
      page: 1,
      limit: 8,
      totalPages: 1,
      total: 1,
    });

    const { result } = renderHook(() => useBooks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(api.getBooks).toHaveBeenCalledTimes(2);
  });

  it('allows setting inputValue state directly', () => {
    vi.mocked(api.getBooks).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useBooks());

    act(() => {
      result.current.setInputValue('React');
    });

    expect(result.current.inputValue).toBe('React');
  });
});
