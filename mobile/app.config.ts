import type { ExpoConfig } from 'expo/config';

/**
 * Android-only Expo app, run as a development build (`expo-dev-client`).
 * Expo Go is not supported.
 *
 * EXPO_PUBLIC_API_URL is inlined into the JS bundle at build time. CI builds
 * the APK with http://localhost:4000 and uses `adb reverse tcp:4000 tcp:4000`.
 */
const config: ExpoConfig = {
  name: 'BuggyBooks',
  slug: 'buggybooks',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'buggybooks',
  platforms: ['android'],
  android: {
    package: 'com.buggybooks.app',
    adaptiveIcon: {
      backgroundColor: '#0f172a',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  plugins: [
    'expo-dev-client',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        // The backend under test is plain HTTP on localhost / the LAN.
        android: { usesCleartextTraffic: true },
      },
    ],
  ],
};

export default config;
