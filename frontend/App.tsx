import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/RootNavigation';
import { StatusBar } from 'expo-status-bar';

import { LanguageProvider } from './src/contexts/LanguageContext';
import { warmUpBackend } from './src/services/api';

export default function App() {
  useEffect(() => {
    warmUpBackend();
  }, []);

  return (
    <LanguageProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </LanguageProvider>
  );
}
