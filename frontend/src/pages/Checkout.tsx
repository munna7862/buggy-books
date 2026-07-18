import { useEffect } from 'react';
import { useChaos } from '../ChaosContext';
import OrderSummary from '../components/OrderSummary';
import { useCart } from '../hooks/useCart';
import { useCheckout } from '../hooks/useCheckout';
import { WizardStepper } from '../components/checkout/WizardStepper';
import { ShippingStep } from '../components/checkout/ShippingStep';
import { PaymentStep } from '../components/checkout/PaymentStep';
import { ConfirmStep } from '../components/checkout/ConfirmStep';

export default function Checkout() {
  const { config } = useChaos();
  const injectA11yViolations = config?.injectA11yViolations;

  const { total, refreshCart } = useCart();
  const {
    shippingData,
    paymentData,
    step,
    errors,
    status,
    updateShipping,
    updatePayment,
    handleNextStep,
    handleBackStep,
    submit
  } = useCheckout({ total });

  // Refresh cart on mount to get current total
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
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
      <WizardStepper step={step} />

      <OrderSummary total={total} />

      {status === 'error' && (
        <div className="error-banner">
          Payment processing failed due to server error (Intentionally Flaky API). Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-container-xyz">
        {step === 1 && (
          <ShippingStep 
            data={shippingData} 
            errors={errors} 
            onChange={updateShipping} 
            injectA11yViolations={injectA11yViolations} 
          />
        )}

        {step === 2 && (
          <PaymentStep 
            data={paymentData} 
            errors={errors} 
            onChange={updatePayment} 
            injectA11yViolations={injectA11yViolations} 
          />
        )}

        {step === 3 && (
          <ConfirmStep 
            shippingData={shippingData} 
            paymentData={paymentData} 
          />
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
