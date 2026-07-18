import React from 'react';

interface WizardStepperProps {
  step: 1 | 2 | 3;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({ step }) => {
  return (
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
  );
};
