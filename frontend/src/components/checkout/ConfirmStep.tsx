import React from 'react';
import type { ShippingData, PaymentData } from '../../hooks/useCheckout';

interface ConfirmStepProps {
  shippingData: ShippingData;
  paymentData: PaymentData;
}

export const ConfirmStep: React.FC<ConfirmStepProps> = ({
  shippingData,
  paymentData
}) => {
  return (
    <div className="wizard-step-content" id="wizard-step-3">
      <h3>Review & Confirm</h3>
      
      <div className="review-summary-card">
        <div className="summary-section">
          <h5>Shipping Information</h5>
          <p><strong>Name:</strong> {shippingData.firstName} {shippingData.lastName}</p>
          <p><strong>Address:</strong> {shippingData.address}, {shippingData.city}</p>
        </div>

        <div className="summary-section" style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <h5>Payment Details</h5>
          <p><strong>Card:</strong> **** **** **** {paymentData.creditCard.replace(/\s+/g, '').slice(-4)}</p>
        </div>
      </div>
    </div>
  );
};
