import { Link } from 'react-router-dom';
import { useChaos } from '../ChaosContext';
import { useBooks } from '../hooks/useBooks';
import { useCart } from '../hooks/useCart';

export default function Catalog() {
  const { config } = useChaos();
  const injectA11yViolations = config?.injectA11yViolations;

  const {
    books,
    query,
    inputValue,
    setInputValue,
    page,
    totalPages,
    total,
    loading,
    search,
    changePage
  } = useBooks();

  const { addToCart, addingId } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    search('');
  };

  return (
    <div>
      <h1>Book Catalog</h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="catalog-search-form">
        <input
          type="text"
          placeholder="Search by title, author, or genre..."
          className="catalog-search-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          id="book-search-input"
          {...(!injectA11yViolations ? { 'aria-label': 'Search books' } : {})}
        />
        <button type="submit" className="catalog-search-btn" id="book-search-btn">Search</button>
        {query && (
          <button
            type="button"
            className="catalog-clear-btn"
            id="book-search-clear-btn"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
      </form>

      {/* Result Count */}
      {!loading && (
        <p 
          className="catalog-result-count"
          style={injectA11yViolations ? { color: '#eaeaea', background: '#ffffff', padding: '4px' } : undefined}
        >
          {query
            ? `${total} result${total !== 1 ? 's' : ''} for "${query}"`
            : `${total} books available`}
        </p>
      )}

      {loading && <p className="catalog-loading">Loading books...</p>}

      {/* Book Grid */}
      <div className="layout-wrapper-xyz987">
        {books.map((b) => (
          <div key={b.id} className="complex-item-box-alpha">
            <div className="image-cell-omega">
              <Link to={`/books/${b.id}`}>
                <img 
                  src={b.image} 
                  className="catalog-book-cover" 
                  {...(!injectA11yViolations ? { alt: b.title } : {})}
                />
              </Link>
            </div>
            <div className="info-cell-beta">
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
                onClick={() => addToCart(b.id)}
                disabled={addingId === b.id}
                id={`add-to-cart-${b.id}`}
              >
                {addingId === b.id ? (
                  <><span className="spinner"></span> Processing...</>
                ) : 'Add to Cart'}
              </button>
            </div>
          </div>
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
            onClick={() => changePage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn ${p === page ? 'page-btn-active' : ''}`}
              id={`pagination-page-${p}`}
              onClick={() => changePage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            id="pagination-next"
            onClick={() => changePage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
