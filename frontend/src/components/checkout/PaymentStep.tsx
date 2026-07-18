import React from 'react';
import type { PaymentData, ValidationErrors } from '../../hooks/useCheckout';

interface PaymentStepProps {
  data: PaymentData;
  errors: ValidationErrors;
  onChange: (fields: Partial<PaymentData>) => void;
  injectA11yViolations?: boolean;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  data,
  errors,
  onChange,
  injectA11yViolations = false
}) => {
  return (
    <div className="wizard-step-content" id="wizard-step-2">
      <h3>Billing & Payment</h3>

      <div className="input-group-rnd-9182">
        <label className="lbl-t1" {...(!injectA11yViolations ? { htmlFor: 'txt_c99' } : {})}>Credit Card Number</label>
        <input 
          type="text" 
          name="txt_c99" 
          value={data.creditCard}
          onChange={(e) => onChange({ creditCard: e.target.value })}
          placeholder="16-digit card number"
          className={`input-field-general secure-field ${errors.creditCard ? 'input-error' : ''}`} 
          {...(!injectA11yViolations ? { id: 'txt_c99' } : {})}
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
            value={data.expiry}
            onChange={(e) => onChange({ expiry: e.target.value })}
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
            value={data.cvv}
            onChange={(e) => onChange({ cvv: e.target.value })}
            placeholder="3 digits"
            className={`input-field-general ${errors.cvv ? 'input-error' : ''}`} 
            required 
          />
          {errors.cvv && <span className="field-error-msg">{errors.cvv}</span>}
        </div>
      </div>
    </div>
  );
};
