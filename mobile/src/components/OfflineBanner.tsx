import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { isSimulatedOffline, onNetworkStatusChange } from '../api/client';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(isSimulatedOffline());

  useEffect(() => {
    return onNetworkStatusChange((offline) => {
      setIsOffline(offline);
    });
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.banner} testID="offline_banner">
      <Text style={styles.text}>⚠️ Offline Mode Enabled • Network Disconnected (ECONNABORTED)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
