import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { authService } from '../services/authService';
import { getUser } from '../storage/storage';

const { width } = Dimensions.get('window');

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 12,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle gentle breathing animation for illustration
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
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
          navigation.replace('Auth', { screen: 'PublicHome' });
        }
      } catch (error) {
        navigation.replace('Auth', { screen: 'PublicHome' });
      }
    };

    const timer = setTimeout(() => {
      checkToken();
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim, pulseAnim]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Background Soft Mint Ambient Elements */}
      <View style={styles.ambientTopCircle} />
      <View style={styles.ambientBottomCircle} />

      <Animated.View
        style={[
          styles.contentWrapper,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* 1. TOP BRAND HEADER */}
        <View style={styles.brandRow}>
          <View style={styles.brandLogoCircle}>
            <Text style={styles.brandRupeeText}>₹</Text>
            <Ionicons name="leaf" size={13} color="#056B38" style={styles.brandLeafIcon} />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitleText}>DhanaMitra</Text>
          </View>
        </View>

        {/* 2. CENTER HERO ILLUSTRATION */}
        <Animated.View
          style={[
            styles.illustrationContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Image
            source={require('../../assets/splash-hero-illustration.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 3. HEADLINE & DESCRIPTION */}
        <View style={styles.textContainer}>
          <Text style={styles.headlineText}>Track. Manage. Grow.</Text>
          <Text style={styles.headlineText}>Your Money, Smartly.</Text>

          <Text style={styles.descriptionText}>
            DhanaMitra helps you manage loans,{'\n'}track repayments and grow your{'\n'}financial clarity.
          </Text>
        </View>

        {/* 4. FOOTER PROGRESS INDICATOR */}
        <View style={styles.footerContainer}>
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { opacity: pulseAnim },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    overflow: 'hidden',
  },
  ambientTopCircle: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#DCFCE7',
    opacity: 0.45,
  },
  ambientBottomCircle: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#ECFDF5',
    opacity: 0.6,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  brandLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#056B38',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
    shadowColor: '#056B38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  brandRupeeText: {
    color: '#056B38',
    fontSize: 24,
    fontWeight: '800',
  },
  brandLeafIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  brandTextCol: {
    alignItems: 'flex-start',
  },
  brandTitleText: {
    color: '#056B38',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  brandTeluguText: {
    color: '#056B38',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 12,
  },
  heroImage: {
    width: Math.min(width * 0.78, 280),
    height: Math.min(width * 0.78 * (175 / 288), 180),
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  headlineText: {
    fontSize: 23,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 29,
  },
  descriptionText: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarTrack: {
    width: 100,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#056B38',
    borderRadius: 2,
  },
});
