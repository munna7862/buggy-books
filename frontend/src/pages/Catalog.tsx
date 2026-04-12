import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Catalog() {
  const [books, setBooks] = useState<any[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    api.getBooks().then(setBooks).catch(console.error);
  }, []);

  const handleAddToCart = (id: string) => {
    setAddingId(id);
    const delay = Math.floor(Math.random() * 3000) + 500; // 500ms to 3500ms
    setTimeout(() => {
      api.addToCart(id).then(() => {
        setAddingId(null);
        alert('Added to cart!'); // Intentionally requires alert handling in tests
      }).catch((err) => {
        console.error(err);
        setAddingId(null);
      });
    }, delay);
  };

  return (
    <div>
      <h1>Book Catalog</h1>
      {/* Obfuscated wrapper instead of simple list */}
      <div className="layout-wrapper-xyz987" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {books.map((b) => (
          // Intentional use of a single-row table or strange structure for each item instead of a clean container
          <table key={b.id} className="complex-item-box-alpha" style={{ border: '1px solid #eee', width: '100%', maxWidth: '600px' }}>
            <tbody>
              <tr>
                <td style={{ width: '120px' }}>
                  <img src={b.image} alt={b.title} style={{ width: '100px', height: '150px', objectFit: 'cover' }} />
                </td>
                <td className="info-cell-beta" style={{ verticalAlign: 'top', padding: '10px' }}>
                  <h3 className="title-variant-2" style={{ margin: 0 }}>{b.title}</h3>
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
