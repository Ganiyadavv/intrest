import { registerRootComponent } from 'expo';
import { LogBox, Platform } from 'react-native';

// Suppress known third-party library deprecation warnings on Web and Native
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'Animated: `useNativeDriver` is not supported',
  'ImagePicker.MediaTypeOptions have been deprecated',
]);

if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const firstArg = typeof args[0] === 'string' ? args[0] : '';
    if (
      firstArg.includes('props.pointerEvents is deprecated') ||
      firstArg.includes('useNativeDriver is not supported') ||
      firstArg.includes('ImagePicker.MediaTypeOptions have been deprecated')
    ) {
      return;
    }
    originalWarn(...args);
  };
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
