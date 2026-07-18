import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { validateShipping, validatePayment } from '../utils/validators';
import type { ShippingData, PaymentData, ValidationErrors } from '../utils/validators';

interface UseCheckoutProps {
  total?: number;
}

export function useCheckout({ total: _total }: UseCheckoutProps = {}) {
  // Shipping Data
  const [shippingData, setShippingData] = useState<ShippingData>({
    firstName: '',
    lastName: '',
    address: '',
    city: ''
  });

  // Payment Data
  const [paymentData, setPaymentData] = useState<PaymentData>({
    creditCard: '',
    expiry: '',
    cvv: ''
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Check if anything is dirty
  const isDirty = (
    shippingData.firstName.trim() !== '' ||
    shippingData.lastName.trim() !== '' ||
    shippingData.address.trim() !== '' ||
    shippingData.city.trim() !== '' ||
    paymentData.creditCard.trim() !== '' ||
    paymentData.expiry.trim() !== '' ||
    paymentData.cvv.trim() !== ''
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

  const updateShipping = useCallback((fields: Partial<ShippingData>) => {
    setShippingData(prev => ({ ...prev, ...fields }));
  }, []);

  const updatePayment = useCallback((fields: Partial<PaymentData>) => {
    setPaymentData(prev => ({ ...prev, ...fields }));
  }, []);

  const handleNextStep = useCallback(() => {
    if (step === 1) {
      const validationErrors = validateShipping(shippingData);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length === 0) setStep(2);
    } else if (step === 2) {
      const validationErrors = validatePayment(paymentData);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length === 0) setStep(3);
    }
  }, [step, shippingData, paymentData]);

  const handleBackStep = useCallback(() => {
    if (step > 1) {
      setStep(prev => (prev - 1) as 1 | 2 | 3);
      setErrors({}); // Clear validation errors on back
    }
  }, [step]);

  const submit = useCallback(async () => {
    if (step !== 3) return;
    setStatus('loading');
    try {
      await api.checkout({
        firstName: shippingData.firstName,
        lastName: shippingData.lastName,
        creditCard: paymentData.creditCard
      });
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }, [step, shippingData, paymentData]);

  return {
    shippingData,
    paymentData,
    step,
    errors,
    status,
    isDirty,
    updateShipping,
    updatePayment,
    handleNextStep,
    handleBackStep,
    submit
  };
}
export type { ShippingData, PaymentData, ValidationErrors };
export { validateShipping, validatePayment };
