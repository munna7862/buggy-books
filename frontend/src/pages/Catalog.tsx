import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import toast from 'react-hot-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
  genre?: string;
}

const PAGE_LIMIT = 8;

export default function Catalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchBooks = useCallback(() => {
    setLoading(true);
    api.getBooks({ q: query, page, limit: PAGE_LIMIT })
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
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(inputValue);
  };

  const handleAddToCart = (id: string) => {
    setAddingId(id);
    const delay = Math.floor(Math.random() * 3000) + 500;
    setTimeout(() => {
      api.addToCart(id).then(() => {
        setAddingId(null);
        toast.success('Added to cart!');
      }).catch((err) => {
        console.error(err);
        setAddingId(null);
        toast.error('Failed to add to cart.');
      });
    }, delay);
  };

  return (
    <div>
      <h1>Book Catalog</h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="catalog-search-form">
        <input
          type="text"
          className="catalog-search-input"
          placeholder="Search by title, author, or genre..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          aria-label="Search books"
          id="book-search-input"
        />
        <button type="submit" className="catalog-search-btn" id="book-search-btn">Search</button>
        {query && (
          <button
            type="button"
            className="catalog-clear-btn"
            id="book-search-clear-btn"
            onClick={() => { setInputValue(''); setQuery(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Result Count */}
      {!loading && (
        <p className="catalog-result-count">
          {query
            ? `${total} result${total !== 1 ? 's' : ''} for "${query}"`
            : `${total} books available`}
        </p>
      )}

      {loading && <p className="catalog-loading">Loading books...</p>}

      {/* Book Grid */}
      <div className="layout-wrapper-xyz987">
        {books.map((b) => (
          <table key={b.id} className="complex-item-box-alpha">
            <tbody>
              <tr>
                <td className="image-cell-omega">
                  <Link to={`/books/${b.id}`}>
                    <img src={b.image} alt={b.title} className="catalog-book-cover" />
                  </Link>
                </td>
                <td className="info-cell-beta">
                  {b.genre && <span className="book-genre-tag">{b.genre}</span>}
                  <h3 className="title-variant-2">
                    <Link to={`/books/${b.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {b.title}
                    </Link>
                  </h3>
                  <p className="author-meta-tag">{b.author}</p>
                  <p className="price-tag-value">${b.price.toFixed(2)}</p>
                  <button
                    className="action-btn-primary dynamic-l1"
                    onClick={() => handleAddToCart(b.id)}
                    disabled={addingId === b.id}
                    id={`add-to-cart-${b.id}`}
                  >
                    {addingId === b.id ? (
                      <><span className="spinner"></span> Processing...</>
                    ) : 'Add to Cart'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        ))}
      </div>

      {/* Empty state */}
      {!loading && books.length === 0 && (
        <div className="catalog-empty">
          <p>No books found{query ? ` for "${query}"` : ''}.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="catalog-pagination" id="catalog-pagination">
          <button
            className="page-btn"
            id="pagination-prev"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn ${p === page ? 'page-btn-active' : ''}`}
              id={`pagination-page-${p}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            id="pagination-next"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

