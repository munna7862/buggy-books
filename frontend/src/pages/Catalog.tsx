import { useEffect, useState } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
}

export default function Catalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    api.getBooks().then(setBooks).catch(console.error);
  }, []);

  const handleAddToCart = (id: string) => {
    setAddingId(id);
    // eslint-disable-next-line
    const delay = Math.floor(Math.random() * 3000) + 500; // 500ms to 3500ms
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
      {/* Obfuscated wrapper instead of simple list */}
      <div className="layout-wrapper-xyz987">
        {books.map((b) => (
          // Intentional use of a single-row table or strange structure for each item instead of a clean container
          <table key={b.id} className="complex-item-box-alpha">
            <tbody>
              <tr>
                <td className="image-cell-omega">
                  <img src={b.image} alt={b.title} className="catalog-book-cover" />
                </td>
                <td className="info-cell-beta">
                  <h3 className="title-variant-2">{b.title}</h3>
                  <p className="author-meta-tag">{b.author}</p>
                  <p className="price-tag-value">${b.price.toFixed(2)}</p>
                  
                  <button 
                    className="action-btn-primary dynamic-l1"
                    onClick={() => handleAddToCart(b.id)}
                    disabled={addingId === b.id}
                  >
                    {addingId === b.id ? 'Processing...' : 'Add to Cart'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
