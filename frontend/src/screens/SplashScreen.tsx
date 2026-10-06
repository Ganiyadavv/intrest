import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Easing, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { authService } from '../services/authService';
import { getUser } from '../storage/storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulse animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

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

    // Extended timeout to allow user to appreciate the splash screen
    setTimeout(() => {
      checkToken();
    }, 2500);
  }, [navigation, fadeAnim, scaleAnim, pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Background Decorative Elements */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />
      
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="wallet" size={54} color="#FFF" />
        </Animated.View>
        <Text style={styles.title}>DhanaMitra</Text>
        <Text style={styles.subtitle}>Smart Interest Calculator{'\n'}Lender & Borrower Records</Text>
      </Animated.View>
      
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>SECURE • RELIABLE • FAST</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark modern slate background
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circleTopRight: {
    position: 'absolute',
    top: -height * 0.15,
    right: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: '#3B82F6', // Blue tint
    opacity: 0.12,
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -height * 0.15,
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#10B981', // Emerald tint
    opacity: 0.12,
  },
  contentContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.6)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
