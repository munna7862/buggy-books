import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import type { Book } from '@buggybooks/types';
import { CatalogScreen } from '../screens/CatalogScreen';
import { BookDetailScreen } from '../screens/BookDetailScreen';
import { apiClient } from '../api/client';

jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockBooks: Book[] = [
  {
    id: 'book-1',
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt & David Thomas',
    price: 49.99,
    image: 'https://example.com/pragmatic.jpg',
    genre: 'Engineering',
    description: 'A classic software engineering guide.',
    stock: 5,
  },
  {
    id: 'book-2',
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    price: 39.99,
    image: 'https://example.com/clean.jpg',
    genre: 'Architecture',
    description: 'A Craftsman Guide to Software Structure.',
    stock: 8,
  },
];

describe('Mobile Catalog & Book Detail Flow', () => {
  const mockNavigation: any = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial catalog books in two-column grid (MOB_CAT_01)', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBooks });

    const { getByText, getByTestId } = render(
      <CatalogScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('The Pragmatic Programmer')).toBeTruthy();
      expect(getByText('Clean Architecture')).toBeTruthy();
      expect(getByText('$49.99')).toBeTruthy();
      expect(getByText('$39.99')).toBeTruthy();
      expect(getByTestId('book-card-book-1')).toBeTruthy();
      expect(getByTestId('book-card-book-2')).toBeTruthy();
    });
  });

  it('filters books dynamically on search query (MOB_CAT_02)', async () => {
    (apiClient.get as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('q=Clean')) {
        return { data: [mockBooks[1]] };
      }
      return { data: mockBooks };
    });

    const { getByTestId, getByText, queryByText } = render(
      <CatalogScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('The Pragmatic Programmer')).toBeTruthy();
    });

    const searchInput = getByTestId('input-search');
    fireEvent.changeText(searchInput, 'Clean');

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/books?q=Clean');
      expect(getByText('Clean Architecture')).toBeTruthy();
      expect(queryByText('The Pragmatic Programmer')).toBeNull();
    });
  });

  it('displays empty state when search returns no matching books (MOB_CAT_04)', async () => {
    (apiClient.get as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('q=NonExistentTitle')) {
        return { data: [] };
      }
      return { data: mockBooks };
    });

    const { getByTestId, getByText } = render(
      <CatalogScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('The Pragmatic Programmer')).toBeTruthy();
    });

    const searchInput = getByTestId('input-search');
    fireEvent.changeText(searchInput, 'NonExistentTitle');

    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
      expect(getByText('No books found')).toBeTruthy();
    });
  });

  it('navigates to BookDetailScreen with book params on card press (MOB_CAT_05)', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBooks });

    const { getByTestId } = render(
      <CatalogScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByTestId('book-card-book-1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('book-card-book-1'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('BookDetail', {
      bookId: 'book-1',
      book: mockBooks[0],
    });
  });

  it('renders BookDetailScreen with quantity selector and Add to Cart action (MOB_CAT_05)', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Added to cart' } });

    const mockRoute: any = {
      params: {
        bookId: 'book-1',
        book: mockBooks[0],
      },
    };

    const { getByTestId, getByText } = render(
      <BookDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByTestId('book-detail-title').props.children).toBe('The Pragmatic Programmer');
    expect(getByText('by Andrew Hunt & David Thomas')).toBeTruthy();
    expect(getByText('In Stock (5)')).toBeTruthy();
    expect(getByTestId('text-quantity').props.children).toBe(1);

    // Increase quantity
    fireEvent.press(getByTestId('btn-increase-qty'));
    expect(getByTestId('text-quantity').props.children).toBe(2);

    // Decrease quantity
    fireEvent.press(getByTestId('btn-decrease-qty'));
    expect(getByTestId('text-quantity').props.children).toBe(1);

    // Add to cart
    fireEvent.press(getByTestId('btn-add-to-cart'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/cart', {
        bookId: 'book-1',
        quantity: 1,
      });
      expect(getByTestId('cart-feedback-banner')).toBeTruthy();
    });
  });
});
