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
import { calculateEMI, EMIResult } from '../utils/emiCalculator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type EMICalculatorScreenNavigationProp = NativeStackNavigationProp<any, 'EMICalculator'>;

interface Props {
  navigation: EMICalculatorScreenNavigationProp;
}

export const EMICalculatorScreen: React.FC<Props> = ({ navigation }) => {
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [years, setYears] = useState('1');
  const [months, setMonths] = useState('0');

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<EMIResult | null>(null);

  const handleCalculate = () => {
    setError('');
    setResult(null);

    const principal = parseFloat(loanAmount);
    const rate = parseFloat(interestRate);
    const parsedYears = years.trim() === '' ? 0 : parseInt(years, 10);
    const parsedMonths = months.trim() === '' ? 0 : parseInt(months, 10);

    // Validation
    if (!loanAmount || isNaN(principal) || principal <= 0) {
      setError('Loan amount must be greater than 0');
      return;
    }

    if (interestRate === '' || isNaN(rate) || rate < 0) {
      setError('Interest rate must be 0 or greater');
      return;
    }

    if (isNaN(parsedYears) || parsedYears < 0) {
      setError('Loan tenure in years cannot be negative');
      return;
    }

    if (isNaN(parsedMonths) || parsedMonths < 0 || parsedMonths > 11) {
      setError('Additional months must be between 0 and 11');
      return;
    }

    const totalMonths = parsedYears * 12 + parsedMonths;
    if (totalMonths < 1) {
      setError('Total loan tenure must be at least 1 month');
      return;
    }

    try {
      const calculation = calculateEMI({
        principal,
        annualInterestRate: rate,
        years: parsedYears,
        additionalMonths: parsedMonths,
      });

      if (!isFinite(calculation.monthlyEMI) || isNaN(calculation.monthlyEMI)) {
        setError('Unable to calculate EMI with the provided values');
        return;
      }

      setResult(calculation);
    } catch (err: any) {
      setError(err?.message || 'Error calculating EMI. Please check your inputs.');
    }
  };

  const handleReset = () => {
    setLoanAmount('');
    setInterestRate('');
    setYears('1');
    setMonths('0');
    setError('');
    setResult(null);
  };

  const getTenureBreakdown = (res: EMIResult) => {
    const parts: string[] = [];
    if (res.years > 0) {
      parts.push(`${res.years} Yr${res.years > 1 ? 's' : ''}`);
    }
    if (res.additionalMonths > 0) {
      parts.push(`${res.additionalMonths} Mo${res.additionalMonths > 1 ? 's' : ''}`);
    }
    return parts.length > 0 ? parts.join(' ') : '0 Mos';
  };

  const principalRatio =
    result && result.totalRepayment > 0
      ? Math.round((result.principal / result.totalRepayment) * 100)
      : 100;
  const interestRatio = 100 - principalRatio;

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP APP BAR (DhanaMitra Dark Green Header) */}
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
          {/* 2. TITLE SECTION WITH ILLUSTRATION */}
          <View style={styles.titleSection}>
            <View style={styles.titleLeftCol}>
              <Text style={styles.screenTitle}>EMI Calculator</Text>
              <Text style={styles.screenSubtitle}>
                Calculate monthly loan EMI, interest, and total repayment
              </Text>
            </View>

            {/* Illustration matching Pic 1 (Clipboard + Calculator + Rupee) */}
            <View style={styles.illustrationWrapper}>
              {/* Soft decorative background circle */}
              <View style={styles.illustrationCircle}>
                {/* Decorative leaves */}
                <View style={styles.leaf1} />
                <View style={styles.leaf2} />

                {/* Clipboard */}
                <View style={styles.clipboardCard}>
                  <View style={styles.clipboardClip} />
                  <View style={styles.clipboardLine1} />
                  <View style={styles.clipboardLine2} />
                  <View style={styles.clipboardLine3} />
                </View>

                {/* Rupee coin badge */}
                <View style={styles.rupeeCoinBadge}>
                  <Text style={styles.rupeeCoinText}>₹</Text>
                </View>

                {/* Calculator icon badge */}
                <View style={styles.calcBadge}>
                  <Ionicons name="calculator" size={22} color="#056B38" />
                </View>
              </View>
            </View>
          </View>

          {/* 3. INPUT FORM CARD */}
          <View style={styles.formCard}>
            {error ? <ErrorMessage message={error} /> : null}

            {/* Field: Loan Amount (₹) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Loan Amount (₹)</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'amount' && styles.inputBoxFocused,
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
                  placeholder="e.g., 500000"
                  placeholderTextColor="#94A3B8"
                  value={loanAmount}
                  onChangeText={setLoanAmount}
                  onFocus={() => setFocusedField('amount')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Field: Annual Interest Rate (% p.a.) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Annual Interest Rate (% p.a.)</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'rate' && styles.inputBoxFocused,
                ]}
              >
                <View style={styles.inputPrefixBadge}>
                  <Text style={styles.inputPrefixBadgeText}>%</Text>
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    { outlineStyle: 'none' } as any,
                  ]}
                  placeholder="e.g., 8.5"
                  placeholderTextColor="#94A3B8"
                  value={interestRate}
                  onChangeText={setInterestRate}
                  onFocus={() => setFocusedField('rate')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Tenure Row (2 columns: Years & Additional Months) */}
            <View style={styles.tenureRow}>
              <View style={styles.tenureCol}>
                <Text style={styles.fieldLabel}>Loan Tenure (Years)</Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'years' && styles.inputBoxFocused,
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#056B38"
                    style={styles.inputIconLeft}
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.tenureInput,
                      { outlineStyle: 'none' } as any,
                    ]}
                    placeholder="1"
                    placeholderTextColor="#94A3B8"
                    value={years}
                    onChangeText={setYears}
                    onFocus={() => setFocusedField('years')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.tenureCol}>
                <Text style={styles.fieldLabel}>Additional Months</Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'months' && styles.inputBoxFocused,
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#056B38"
                    style={styles.inputIconLeft}
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.tenureInput,
                      { outlineStyle: 'none' } as any,
                    ]}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    value={months}
                    onChangeText={setMonths}
                    onFocus={() => setFocusedField('months')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={styles.calculateBtn}
              onPress={handleCalculate}
              activeOpacity={0.85}
            >
              <Ionicons name="calculator" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.calculateBtnText}>Calculate EMI</Text>
            </TouchableOpacity>
          </View>

          {/* 4. RESULT CARD (Your EMI Preview) */}
          {result && (
            <View style={styles.previewCard}>
              {/* Header */}
              <View style={styles.previewHeader}>
                <View style={styles.previewIconCircle}>
                  <Ionicons name="stats-chart" size={18} color="#056B38" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>Your EMI Preview</Text>
                  <Text style={styles.previewSubtitle}>Results are estimated based on your inputs</Text>
                </View>
              </View>

              {/* Hero Monthly EMI Feature Box */}
              <View style={styles.heroEmiBox}>
                <View style={styles.heroEmiHeader}>
                  <Text style={styles.heroEmiLabel}>MONTHLY EMI</Text>
                  <View style={styles.heroEmiBadge}>
                    <Ionicons name="calendar-outline" size={12} color="#056B38" style={{ marginRight: 4 }} />
                    <Text style={styles.heroEmiBadgeText}>Per month</Text>
                  </View>
                </View>
                <Text style={styles.heroEmiAmount}>{formatCurrency(result.monthlyEMI)}</Text>
                <Text style={styles.heroEmiSub}>
                  Payable for {result.totalMonths} instalments ({getTenureBreakdown(result)})
                </Text>
              </View>

              {/* 2-Column Clean Breakdown: Total Interest & Total Repayment */}
              <View style={styles.breakdownRow}>
                {/* Total Interest Card */}
                <View style={styles.breakdownCard}>
                  <View style={styles.breakdownCardHeader}>
                    <Ionicons name="pie-chart-outline" size={14} color="#D97706" style={{ marginRight: 5 }} />
                    <Text style={styles.breakdownLabel}>Total Interest</Text>
                  </View>
                  <Text style={styles.breakdownValue}>{formatCurrency(result.totalInterest)}</Text>
                  <Text style={styles.breakdownSub}>Payable ({interestRatio}%)</Text>
                </View>

                {/* Total Repayment Card */}
                <View style={styles.breakdownCard}>
                  <View style={styles.breakdownCardHeader}>
                    <Ionicons name="cash-outline" size={14} color="#056B38" style={{ marginRight: 5 }} />
                    <Text style={styles.breakdownLabel}>Total Repayment</Text>
                  </View>
                  <Text style={styles.breakdownValue}>{formatCurrency(result.totalRepayment)}</Text>
                  <Text style={styles.breakdownSub}>Principal + Interest</Text>
                </View>
              </View>

              {/* Visual Ratio Progress Bar */}
              <View style={styles.ratioBarContainer}>
                <View style={styles.ratioBarTrack}>
                  <View style={[styles.ratioBarPrincipal, { width: `${principalRatio}%` }]} />
                  <View style={[styles.ratioBarInterest, { width: `${interestRatio}%` }]} />
                </View>
                <View style={styles.ratioLabelsRow}>
                  <View style={styles.ratioLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#056B38' }]} />
                    <Text style={styles.legendText}>Principal: {principalRatio}%</Text>
                  </View>
                  <View style={styles.ratioLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.legendText}>Interest: {interestRatio}%</Text>
                  </View>
                </View>
              </View>

              {/* Bottom Info Strip: Total Tenure & Verified Badge */}
              <View style={styles.previewFooterRow}>
                <View style={styles.tenureFooterLeft}>
                  <View style={styles.tenureFooterIconBox}>
                    <Ionicons name="calendar" size={16} color="#056B38" />
                  </View>
                  <View>
                    <Text style={styles.tenureFooterLabel}>Total Tenure</Text>
                    <Text style={styles.tenureFooterValue}>
                      {result.totalMonths} Months ({getTenureBreakdown(result)})
                    </Text>
                  </View>
                </View>

                <View style={styles.ratioBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#056B38" style={{ marginRight: 4 }} />
                  <Text style={styles.ratioBadgeText}>Verified</Text>
                </View>
              </View>
            </View>
          )}

          {/* 5. DISCLAIMER / NOTE CARD */}
          <View style={styles.disclaimerCard}>
            <View style={styles.disclaimerIconCircle}>
              <Ionicons name="bulb" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.disclaimerTitle}>
                EMI is calculated on a reducing balance basis.
              </Text>
              <Text style={styles.disclaimerSubtitle}>
                Actual amounts may vary slightly due to rounding.
              </Text>
            </View>
          </View>
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
  leaf1: {
    position: 'absolute',
    top: 6,
    right: 10,
    width: 14,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#86EFAC',
    transform: [{ rotate: '30deg' }],
    opacity: 0.7,
  },
  leaf2: {
    position: 'absolute',
    top: 14,
    right: 4,
    width: 12,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4ADE80',
    transform: [{ rotate: '55deg' }],
    opacity: 0.8,
  },
  clipboardCard: {
    width: 38,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#056B38',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  clipboardClip: {
    width: 14,
    height: 4,
    backgroundColor: '#056B38',
    borderRadius: 2,
    position: 'absolute',
    top: -3,
  },
  clipboardLine1: {
    width: 24,
    height: 2.5,
    backgroundColor: '#CBD5E1',
    borderRadius: 1.5,
    marginVertical: 2,
  },
  clipboardLine2: {
    width: 18,
    height: 2.5,
    backgroundColor: '#E2E8F0',
    borderRadius: 1.5,
    marginVertical: 2,
  },
  clipboardLine3: {
    width: 20,
    height: 2.5,
    backgroundColor: '#CBD5E1',
    borderRadius: 1.5,
    marginVertical: 2,
  },
  rupeeCoinBadge: {
    position: 'absolute',
    bottom: 8,
    left: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
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
  rupeeCoinText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  calcBadge: {
    position: 'absolute',
    bottom: 4,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#056B38',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  inputIconLeft: {
    marginRight: 10,
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
  tenureRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tenureCol: {
    flex: 1,
  },
  tenureInput: {
    fontWeight: '600',
  },
  calculateBtn: {
    backgroundColor: '#056B38',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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
  previewCard: {
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
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  heroEmiBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  heroEmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  heroEmiLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  heroEmiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroEmiBadgeText: {
    fontSize: 11,
    color: '#056B38',
    fontWeight: '700',
  },
  heroEmiAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#056B38',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  heroEmiSub: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  breakdownCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  breakdownSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  ratioBarContainer: {
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ratioBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  ratioBarPrincipal: {
    height: '100%',
    backgroundColor: '#056B38',
  },
  ratioBarInterest: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  ratioLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  previewFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  tenureFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tenureFooterIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenureFooterLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  tenureFooterValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  ratioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  ratioBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#056B38',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 20,
    gap: 12,
  },
  disclaimerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  disclaimerSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    fontWeight: '500',
  },
});
