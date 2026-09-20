const React = require('react');

if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  const store = {};
  return {
    setItemAsync: jest.fn(async (key, value) => {
      store[key] = value;
    }),
    getItemAsync: jest.fn(async (key) => {
      return store[key] || null;
    }),
    deleteItemAsync: jest.fn(async (key) => {
      delete store[key];
    }),
    __clearMockStore: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
});

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '192.168.1.100:8081',
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    NavigationContainer: ({ children }) => children,
  };
});

// Mock @react-navigation/native-stack
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children, initialRouteName }) => {
        const childArray = React.Children.toArray(children);
        const active =
          childArray.find((c) => c && c.props && c.props.name === initialRouteName) || childArray[0];
        return active || null;
      },
      Screen: ({ component: Component, children }) =>
        Component ? React.createElement(Component) : children,
    }),
  };
});

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children, initialRouteName }) => {
        const childArray = React.Children.toArray(children);
        const active =
          childArray.find((c) => c && c.props && c.props.name === initialRouteName) || childArray[0];
        return active || null;
      },
      Screen: ({ component: Component, children }) =>
        Component ? React.createElement(Component) : children,
    }),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});
