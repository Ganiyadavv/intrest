import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

type PublicHomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PublicHome'>;

interface Props {
  navigation: PublicHomeScreenNavigationProp;
}

export const PublicHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { language, setLanguage, t } = useLanguage();

  const renderNeumorphicButton = (
    title: string,
    onPress: () => void,
    iconName: keyof typeof Ionicons.glyphMap,
    iconColor: string
  ) => (
    <TouchableOpacity
      style={styles.neuButtonWrapper}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.neuButtonOuter}>
        <View style={styles.neuButtonInner}>
          <Ionicons name={iconName} size={28} color={iconColor} />
        </View>
      </View>
      <Text style={styles.neuButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.mainBackground}>
          {/* TOP DARK SECTION (Increased height & matching Dashboard design) */}
          <View style={styles.topDarkSection}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.brandTitle}>DhanaMitra</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.languageToggle}
                  onPress={() => setLanguage(language === 'en' ? 'te' : 'en')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.languageToggleText}>
                    {language === 'en' ? 'తెలుగు' : 'English'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginAvatar}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Smart Interest Project Banner Card */}
            <View style={styles.neonCard}>
              <View style={styles.bannerContainer}>
                <View style={styles.bannerIconGroup}>
                  <View style={[styles.bannerIconWrapper, { backgroundColor: 'rgba(74, 144, 226, 0.2)' }]}>
                    <Ionicons name="trending-up" size={32} color="#4A90E2" />
                  </View>
                  <View style={[styles.bannerIconWrapper, { backgroundColor: 'rgba(255, 107, 231, 0.2)', marginTop: -15, marginLeft: -10 }]}>
                    <Ionicons name="pie-chart" size={28} color="#FF6BE7" />
                  </View>
                  <View style={[styles.bannerIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.2)', marginTop: -5, marginLeft: -10 }]}>
                    <Ionicons name="cash" size={24} color="#10B981" />
                  </View>
                </View>

                <View style={styles.bannerTextContent}>
                  <Text style={styles.bannerTitle}>{t('dashboard.smartInterest')}</Text>
                  <Text style={styles.bannerSubtitle}>{t('dashboard.trackLoans')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* THE WAVE CONNECTOR (S curve) */}
          <View style={styles.waveConnectorDark}>
            <View style={styles.waveConnectorLightCutout} />
          </View>

          {/* BOTTOM LIGHT SECTION (Neumorphic circular buttons matching Dashboard) */}
          <View style={styles.bottomLightSection}>
            <View style={styles.neuGrid}>
              {/* 1. Simple Interest */}
              {renderNeumorphicButton(
                t('home.simpleInterest'),
                () => navigation.navigate('InterestCalculator'),
                'calculator',
                '#F5A623'
              )}

              {/* 2. Compound Interest */}
              {renderNeumorphicButton(
                t('home.compoundInterest'),
                () => navigation.navigate('CompoundInterest'),
                'trending-up',
                '#FF6BE7'
              )}

              {/* 3. Rate Calculator */}
              {renderNeumorphicButton(
                t('home.rateCalculator'),
                () => navigation.navigate('RateCalculator'),
                'pie-chart',
                '#FF6BE7'
              )}

              {/* 4. Interest Calculator */}
              {renderNeumorphicButton(
                t('home.interestCalculator'),
                () => navigation.navigate('InterestCalculator'),
                'calculator-outline',
                '#4A90E2'
              )}

              {/* 5. Sign In */}
              {renderNeumorphicButton(
                t('home.signIn'),
                () => navigation.navigate('Login'),
                'log-in',
                '#10B981'
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EFF5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainBackground: {
    flex: 1,
    backgroundColor: '#E9EFF5',
  },
  topDarkSection: {
    backgroundColor: '#1A1B2F',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomRightRadius: 80,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  brandTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  languageToggleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  neonCard: {
    backgroundColor: 'rgba(38, 40, 69, 0.9)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconGroup: {
    flexDirection: 'row',
    marginRight: 16,
    width: 70,
    height: 70,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#1A1B2F',
  },
  bannerTextContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  waveConnectorDark: {
    height: 80,
    backgroundColor: '#1A1B2F',
    marginTop: -1,
    zIndex: 1,
  },
  waveConnectorLightCutout: {
    flex: 1,
    backgroundColor: '#E9EFF5',
    borderTopLeftRadius: 80,
  },
  bottomLightSection: {
    backgroundColor: '#E9EFF5',
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 80,
    marginTop: -1,
  },
  neuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingTop: 30,
    gap: 15,
  },
  neuButtonWrapper: {
    width: (width - 48 - 30) / 3, // 3 columns, minus padding and gaps
    alignItems: 'center',
    marginBottom: 24,
  },
  neuButtonOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E9EFF5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 12,
  },
  neuButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E9EFF5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  neuButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7A93',
    textAlign: 'center',
  },
});
