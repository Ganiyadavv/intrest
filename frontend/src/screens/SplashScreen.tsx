import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { authService } from '../services/authService';
import { getUser } from '../storage/storage';
import { COLORS } from '../constants/colors';
import { Loading } from '../components/Loading';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const checkToken = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          const user = await getUser();
          if (user?.role === 'ADMIN') {
            navigation.replace('Admin', { screen: 'AdminDashboard' });
          } else {
            navigation.replace('Main', { screen: 'Dashboard' });
          }
        } else {
          navigation.replace('Auth', { screen: 'Login' });
        }
      } catch (error) {
        navigation.replace('Auth', { screen: 'Login' });
      }
    };

    // Small delay to show the splash screen text
    setTimeout(() => {
      checkToken();
    }, 1000);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interest</Text>
      <Text style={styles.subtitle}>Management</Text>
      <Loading message="Loading..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: -8,
  },
  subtitle: {
    fontSize: 24,
    color: COLORS.PRIMARY_LIGHT,
    marginBottom: 48,
  },
});
