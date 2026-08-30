import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { Book } from '@buggybooks/types';

interface UseBooksOptions {
  limit?: number;
}

export function useBooks({ limit = 8 }: UseBooksOptions = {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(() => {
    setLoading(true);
    setError(null);
    return api.getBooks({ q: query, page, limit })
      .then((data) => {
        if (Array.isArray(data)) {
          setBooks(data);
          setTotalPages(1);
          setTotal(data.length);
        } else {
          setBooks(data.books);
          setTotalPages(data.totalPages);
          setTotal(data.total);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to fetch books:', err);
        const message = err instanceof Error ? err.message : 'Failed to fetch books';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [query, page, limit]);

  useEffect(() => {
    let ignore = false;
    api.getBooks({ q: query, page, limit })
      .then((data) => {
        if (ignore) return;
        setError(null);
        if (Array.isArray(data)) {
          setBooks(data);
          setTotalPages(1);
          setTotal(data.length);
        } else {
          setBooks(data.books);
          setTotalPages(data.totalPages);
          setTotal(data.total);
        }
      })
      .catch((err: unknown) => {
        if (ignore) return;
        console.error('Failed to fetch books:', err);
        const message = err instanceof Error ? err.message : 'Failed to fetch books';
        setError(message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [query, page, limit]);

  const search = useCallback((searchQuery: string) => {
    setPage(1);
    setQuery(searchQuery);
  }, []);

  const changePage = useCallback((pageNumber: number) => {
    setPage(pageNumber);
  }, []);

  return {
    books,
    query,
    inputValue,
    setInputValue,
    page,
    totalPages,
    total,
    loading,
    error,
    search,
    changePage,
    refetch: fetchBooks
  };
}
export type { Book };
