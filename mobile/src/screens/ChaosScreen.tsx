import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import type { ChaosConfig } from '@buggybooks/types';
import {
  apiClient,
  isSimulatedOffline,
  setSimulatedOffline,
  onNetworkStatusChange,
} from '../api/client';
import * as Haptics from 'expo-haptics';

export function ChaosScreen() {
  const [config, setConfig] = useState<ChaosConfig | null>(null);
  const [checkoutFailureRate, setCheckoutFailureRate] = useState(0.15);
  const [inventoryDelayMs, setInventoryDelayMs] = useState(3000);
  const [inventoryLockingRate, setInventoryLockingRate] = useState(0.0);
  const [uploadFailureRate, setUploadFailureRate] = useState(0.0);
  const [isOffline, setIsOffline] = useState(isSimulatedOffline());

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const bannerTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return onNetworkStatusChange((offline) => {
      setIsOffline(offline);
    });
  }, []);

  const handleToggleOffline = (val: boolean) => {
    setSimulatedOffline(val);
    setIsOffline(val);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium)?.catch?.(() => {});
  };

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<ChaosConfig>('/api/test/config');
      if (response.data) {
        setConfig(response.data);
        setCheckoutFailureRate(response.data.checkoutFailureRate ?? 0.15);
        setInventoryDelayMs(response.data.inventoryDelayMs ?? 3000);
        setInventoryLockingRate(response.data.inventoryLockingRate ?? 0.0);
        setUploadFailureRate(response.data.uploadFailureRate ?? 0.0);
      }
    } catch {
      // Fallback default if test endpoint unmapped in mock mode
      setConfig({
        checkoutFailureRate: 0.15,
        inventoryDelayMs: 3000,
        jwtExpirySeconds: 900,
        websocketDropRate: 0.0,
        uploadFailureRate: 0.0,
        injectA11yViolations: false,
        visualChaos: false,
        inventoryLockingRate: 0.0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setBannerMessage(null);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium)?.catch?.(() => {});

    try {
      const payload: Partial<ChaosConfig> = {
        checkoutFailureRate: Number(checkoutFailureRate.toFixed(2)),
        inventoryDelayMs: Math.round(inventoryDelayMs),
        inventoryLockingRate: Number(inventoryLockingRate.toFixed(2)),
        uploadFailureRate: Number(uploadFailureRate.toFixed(2)),
      };

      const res = await apiClient.post<{ success: boolean; config: ChaosConfig }>(
        '/api/test/config',
        payload
      );

      if (res.data.config) {
        setConfig(res.data.config);
      }
      setBannerMessage({ text: '✓ Chaos configuration saved successfully!' });
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success)?.catch?.(() => {});
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => setBannerMessage(null), 4000);
    } catch {
      setBannerMessage({ text: '⚠️ Failed to save chaos configuration.', isError: true });
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error)?.catch?.(() => {});
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Database & Chaos',
      'This will clear all test carts, restore initial book inventory, and reset all failure rates to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            setBannerMessage(null);
            Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy)?.catch?.(() => {});

            try {
              await apiClient.post('/api/test/reset');
              setCheckoutFailureRate(0.15);
              setInventoryDelayMs(3000);
              setInventoryLockingRate(0.0);
              setUploadFailureRate(0.0);
              setBannerMessage({ text: '✓ Test database and chaos config reset to defaults!' });
              Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success)?.catch?.(() => {});
              if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
              bannerTimerRef.current = setTimeout(() => setBannerMessage(null), 4000);
            } catch {
              setBannerMessage({ text: '⚠️ Failed to reset test database.', isError: true });
              Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error)?.catch?.(() => {});
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };


  if (isLoading && !config) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer} testID="chaos-loading">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>⚡</Text>
          <Text style={styles.headerTitle}>Chaos Control Center</Text>
          <Text style={styles.headerSubtitle}>
            Configure deliberate faults, latencies, and stochastic failure rates to test resilience.
          </Text>
        </View>

        {bannerMessage && (
          <View
            style={[
              styles.banner,
              bannerMessage.isError ? styles.bannerError : styles.bannerSuccess,
            ]}
            testID="chaos-banner"
          >
            <Text
              style={[
                styles.bannerText,
                bannerMessage.isError ? styles.bannerTextError : styles.bannerTextSuccess,
              ]}
            >
              {bannerMessage.text}
            </Text>
          </View>
        )}

        {/* Checkout Gateway Failure Rate */}
        <View style={styles.controlCard} testID="card-checkout-failure">
          <View style={styles.controlHeader}>
            <Text style={styles.controlTitle}>💥 Checkout Failure Rate</Text>
            <Text style={styles.controlValue} testID="val-checkout-failure">
              {Math.round(checkoutFailureRate * 100)}%
            </Text>
          </View>
          <Text style={styles.controlDesc}>
            Stochastically throws 500 Payment Gateway Timeout during order checkout.
          </Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setCheckoutFailureRate((v) => Math.max(0, Number((v - 0.05).toFixed(2))))}
              testID="btn-dec-checkout-failure"
            >
              <Text style={styles.stepBtnText}>− 5%</Text>
            </TouchableOpacity>
            <View style={styles.presets}>
              <TouchableOpacity
                style={[styles.presetBadge, checkoutFailureRate === 0 && styles.presetBadgeActive]}
                onPress={() => setCheckoutFailureRate(0)}
                testID="preset-checkout-0"
              >
                <Text style={styles.presetText}>0%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBadge, checkoutFailureRate === 0.15 && styles.presetBadgeActive]}
                onPress={() => setCheckoutFailureRate(0.15)}
                testID="preset-checkout-15"
              >
                <Text style={styles.presetText}>15%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBadge, checkoutFailureRate === 0.5 && styles.presetBadgeActive]}
                onPress={() => setCheckoutFailureRate(0.5)}
                testID="preset-checkout-50"
              >
                <Text style={styles.presetText}>50%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBadge, checkoutFailureRate === 1.0 && styles.presetBadgeActive]}
                onPress={() => setCheckoutFailureRate(1.0)}
                testID="preset-checkout-100"
              >
                <Text style={styles.presetText}>100%</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setCheckoutFailureRate((v) => Math.min(1, Number((v + 0.05).toFixed(2))))}
              testID="btn-inc-checkout-failure"
            >
              <Text style={styles.stepBtnText}>+ 5%</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inventory Processing Delay */}
        <View style={styles.controlCard} testID="card-inventory-delay">
          <View style={styles.controlHeader}>
            <Text style={styles.controlTitle}>⏳ Inventory Processing Delay</Text>
            <Text style={styles.controlValue} testID="val-inventory-delay">
              {inventoryDelayMs}ms
            </Text>
          </View>
          <Text style={styles.controlDesc}>
            Artificially delays book catalog and inventory calculations.
          </Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setInventoryDelayMs((v) => Math.max(0, v - 500))}
              testID="btn-dec-inventory-delay"
            >
              <Text style={styles.stepBtnText}>− 500ms</Text>
            </TouchableOpacity>
            <View style={styles.presets}>
              <TouchableOpacity
                style={[styles.presetBadge, inventoryDelayMs === 0 && styles.presetBadgeActive]}
                onPress={() => setInventoryDelayMs(0)}
                testID="preset-delay-0"
              >
                <Text style={styles.presetText}>0s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBadge, inventoryDelayMs === 1000 && styles.presetBadgeActive]}
                onPress={() => setInventoryDelayMs(1000)}
                testID="preset-delay-1000"
              >
                <Text style={styles.presetText}>1s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBadge, inventoryDelayMs === 3000 && styles.presetBadgeActive]}
                onPress={() => setInventoryDelayMs(3000)}
                testID="preset-delay-3000"
              >
                <Text style={styles.presetText}>3s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBadge, inventoryDelayMs === 5000 && styles.presetBadgeActive]}
                onPress={() => setInventoryDelayMs(5000)}
                testID="preset-delay-5000"
              >
                <Text style={styles.presetText}>5s</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setInventoryDelayMs((v) => Math.min(10000, v + 500))}
              testID="btn-inc-inventory-delay"
            >
              <Text style={styles.stepBtnText}>+ 500ms</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Optimistic Locking Conflict Rate */}
        <View style={styles.controlCard} testID="card-locking-rate">
          <View style={styles.controlHeader}>
            <Text style={styles.controlTitle}>🔒 Inventory Lock Conflict Rate</Text>
            <Text style={styles.controlValue} testID="val-locking-rate">
              {Math.round(inventoryLockingRate * 100)}%
            </Text>
          </View>
          <Text style={styles.controlDesc}>
            Simulates optimistic lock version mismatch during checkout reservation.
          </Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setInventoryLockingRate((v) => Math.max(0, Number((v - 0.1).toFixed(2))))}
              testID="btn-dec-locking-rate"
            >
              <Text style={styles.stepBtnText}>− 10%</Text>
            </TouchableOpacity>
            <View style={styles.presets}>
              <TouchableOpacity
                style={[styles.presetBadge, inventoryLockingRate === 0 && styles.presetBadgeActive]}
                onPress={() => setInventoryLockingRate(0)}
              >
                <Text style={styles.presetText}>0%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBadge, inventoryLockingRate === 0.25 && styles.presetBadgeActive]}
                onPress={() => setInventoryLockingRate(0.25)}
              >
                <Text style={styles.presetText}>25%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBadge, inventoryLockingRate === 0.5 && styles.presetBadgeActive]}
                onPress={() => setInventoryLockingRate(0.5)}
              >
                <Text style={styles.presetText}>50%</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setInventoryLockingRate((v) => Math.min(1, Number((v + 0.1).toFixed(2))))}
              testID="btn-inc-locking-rate"
            >
              <Text style={styles.stepBtnText}>+ 10%</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Simulated Network Offline Mode (MOB-B5) */}
        <View style={styles.controlCard} testID="card-simulated-offline">
          <View style={styles.controlHeader}>
            <Text style={styles.controlTitle}>📡 Simulated Offline Mode</Text>
            <View style={[styles.statusPill, isOffline ? styles.statusOffline : styles.statusOnline]}>
              <Text style={styles.statusPillText}>{isOffline ? 'OFFLINE' : 'ONLINE'}</Text>
            </View>
          </View>
          <Text style={styles.controlDesc}>
            Simulate connection dropout (ECONNABORTED). All subsequent API calls immediately fail and a top warning banner is displayed.
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Simulate Connection Dropout</Text>
            <Switch
              value={isOffline}
              onValueChange={handleToggleOffline}
              trackColor={{ false: '#334155', true: '#ef4444' }}
              thumbColor={isOffline ? '#ffffff' : '#94a3b8'}
              testID="toggle_simulated_offline"
            />
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving ? styles.btnDisabled : null]}
            onPress={handleSaveConfig}
            disabled={isSaving}
            testID="btn-save-chaos"
            accessibilityRole="button"
            accessibilityLabel="Save chaos configuration"
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resetButton, isResetting ? styles.btnDisabled : null]}
            onPress={handleResetData}
            disabled={isResetting}
            testID="btn-reset-chaos"
            accessibilityRole="button"
            accessibilityLabel="Reset database and chaos configuration"
          >
            {isResetting ? (
              <ActivityIndicator color="#ef4444" size="small" />
            ) : (
              <Text style={styles.resetButtonText}>Reset Database & Chaos</Text>
            )}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  banner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  bannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  bannerTextSuccess: {
    color: '#6ee7b7',
  },
  bannerTextError: {
    color: '#fca5a5',
  },
  controlCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  controlTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  controlValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#818cf8',
  },
  controlDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepBtnText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  presets: {
    flexDirection: 'row',
    gap: 6,
  },
  presetBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetBadgeActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  presetText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
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
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  resetButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusOnline: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f8fafc',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
});
