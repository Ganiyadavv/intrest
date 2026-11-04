import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { useLanguage } from '../contexts/LanguageContext';

type PublicHomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PublicHome'>;

interface Props {
  navigation: PublicHomeScreenNavigationProp;
}

export const PublicHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        {/* Brand Logo & Title */}
        <View style={styles.brandRow}>
          <View style={styles.brandLogoCircle}>
            <Text style={styles.brandRupeeText}>₹</Text>
            <Ionicons name="leaf" size={11} color="#16A34A" style={styles.brandLeafIcon} />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitleText}>DhanaMitra</Text>
          </View>
        </View>

        {/* Right Actions: Language Selector + Profile Login Icon */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.languagePill}
            onPress={() => setLanguage(language === 'en' ? 'te' : 'en')}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.languagePillText}>
              {language === 'en' ? 'English' : 'తెలుగు'}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#FFFFFF" style={{ marginLeft: 3 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileCircleBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO BANNER CARD */}
        <View style={styles.heroCard}>
          <Image
            source={require('../../assets/hero-money-bag.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />

          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>
              {language === 'en' ? (
                <>
                  Smart Interest{' '}
                  <Text style={styles.heroTitleHighlight}>Management</Text>
                </>
              ) : (
                t('dashboard.smartInterest')
              )}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('dashboard.trackLoans')}
            </Text>
          </View>
        </View>

        {/* 3. QUICK TOOLS CARD (4-IN-A-ROW HORIZONTAL) */}
        <View style={styles.toolsCard}>
          <View style={styles.toolsRow}>
            {/* Tool 1: Simple Interest */}
            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => navigation.navigate('InterestCalculator')}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="sunny" size={24} color="#F97316" />
              </View>
              <Text style={styles.toolLabel} numberOfLines={2}>
                {t('tools.simpleInterest')}
              </Text>
            </TouchableOpacity>

            {/* Tool 2: Compound Interest */}
            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => navigation.navigate('CompoundInterest')}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="trending-up" size={24} color="#10B981" />
              </View>
              <Text style={styles.toolLabel} numberOfLines={2}>
                {t('tools.compoundInterest')}
              </Text>
            </TouchableOpacity>

            {/* Tool 3: EMI Calculator */}
            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => navigation.navigate('EMICalculator')}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="calculator" size={24} color="#2563EB" />
              </View>
              <Text style={styles.toolLabel} numberOfLines={2}>
                {t('tools.emiCalculator')}
              </Text>
            </TouchableOpacity>

            {/* Tool 4: Rate Calculator */}
            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => navigation.navigate('RateCalculator')}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="pie-chart" size={23} color="#7C3AED" />
              </View>
              <Text style={styles.toolLabel} numberOfLines={2}>
                {t('tools.rateCalculator')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. WANT TO MANAGE YOUR RECORDS CARD */}
        <View style={styles.manageCard}>
          {/* Floating Top Lock Badge */}
          <View style={styles.floatingLockBadge}>
            <Ionicons name="lock-closed" size={22} color="#FFFFFF" />
          </View>

          {/* Card Title & Subtitle */}
          <Text style={styles.manageTitle}>{t('home.wantToManage')}</Text>
          <Text style={styles.manageSubtitle}>{t('home.wantToManageSubtitle')}</Text>

          {/* Mini Cards Row (Side by Side) */}
          <View style={styles.miniCardsRow}>
            {/* Lender Records */}
            <TouchableOpacity
              style={styles.miniCardLender}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <View style={styles.miniIconCircleBlue}>
                <Ionicons name="person" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.miniCardText} numberOfLines={2}>
                {t('home.lenderRecords')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {/* Borrower Records */}
            <TouchableOpacity
              style={styles.miniCardBorrower}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <View style={styles.miniIconCircleGreen}>
                <Ionicons name="people" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.miniCardText} numberOfLines={2}>
                {t('home.borrowerRecords')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.signInButtonText}>{t('home.signInOrCreate')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#044E28',
  },
  topAppBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#044E28',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  brandRupeeText: {
    color: '#045D30',
    fontSize: 22,
    fontWeight: '800',
  },
  brandLeafIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  brandTextCol: {
    alignItems: 'flex-start',
  },
  brandTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandTeluguText: {
    color: '#A7F3D0',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  languagePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  profileCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#044E28',
    ...Platform.select({
      web: {
        backgroundImage: 'radial-gradient(circle at 85% 15%, #086638 0%, #044E28 50%, #02361A 100%)',
      },
    }),
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: 'rgba(2, 60, 32, 0.72)',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  heroImage: {
    width: 86,
    height: 82,
    borderRadius: 12,
  },
  heroTextCol: {
    flex: 1,
    paddingLeft: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  heroTitleHighlight: {
    color: '#FBBF24',
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 5,
  },
  toolsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toolItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  toolIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 15,
  },
  manageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    paddingTop: 32,
    marginTop: 22,
    marginBottom: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  floatingLockBadge: {
    position: 'absolute',
    top: -24,
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#056B38',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.16)',
      },
    }),
  },
  manageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  manageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 16,
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  miniCardLender: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  miniCardBorrower: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  miniIconCircleBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  miniIconCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  miniCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    flexShrink: 1,
    lineHeight: 16,
  },
  signInButton: {
    backgroundColor: '#056B38',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 10px rgba(5, 107, 56, 0.25)',
      },
    }),
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
