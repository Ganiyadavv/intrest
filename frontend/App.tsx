import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/RootNavigation';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <AppNavigator />
    </NavigationContainer>
  );
}
