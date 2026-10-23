import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
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
    iconColor: string,
    iconBgColor: string
  ) => (
    <TouchableOpacity
      style={styles.neuButtonWrapper}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.neuButtonCircle}>
        <View style={[styles.neuIconBadge, { backgroundColor: iconBgColor }]}>
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
                '#F59E0B',
                'rgba(245, 158, 11, 0.12)'
              )}

              {/* 2. Compound Interest */}
              {renderNeumorphicButton(
                t('home.compoundInterest'),
                () => navigation.navigate('CompoundInterest'),
                'trending-up',
                '#EC4899',
                'rgba(236, 72, 153, 0.12)'
              )}

              {/* 3. Rate Calculator */}
              {renderNeumorphicButton(
                t('home.rateCalculator'),
                () => navigation.navigate('RateCalculator'),
                'pie-chart',
                '#EC4899',
                'rgba(236, 72, 153, 0.12)'
              )}
            </View>

            {/* WANT TO MANAGE YOUR RECORDS CARD (Matching Pic 1) */}
            <View style={styles.manageCardContainer}>
              {/* Floating Center Lock Badge */}
              <View style={styles.lockBadgeOuter}>
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.manageCardTitle}>{t('home.wantToManage')}</Text>
              <Text style={styles.manageCardSubtitle}>{t('home.wantToManageSubtitle')}</Text>

              {/* Two Feature Boxes (Lender & Borrower Records) */}
              <View style={styles.recordsRow}>
                {/* Lender Records Box */}
                <TouchableOpacity
                  style={styles.recordBoxBlue}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.7}
                >
                  <View style={styles.recordIconCircleBlue}>
                    <Ionicons name="person" size={18} color="#2563EB" />
                  </View>
                  <View style={styles.recordTextBox}>
                    <Text style={styles.recordBoxTitle} numberOfLines={1}>{t('home.lenderRecords')}</Text>
                    <View style={styles.recordStatusRow}>
                      <Text style={styles.recordStatusText}>{t('home.signInToAccess')}</Text>
                      <Ionicons name="lock-closed" size={10} color="#64748B" style={styles.miniLockIcon} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Borrower Records Box */}
                <TouchableOpacity
                  style={styles.recordBoxGreen}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.7}
                >
                  <View style={styles.recordIconCircleGreen}>
                    <Ionicons name="people" size={18} color="#10B981" />
                  </View>
                  <View style={styles.recordTextBox}>
                    <Text style={styles.recordBoxTitle} numberOfLines={1}>{t('home.borrowerRecords')}</Text>
                    <View style={styles.recordStatusRow}>
                      <Text style={styles.recordStatusText}>{t('home.signInToAccess')}</Text>
                      <Ionicons name="lock-closed" size={10} color="#64748B" style={styles.miniLockIcon} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Primary Action Button: Sign In / Create Account */}
              <TouchableOpacity
                style={styles.mainActionButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
                <Text style={styles.mainActionButtonText}>{t('home.signInOrCreate')}</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Device Indicator Bar (Matching Pic 1) */}
            <View style={styles.homeIndicatorBar} />
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
    paddingTop: 36,
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomRightRadius: 70,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    color: '#FFF',
    fontSize: 30,
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
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  languageToggleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  neonCard: {
    backgroundColor: 'rgba(38, 40, 69, 0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconGroup: {
    flexDirection: 'row',
    marginRight: 14,
    width: 64,
    height: 64,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  bannerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 17,
  },
  waveConnectorDark: {
    height: 55,
    backgroundColor: '#1A1B2F',
    marginTop: -1,
    zIndex: 1,
  },
  waveConnectorLightCutout: {
    flex: 1,
    backgroundColor: '#E9EFF5',
    borderTopLeftRadius: 70,
  },
  bottomLightSection: {
    backgroundColor: '#E9EFF5',
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginTop: -1,
  },
  neuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    marginBottom: 8,
  },
  neuButtonWrapper: {
    width: (width - 40 - 24) / 3,
    alignItems: 'center',
  },
  neuButtonCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 18px rgba(100, 116, 139, 0.16), 0 2px 6px rgba(100, 116, 139, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
      },
    }),
  },
  neuIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  neuButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7A93',
    textAlign: 'center',
  },
  manageCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 16,
    marginTop: 48,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(219, 234, 254, 0.9)',
    position: 'relative',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  lockBadgeOuter: {
    position: 'absolute',
    top: -23,
    alignSelf: 'center',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E9EFF5',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  manageCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  manageCardSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  recordsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  recordBoxBlue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  recordBoxGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  recordIconCircleBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIconCircleGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordTextBox: {
    marginLeft: 8,
    flex: 1,
  },
  recordBoxTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  recordStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordStatusText: {
    fontSize: 10,
    color: '#64748B',
  },
  miniLockIcon: {
    marginLeft: 3,
  },
  mainActionButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginLeft: 8,
  },
  homeIndicatorBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
});
