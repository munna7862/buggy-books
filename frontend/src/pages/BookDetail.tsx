import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import toast from 'react-hot-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
  genre?: string;
  description?: string;
}

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getBookById(id)
      .then(setBook)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!book) return;
    setAdding(true);
    api.addToCart(book.id)
      .then(() => {
        toast.success(`"${book.title}" added to cart!`);
      })
      .catch(() => {
        toast.error('Failed to add to cart.');
      })
      .finally(() => setAdding(false));
  };

  if (loading) {
    return (
      <div className="book-detail-container">
        <p className="catalog-loading">Loading book details...</p>
      </div>
    );
  }

  if (notFound || !book) {
    return (
      <div className="book-detail-container">
        <h1>Book Not Found</h1>
        <p>The book you're looking for doesn't exist.</p>
        <Link to="/" className="action-btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="book-detail-container" id={`book-detail-${book.id}`}>
      <Link to="/" className="book-detail-back" id="book-detail-back-link">
        ← Back to Catalog
      </Link>

      <div className="book-detail-card">
        <div className="book-detail-image-col">
          <img
            src={book.image}
            alt={book.title}
            className="book-detail-cover"
            id="book-detail-cover-img"
          />
          {book.genre && (
            <span className="book-genre-tag book-genre-tag-lg" id="book-detail-genre">
              {book.genre}
            </span>
          )}
        </div>

        <div className="book-detail-info-col">
          <h1 className="book-detail-title" id="book-detail-title">{book.title}</h1>
          <p className="book-detail-author" id="book-detail-author">by {book.author}</p>

          {book.description && (
            <p className="book-detail-description" id="book-detail-description">
              {book.description}
            </p>
          )}

          <div className="book-detail-price-row">
            <span className="book-detail-price" id="book-detail-price">
              ${book.price.toFixed(2)}
            </span>
          </div>

          <button
            className="action-btn-primary"
            id="book-detail-add-to-cart"
            onClick={handleAddToCart}
            disabled={adding}
            style={{ marginTop: '1.5rem', width: '100%' }}
          >
            {adding ? (
              <><span className="spinner"></span> Adding to Cart...</>
            ) : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
