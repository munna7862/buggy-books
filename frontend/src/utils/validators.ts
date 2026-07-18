export interface ShippingData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
}

export interface PaymentData {
  creditCard: string;
  expiry: string;
  cvv: string;
}

export type ValidationErrors = Partial<ShippingData & PaymentData>;

export const validateShipping = (data: ShippingData): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'First name is required';
  if (!data.lastName.trim()) errors.lastName = 'Last name is required';
  if (!data.address.trim() || data.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters';
  }
  if (!data.city.trim()) errors.city = 'City is required';
  return errors;
};

export const validatePayment = (data: PaymentData): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  const cardCleaned = data.creditCard.replace(/\s+/g, '');
  if (!/^\d{16}$/.test(cardCleaned)) {
    errors.creditCard = 'Credit card must be exactly 16 digits';
  }
  
  if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(data.expiry)) {
    errors.expiry = 'Expiry date must be in MM/YY format';
  }

  if (!/^\d{3}$/.test(data.cvv)) {
    errors.cvv = 'CVV must be exactly 3 digits';
  }

  return errors;
};
