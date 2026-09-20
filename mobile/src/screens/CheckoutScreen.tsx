import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CartStackParamList, MainTabParamList } from '../navigation/types';
import { useCart } from '../context/CartContext';
import { apiClient } from '../api/client';
import * as Haptics from 'expo-haptics';

type CheckoutScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<CartStackParamList, 'Checkout'>,
  BottomTabNavigationProp<MainTabParamList>
>;

interface CheckoutScreenProps {
  navigation: CheckoutScreenNavigationProp;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  address?: string;
  creditCard?: string;
}

export function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const { cart, total, subtotal, tax, clearCart } = useCart();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [creditCard, setCreditCard] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  const formatCardNumber = (text: string) => {
    // Keep only digits and format with spaces every 4 digits up to 16
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleCardChange = (text: string) => {
    setCreditCard(formatCardNumber(text));
    if (errors.creditCard) {
      setErrors((prev) => ({ ...prev, creditCard: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!firstName.trim()) {
      nextErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      nextErrors.lastName = 'Last name is required';
    }
    if (!address.trim()) {
      nextErrors.address = 'Shipping address is required';
    }

    const cleanCard = creditCard.replace(/\s/g, '');
    if (!cleanCard) {
      nextErrors.creditCard = 'Credit card number is required';
    } else if (cleanCard.length < 16) {
      nextErrors.creditCard = 'Card number must be exactly 16 digits';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    setServerError(null);
    if (!validate()) {
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Warning)?.catch?.(() => {});
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium)?.catch?.(() => {});

    try {
      const cleanCard = creditCard.replace(/\s/g, '');
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        orderId: string;
      }>('/api/checkout/process', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        creditCard: cleanCard,
      });

      if (response.data.success || response.data.orderId) {
        const orderId = response.data.orderId || `ORD-${Date.now()}`;
        setConfirmedOrderId(orderId);
        await clearCart();
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success)?.catch?.(() => {});
      }
    } catch (err: unknown) {
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error)?.catch?.(() => {});
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      const message =
        axiosErr.response?.data?.error ||
        axiosErr.response?.data?.message ||
        'Payment processing failed due to server error. Please try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedOrderId) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.successContainer} testID="order-confirmation-view">
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Order Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for your purchase. Your books are being prepared for shipment.
          </Text>

          <View style={styles.orderCard}>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Order ID</Text>
              <Text style={styles.orderIdValue} testID="confirmed-order-id">
                {confirmedOrderId}
              </Text>
            </View>

            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Customer</Text>
              <Text style={styles.orderDetailValue}>
                {firstName} {lastName}
              </Text>
            </View>

            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Shipping To</Text>
              <Text style={styles.orderDetailValue}>{address}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderDetailRow}>
              <Text style={styles.orderTotalLabel}>Total Paid</Text>
              <Text style={styles.orderTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('CatalogTab')}
            testID="btn-continue-shopping"
            accessibilityRole="button"
            accessibilityLabel="Continue shopping in catalog"
          >
            <Text style={styles.continueButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {serverError && (
            <View style={styles.errorBanner} testID="checkout-error-banner">
              <Text style={styles.errorBannerText}>⚠️ {serverError}</Text>
            </View>
          )}

          {/* Shipping Information Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📦 Shipping Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={[styles.input, errors.firstName ? styles.inputError : null]}
                placeholder="John"
                placeholderTextColor="#64748b"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                testID="input-first-name"
                accessibilityLabel="First Name"
              />
              {errors.firstName && (
                <Text style={styles.errorText} testID="error-first-name">
                  {errors.firstName}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={[styles.input, errors.lastName ? styles.inputError : null]}
                placeholder="Doe"
                placeholderTextColor="#64748b"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                testID="input-last-name"
                accessibilityLabel="Last Name"
              />
              {errors.lastName && (
                <Text style={styles.errorText} testID="error-last-name">
                  {errors.lastName}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shipping Address</Text>
              <TextInput
                style={[styles.input, errors.address ? styles.inputError : null]}
                placeholder="123 Bookstore Ave, Suite 4B"
                placeholderTextColor="#64748b"
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                }}
                testID="input-shipping-address"
                accessibilityLabel="Shipping Address"
              />
              {errors.address && (
                <Text style={styles.errorText} testID="error-shipping-address">
                  {errors.address}
                </Text>
              )}
            </View>
          </View>

          {/* Payment Information Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💳 Payment Method</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Credit Card Number (16 Digits)</Text>
              <TextInput
                style={[styles.input, errors.creditCard ? styles.inputError : null]}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor="#64748b"
                value={creditCard}
                onChangeText={handleCardChange}
                keyboardType="numeric"
                maxLength={19}
                testID="input-credit-card"
                accessibilityLabel="Credit Card Number"
              />
              {errors.creditCard && (
                <Text style={styles.errorText} testID="error-credit-card">
                  {errors.creditCard}
                </Text>
              )}
            </View>
          </View>

          {/* Order Summary Section */}
          <View style={styles.sectionCard} testID="checkout-summary-card">
            <Text style={styles.sectionTitle}>🧾 Order Summary ({cart.length} items)</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Tax (8%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.freeShippingBadge}>FREE</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalValue} testID="checkout-total-price">
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Place Order CTA */}
          <TouchableOpacity
            style={[styles.placeOrderButton, isSubmitting ? styles.buttonDisabled : null]}
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
            testID="btn-place-order"
            accessibilityRole="button"
            accessibilityLabel="Place Order"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.placeOrderButtonText}>
                Place Order (${total.toFixed(2)})
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#f8fafc',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  freeShippingBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#818cf8',
  },
  placeOrderButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  orderCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  orderIdValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#818cf8',
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  continueButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
