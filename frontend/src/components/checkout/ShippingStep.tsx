import React from 'react';
import type { ShippingData, ValidationErrors } from '../../hooks/useCheckout';

interface ShippingStepProps {
  data: ShippingData;
  errors: ValidationErrors;
  onChange: (fields: Partial<ShippingData>) => void;
  injectA11yViolations?: boolean;
}

export const ShippingStep: React.FC<ShippingStepProps> = ({
  data,
  errors,
  onChange,
  injectA11yViolations = false
}) => {
  return (
    <div className="wizard-step-content" id="wizard-step-1">
      <h3>Shipping Details</h3>
      
      <div className="input-group-rnd-9182">
        <label className="lbl-t1" {...(!injectA11yViolations ? { htmlFor: 'txt_f1' } : {})}>First Name</label>
        <input 
          type="text" 
          name="txt_f1" 
          value={data.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
          className={`input-field-general ${errors.firstName ? 'input-error' : ''}`} 
          {...(!injectA11yViolations ? { id: 'txt_f1' } : {})}
          required 
        />
        {errors.firstName && <span className="field-error-msg">{errors.firstName}</span>}
      </div>

      <div className="input-group-rnd-9182">
        <label className="lbl-t1" {...(!injectA11yViolations ? { htmlFor: 'txt_f2' } : {})}>Last Name</label>
        <input 
          type="text" 
          name="txt_f2" 
          value={data.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
          className={`input-field-general ${errors.lastName ? 'input-error' : ''}`} 
          {...(!injectA11yViolations ? { id: 'txt_f2' } : {})}
          required 
        />
        {errors.lastName && <span className="field-error-msg">{errors.lastName}</span>}
      </div>

      <div className="input-group-rnd-9182">
        <label className="lbl-t1" {...(!injectA11yViolations ? { htmlFor: 'txt_addr_12' } : {})}>Shipping Address</label>
        <input 
          type="text" 
          name="txt_addr_12" 
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="123 Buggy Lane"
          className={`input-field-general ${errors.address ? 'input-error' : ''}`} 
          {...(!injectA11yViolations ? { id: 'txt_addr_12' } : {})}
          required 
        />
        {errors.address && <span className="field-error-msg">{errors.address}</span>}
      </div>

      <div className="input-group-rnd-9182">
        <label className="lbl-t1" {...(!injectA11yViolations ? { htmlFor: 'txt_city_34' } : {})}>City</label>
        <input 
          type="text" 
          name="txt_city_34" 
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder="Stack City"
          className={`input-field-general ${errors.city ? 'input-error' : ''}`} 
          {...(!injectA11yViolations ? { id: 'txt_city_34' } : {})}
          required 
        />
        {errors.city && <span className="field-error-msg">{errors.city}</span>}
      </div>
    </div>
  );
};
