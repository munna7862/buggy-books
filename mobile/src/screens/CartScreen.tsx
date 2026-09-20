import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CartStackParamList, MainTabParamList } from '../navigation/types';
import { useCart, GroupedCartItem } from '../context/CartContext';
import * as Haptics from 'expo-haptics';

type CartScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<CartStackParamList, 'Cart'>,
  BottomTabNavigationProp<MainTabParamList>
>;

interface CartScreenProps {
  navigation: CartScreenNavigationProp;
}

export function CartScreen({ navigation }: CartScreenProps) {
  const {
    cart,
    groupedItems,
    subtotal,
    tax,
    total,
    isLoading,
    addToCart,
    removeFromCart,
    clearCart,
  } = useCart();

  const handleClearAll = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all books from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium)?.catch?.(() => {});
            await clearCart();
          },
        },
      ]
    );
  };

  const handleDecreaseQuantity = async (bookId: string) => {
    Haptics.selectionAsync?.()?.catch?.(() => {});
    await removeFromCart(bookId);
  };

  const handleIncreaseQuantity = async (bookId: string) => {
    Haptics.selectionAsync?.()?.catch?.(() => {});
    await addToCart(bookId);
  };

  if (isLoading && cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer} testID="cart-loading">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer} testID="empty-cart-state">
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven&apos;t added any books yet. Browse the catalog to find your next great read!
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('CatalogTab')}
            testID="btn-browse-catalog"
            accessibilityRole="button"
            accessibilityLabel="Browse books catalog"
          >
            <Text style={styles.exploreButtonText}>Explore Catalog</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        testID="cart-items-list"
      >
        <Text style={styles.headerTitle}>Shopping Cart ({cart.length})</Text>

        {groupedItems.map((item: GroupedCartItem) => (
          <View
            key={item.book.id}
            style={styles.itemCard}
            testID={`cart-item-${item.book.id}`}
          >
            <View style={styles.thumbnailWrapper}>
              {item.book.image ? (
                <Image
                  source={{ uri: item.book.image }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbnailFallback}>
                  <Text style={styles.thumbnailFallbackText}>📖</Text>
                </View>
              )}
            </View>

            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.book.title}
              </Text>
              <Text style={styles.itemAuthor} numberOfLines={1}>
                {item.book.author}
              </Text>
              <Text style={styles.itemPrice}>
                ${item.book.price.toFixed(2)} each
              </Text>

              <View style={styles.stepperRow}>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => handleDecreaseQuantity(item.book.id)}
                    testID={`decrease-qty-${item.book.id}`}
                    accessibilityLabel={`Decrease quantity of ${item.book.title}`}
                  >
                    <Text style={styles.stepperButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text
                    style={styles.stepperValue}
                    testID={`item-qty-${item.book.id}`}
                  >
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => handleIncreaseQuantity(item.book.id)}
                    testID={`increase-qty-${item.book.id}`}
                    accessibilityLabel={`Increase quantity of ${item.book.title}`}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemSubtotal}>
                  ${item.subtotal.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Order Summary Card */}
        <View style={styles.summaryCard} testID="cart-summary-card">
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue} testID="cart-subtotal">
              ${subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Tax (8%)</Text>
            <Text style={styles.summaryValue} testID="cart-tax">
              ${tax.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.freeShippingBadge}>FREE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue} testID="cart-total">
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            testID="btn-clear-cart"
            accessibilityRole="button"
            accessibilityLabel="Clear all items from cart"
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => navigation.navigate('Checkout')}
            testID="btn-proceed-checkout"
            accessibilityRole="button"
            accessibilityLabel="Proceed to checkout"
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  thumbnailWrapper: {
    width: 70,
    height: 95,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#334155',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailFallbackText: {
    fontSize: 28,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    lineHeight: 20,
  },
  itemAuthor: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    color: '#818cf8',
    fontWeight: '600',
    marginTop: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepperButton: {
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  stepperValue: {
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#818cf8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
