import { useState, useEffect } from 'react';
import { api } from '../api';
import OrderSummary from '../components/OrderSummary';

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  creditCard?: string;
  expiry?: string;
  cvv?: string;
}

export default function Checkout() {
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Wizard Steps: 1 = Shipping, 2 = Payment, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [creditCard, setCreditCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Errors state
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    api.getCart().then(cart => {
      setTotal(cart.reduce((acc: number, item: { price: number }) => acc + item.price, 0));
    }).catch(console.error);
  }, []);

  // Dirty state calculation
  const isDirty = (
    firstName.trim() !== '' ||
    lastName.trim() !== '' ||
    address.trim() !== '' ||
    city.trim() !== '' ||
    creditCard.trim() !== '' ||
    expiry.trim() !== '' ||
    cvv.trim() !== ''
  ) && status !== 'success';

  // Navigation interceptors for dirty state warning dialogs
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave the checkout wizard?';
        return e.returnValue;
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      if (!isDirty) return;
      
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && !target.href.includes('/checkout')) {
        const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave the checkout wizard?');
        if (!confirmLeave) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isDirty]);

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!address.trim() || address.trim().length < 5) newErrors.address = 'Address must be at least 5 characters';
    if (!city.trim()) newErrors.city = 'City is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Clean card digits
    const cardCleaned = creditCard.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(cardCleaned)) {
      newErrors.creditCard = 'Credit card must be exactly 16 digits';
    }
    
    if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) {
      newErrors.expiry = 'Expiry date must be in MM/YY format';
    }

    if (!/^\d{3}$/.test(cvv)) {
      newErrors.cvv = 'CVV must be exactly 3 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
      setErrors({}); // Clear validation errors on back
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step !== 3) return; // Must submit from step 3

    setStatus('loading');
    try {
      await api.checkout({ firstName, lastName, creditCard });
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="payment-success-card">
        <h2>🎉 Payment Successful!</h2>
        <p>Thank you for your order. Your books are being prepared for shipping.</p>
      </div>
    );
  }

  return (
    <div className="checkout-wizard-container">
      <h1>Checkout</h1>
      
      {/* Wizard Stepper Progress Bar */}
      <div className="wizard-stepper">
        <div id="step-indicator-1" className={`step-item ${step === 1 ? 'step-active' : step > 1 ? 'step-completed' : ''}`}>
          <div className="step-badge">1</div>
          <span>Shipping</span>
        </div>
        <div className="step-divider" />
        <div id="step-indicator-2" className={`step-item ${step === 2 ? 'step-active' : step > 2 ? 'step-completed' : ''}`}>
          <div className="step-badge">2</div>
          <span>Payment</span>
        </div>
        <div className="step-divider" />
        <div id="step-indicator-3" className={`step-item ${step === 3 ? 'step-active' : ''}`}>
          <div className="step-badge">3</div>
          <span>Confirm</span>
        </div>
      </div>

      <OrderSummary total={total} />

      {status === 'error' && (
        <div className="error-banner">
          Payment processing failed due to server error (Intentionally Flaky API). Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-container-xyz">
        {step === 1 && (
          <div className="wizard-step-content" id="wizard-step-1">
            <h3>Shipping Details</h3>
            
            <div className="input-group-rnd-9182">
              <label className="lbl-t1">First Name</label>
              <input 
                type="text" 
                name="txt_f1" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`input-field-general ${errors.firstName ? 'input-error' : ''}`} 
                required 
              />
              {errors.firstName && <span className="field-error-msg">{errors.firstName}</span>}
            </div>

            <div className="input-group-rnd-9182">
              <label className="lbl-t1">Last Name</label>
              <input 
                type="text" 
                name="txt_f2" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`input-field-general ${errors.lastName ? 'input-error' : ''}`} 
                required 
              />
              {errors.lastName && <span className="field-error-msg">{errors.lastName}</span>}
            </div>

            <div className="input-group-rnd-9182">
              <label className="lbl-t1">Shipping Address</label>
              <input 
                type="text" 
                name="txt_addr_12" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Buggy Lane"
                className={`input-field-general ${errors.address ? 'input-error' : ''}`} 
                required 
              />
              {errors.address && <span className="field-error-msg">{errors.address}</span>}
            </div>

            <div className="input-group-rnd-9182">
              <label className="lbl-t1">City</label>
              <input 
                type="text" 
                name="txt_city_34" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Stack City"
                className={`input-field-general ${errors.city ? 'input-error' : ''}`} 
                required 
              />
              {errors.city && <span className="field-error-msg">{errors.city}</span>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step-content" id="wizard-step-2">
            <h3>Billing & Payment</h3>

            <div className="input-group-rnd-9182">
              <label className="lbl-t1">Credit Card Number</label>
              <input 
                type="text" 
                name="txt_c99" 
                value={creditCard}
                onChange={(e) => setCreditCard(e.target.value)}
                placeholder="16-digit card number"
                className={`input-field-general secure-field ${errors.creditCard ? 'input-error' : ''}`} 
                required 
              />
              {errors.creditCard && <span className="field-error-msg">{errors.creditCard}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group-rnd-9182">
                <label className="lbl-t1">Expiry (MM/YY)</label>
                <input 
                  type="text" 
                  name="txt_exp_56" 
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className={`input-field-general ${errors.expiry ? 'input-error' : ''}`} 
                  required 
                />
                {errors.expiry && <span className="field-error-msg">{errors.expiry}</span>}
              </div>

              <div className="input-group-rnd-9182">
                <label className="lbl-t1">CVV</label>
                <input 
                  type="text" 
                  name="txt_cvv_78" 
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="3 digits"
                  className={`input-field-general ${errors.cvv ? 'input-error' : ''}`} 
                  required 
                />
                {errors.cvv && <span className="field-error-msg">{errors.cvv}</span>}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step-content" id="wizard-step-3">
            <h3>Review & Confirm</h3>
            
            <div className="review-summary-card">
              <div className="summary-section">
                <h5>Shipping Information</h5>
                <p><strong>Name:</strong> {firstName} {lastName}</p>
                <p><strong>Address:</strong> {address}, {city}</p>
              </div>

              <div className="summary-section" style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <h5>Payment Details</h5>
                <p><strong>Card:</strong> **** **** **** {creditCard.replace(/\s+/g, '').slice(-4)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Control Action Buttons */}
        <div className="wizard-actions-row">
          {step > 1 && (
            <button 
              type="button" 
              id="wizard-back-btn"
              onClick={handleBackStep}
              className="submit-action-btn secondary-x2"
              disabled={status === 'loading'}
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button 
              type="button" 
              id="wizard-next-btn"
              onClick={handleNextStep}
              className="submit-action-btn primary-x2"
              style={{ marginLeft: 'auto' }}
            >
              Next Step
            </button>
          ) : (
            <button 
              type="submit" 
              name="btn_submit_rnd"
              className="submit-action-btn primary-x2"
              style={{ marginLeft: 'auto' }}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <><span className="spinner"></span> Processing...</>
              ) : 'Complete Payment'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
