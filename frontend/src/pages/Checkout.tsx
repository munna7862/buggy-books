import { useState, useEffect } from 'react';
import { api } from '../api';
import OrderSummary from '../components/OrderSummary';

export default function Checkout() {
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    api.getCart().then(cart => {
      setTotal(cart.reduce((acc: number, item: { price: number }) => acc + item.price, 0));
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    const formData = new FormData(e.currentTarget);
    const payload = {
      firstName: formData.get('txt_f1') as string,
      lastName: formData.get('txt_f2') as string,
      creditCard: formData.get('txt_c99') as string,
    };
    try {
      await api.checkout(payload);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return <h2>Payment Successful! Thank you for your order.</h2>;
  }

  return (
    <div>
      <h1>Checkout</h1>
      
      {/* Shadow DOM Component to test piercing */}
      <OrderSummary total={total} />

      {status === 'error' && (
        <div className="error-banner">
          Payment processing failed due to server error (Intentionally Flaky API). Please try again.
        </div>
      )}

      {/* Form intentionally avoids semantic ids/data-testids and uses generic names */}
      <form onSubmit={handleSubmit} className="form-container-xyz">
        <div className="input-group-rnd-9182">
          <label className="lbl-t1">First Name</label>
          <input type="text" name="txt_f1" className="input-field-general" required />
        </div>

        <div className="input-group-rnd-9182">
          <label className="lbl-t1">Last Name</label>
          <input type="text" name="txt_f2" className="input-field-general" required />
        </div>

        <div className="input-group-rnd-9182">
          <label className="lbl-t1">Credit Card</label>
          <input type="text" name="txt_c99" className="input-field-general secure-field" required />
        </div>

        <button 
          type="submit" 
          name="btn_submit_rnd"
          className="submit-action-btn primary-x2"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <><span className="spinner"></span> Processing Transaction...</>
          ) : 'Complete Payment'}
        </button>
      </form>
    </div>
  );
}
