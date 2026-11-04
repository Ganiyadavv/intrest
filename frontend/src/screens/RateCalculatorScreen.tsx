import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatCurrency } from '../utils/currency';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RateCalculatorScreenNavigationProp = NativeStackNavigationProp<any, 'RateCalculator'>;

interface Props {
  navigation: RateCalculatorScreenNavigationProp;
}

export const RateCalculatorScreen: React.FC<Props> = ({ navigation }) => {
  const [principal, setPrincipal] = useState('');
  const [interestAmt, setInterestAmt] = useState('');
  const [years, setYears] = useState('0');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('0');

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [result, setResult] = useState<{
    principal: number;
    monthlyRate: number;
    yearlyRate: number;
    monthlyInterest: number;
    yearlyInterest: number;
    totalInterest: number;
    totalAmount: number;
    timeLabel: string;
  } | null>(null);

  // Helper for numeric duration change
  const handleDurationChange = (val: string, setter: (v: string) => void) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 1 && cleaned.startsWith('0')) {
      setter(cleaned.replace(/^0+/, ''));
    } else {
      setter(cleaned);
    }
  };

  const handleCalculate = () => {
    setError('');
    setResult(null);

    const p = parseFloat(principal);
    const i = parseFloat(interestAmt);
    const y = years ? parseInt(years, 10) : 0;
    const m = months ? parseInt(months, 10) : 0;
    const d = days ? parseInt(days, 10) : 0;

    // Validation
    if (!principal || isNaN(p) || p <= 0) {
      setError('Principal amount is required and must be greater than 0');
      return;
    }
    if (!interestAmt || isNaN(i) || i <= 0) {
      setError('Interest amount is required and must be greater than 0');
      return;
    }
    if (isNaN(y) || y < 0) {
      setError('Years cannot be negative');
      return;
    }
    if (isNaN(m) || m < 0 || m > 11) {
      setError('Months must be between 0 and 11');
      return;
    }
    if (isNaN(d) || d < 0 || d > 30) {
      setError('Days must be between 0 and 30');
      return;
    }

    const totalMonths = y * 12 + m + d / 30;

    if (totalMonths <= 0) {
      setError('Total time must be greater than 0');
      return;
    }

    // Calculations
    const monthlyRate = (i / p / totalMonths) * 100;
    const yearlyRate = monthlyRate * 12;
    const monthlyInterest = (p * monthlyRate) / 100;
    const yearlyInterest = monthlyInterest * 12;
    const totalInterest = i; // Total interest paid
    const totalAmount = p + i;

    const timeParts: string[] = [];
    if (y > 0) timeParts.push(`${y} Yr${y > 1 ? 's' : ''}`);
    if (m > 0) timeParts.push(`${m} Mo${m > 1 ? 's' : ''}`);
    if (d > 0) timeParts.push(`${d} Day${d > 1 ? 's' : ''}`);
    const timeLabel = timeParts.length > 0 ? timeParts.join(' ') : '0 Months';

    setResult({
      principal: p,
      monthlyRate,
      yearlyRate,
      monthlyInterest,
      yearlyInterest,
      totalInterest,
      totalAmount,
      timeLabel,
    });
  };

  const handleReset = () => {
    setPrincipal('');
    setInterestAmt('');
    setYears('0');
    setMonths('0');
    setDays('0');
    setError('');
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP APP BAR (DhanaMitra Dark Green Header matching Pic 1) */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Brand Center */}
        <View style={styles.brandCenter}>
          <View style={styles.brandLogoCircle}>
            <Text style={styles.brandRupeeText}>₹</Text>
            <Ionicons name="leaf" size={10} color="#4ADE80" style={styles.brandLeafIcon} />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitleText}>DhanaMitra</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleReset} style={styles.headerIconBtn} activeOpacity={0.7}>
          <Ionicons name="reload" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* 2. TITLE SECTION WITH GRAPHIC ILLUSTRATION (Matching Pic 1) */}
          <View style={styles.titleSection}>
            <View style={styles.titleLeftCol}>
              <Text style={styles.screenTitle}>Rate Calculator</Text>
              <Text style={styles.screenSubtitle}>
                Find interest rate or time for your loan
              </Text>
            </View>

            {/* Graphic Illustration (Rupee coin, % coin, and calculator) */}
            <View style={styles.illustrationWrapper}>
              <View style={styles.illustrationCircle}>
                <View style={styles.leafDecor1} />
                <View style={styles.leafDecor2} />

                {/* Calculator icon badge */}
                <View style={styles.calcGraphicBadge}>
                  <Ionicons name="calculator" size={26} color="#056B38" />
                </View>

                {/* % Coin Badge */}
                <View style={styles.percentCoinBadge}>
                  <Text style={styles.percentCoinText}>%</Text>
                </View>

                {/* Rupee Coin Badge */}
                <View style={styles.rupeeCoinBadge}>
                  <Text style={styles.rupeeCoinText}>₹</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3. FORM CARD (Preserving all fields: Principal, Interest, Years, Months, Days) */}
          <View style={styles.formCard}>
            {error ? <ErrorMessage message={error} /> : null}

            {/* Field: Principal Amount (₹) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Principal Amount (₹)</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'principal' && styles.inputBoxFocused,
                ]}
              >
                <View style={styles.inputPrefixBadge}>
                  <Text style={styles.inputPrefixBadgeText}>₹</Text>
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    { outlineStyle: 'none' } as any,
                  ]}
                  placeholder="e.g., 20000"
                  placeholderTextColor="#94A3B8"
                  value={principal}
                  onChangeText={setPrincipal}
                  onFocus={() => setFocusedField('principal')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Field: Interest Amount (₹) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Interest Amount (₹)</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'interest' && styles.inputBoxFocused,
                ]}
              >
                <View style={[styles.inputPrefixBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="trending-up" size={16} color="#D97706" />
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    { outlineStyle: 'none' } as any,
                  ]}
                  placeholder="e.g., 2000"
                  placeholderTextColor="#94A3B8"
                  value={interestAmt}
                  onChangeText={setInterestAmt}
                  onFocus={() => setFocusedField('interest')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Field: Time Period (Years, Months, Days) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Time Period</Text>
              <View style={styles.durationInputRow}>
                {/* Years */}
                <View style={styles.durationCol}>
                  <Text style={styles.durationSubLabel}>Years</Text>
                  <View
                    style={[
                      styles.durationBox,
                      focusedField === 'years' && styles.durationBoxFocused,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.durationTextInput,
                        { outlineStyle: 'none' } as any,
                      ]}
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      value={years}
                      onFocus={() => {
                        setFocusedField('years');
                        if (years === '0') setYears('');
                      }}
                      onBlur={() => {
                        setFocusedField(null);
                        if (years === '') setYears('0');
                      }}
                      onChangeText={(val) => handleDurationChange(val, setYears)}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                  </View>
                </View>

                {/* Months */}
                <View style={styles.durationCol}>
                  <Text style={styles.durationSubLabel}>Months</Text>
                  <View
                    style={[
                      styles.durationBox,
                      focusedField === 'months' && styles.durationBoxFocused,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.durationTextInput,
                        { outlineStyle: 'none' } as any,
                      ]}
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      value={months}
                      onFocus={() => {
                        setFocusedField('months');
                        if (months === '0') setMonths('');
                      }}
                      onBlur={() => {
                        setFocusedField(null);
                        if (months === '') setMonths('0');
                      }}
                      onChangeText={(val) => handleDurationChange(val, setMonths)}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                  </View>
                </View>

                {/* Days */}
                <View style={styles.durationCol}>
                  <Text style={styles.durationSubLabel}>Days</Text>
                  <View
                    style={[
                      styles.durationBox,
                      focusedField === 'days' && styles.durationBoxFocused,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.durationTextInput,
                        { outlineStyle: 'none' } as any,
                      ]}
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      value={days}
                      onFocus={() => {
                        setFocusedField('days');
                        if (days === '0') setDays('');
                      }}
                      onBlur={() => {
                        setFocusedField(null);
                        if (days === '') setDays('0');
                      }}
                      onChangeText={(val) => handleDurationChange(val, setDays)}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                  </View>
                </View>
              </View>

              {/* Duration Preview Badge */}
              <View style={styles.durationPreviewPill}>
                <Ionicons name="time-outline" size={14} color="#056B38" />
                <Text style={styles.durationPreviewText}>
                  {(parseInt(years, 10) || 0) === 0 &&
                  (parseInt(months, 10) || 0) === 0 &&
                  (parseInt(days, 10) || 0) === 0
                    ? 'Duration: 0 Years, 0 Months, 0 Days'
                    : `Duration: ${years || 0} Yrs, ${months || 0} Mos, ${days || 0} Days`}
                </Text>
              </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={styles.calculateBtn}
              onPress={handleCalculate}
              activeOpacity={0.85}
            >
              <Ionicons name="calculator" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.calculateBtnText}>Calculate Rate</Text>
            </TouchableOpacity>
          </View>

          {/* 4. RESULT CARD (Matching Pic 1 Rate Calculation Result) */}
          {result && (
            <View style={styles.resultCard}>
              {/* Header */}
              <View style={styles.resultHeader}>
                <View style={styles.resultIconCircle}>
                  <Ionicons name="trending-up" size={18} color="#056B38" />
                </View>
                <Text style={styles.resultTitle}>Rate Calculation Result</Text>
              </View>

              {/* Featured Rate Highlight Box (Matching Pic 1) */}
              <View style={styles.rateHighlightBox}>
                <Text style={styles.rateHighlightLabel}>Interest Rate (Monthly)</Text>
                <Text style={styles.rateHighlightValue}>
                  {result.monthlyRate.toFixed(2)}%
                </Text>
                <View style={styles.ratePill}>
                  <Text style={styles.ratePillText}>
                    {result.yearlyRate.toFixed(2)}% per annum (p.a.)
                  </Text>
                </View>

                {/* Explanatory sentence matching Pic 1 */}
                <Text style={styles.rateExplanation}>
                  You paid {formatCurrency(result.totalInterest)} as interest on{' '}
                  {formatCurrency(result.principal)} in {result.timeLabel}.
                </Text>
              </View>

              {/* 2-Column Mini Stat Cards (Matching Pic 1 bottom cards) */}
              <View style={styles.miniStatsRow}>
                {/* Total Amount Card */}
                <View style={styles.miniStatCard}>
                  <View style={styles.miniStatIconBox}>
                    <Ionicons name="wallet-outline" size={16} color="#056B38" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniStatLabel}>Total Amount</Text>
                    <Text style={styles.miniStatValue}>
                      {formatCurrency(result.totalAmount)}
                    </Text>
                  </View>
                </View>

                {/* Total Interest Card */}
                <View style={styles.miniStatCard}>
                  <View style={[styles.miniStatIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="trending-up-outline" size={16} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniStatLabel}>Total Interest</Text>
                    <Text style={styles.miniStatValue}>
                      {formatCurrency(result.totalInterest)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Detailed Breakdown Rows */}
              <View style={styles.breakdownDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Monthly Interest</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(result.monthlyInterest)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Yearly Interest</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(result.yearlyInterest)}
                  </Text>
                </View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Time Duration</Text>
                  <Text style={styles.detailValue}>{result.timeLabel}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#056B38',
  },
  topAppBar: {
    backgroundColor: '#056B38',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  brandRupeeText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  brandLeafIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSubtitleText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
    marginTop: -2,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingBottom: 36,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  titleLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  illustrationWrapper: {
    width: 90,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  leafDecor1: {
    position: 'absolute',
    top: 6,
    right: 12,
    width: 14,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#86EFAC',
    transform: [{ rotate: '25deg' }],
    opacity: 0.7,
  },
  leafDecor2: {
    position: 'absolute',
    top: 14,
    right: 4,
    width: 12,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4ADE80',
    transform: [{ rotate: '50deg' }],
    opacity: 0.8,
  },
  calcGraphicBadge: {
    width: 44,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#056B38',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  percentCoinBadge: {
    position: 'absolute',
    bottom: 6,
    left: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#056B38',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  percentCoinText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rupeeCoinBadge: {
    position: 'absolute',
    top: 6,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#056B38',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  rupeeCoinText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 52,
    paddingHorizontal: 12,
  },
  inputBoxFocused: {
    borderColor: '#056B38',
  },
  inputPrefixBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  inputPrefixBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#056B38',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      } as any,
    }),
  },
  durationInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  durationCol: {
    flex: 1,
  },
  durationSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'center',
  },
  durationBox: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  durationBoxFocused: {
    borderColor: '#056B38',
    backgroundColor: '#FFFFFF',
  },
  durationTextInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 18,
    color: '#1E293B',
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      } as any,
    }),
  },
  durationPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'center',
  },
  durationPreviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  calculateBtn: {
    backgroundColor: '#056B38',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#056B38',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(5, 107, 56, 0.25)',
      },
    }),
  },
  calculateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#056B38',
  },
  rateHighlightBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  rateHighlightLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  rateHighlightValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#056B38',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  ratePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  ratePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  rateExplanation: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    fontWeight: '500',
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  miniStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 10,
  },
  miniStatIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  breakdownDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
});
