import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppInput } from '../components/AppInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatCurrency } from '../utils/currency';
import { calculateEMI, EMIResult } from '../utils/emiCalculator';
import { COLORS } from '../constants/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';

type EMICalculatorScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'EMICalculator'>;

interface Props {
  navigation: EMICalculatorScreenNavigationProp;
}

export const EMICalculatorScreen: React.FC<Props> = ({ navigation }) => {
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [years, setYears] = useState('1');
  const [months, setMonths] = useState('0');

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

  // Helper for tenure display string
  const getTenureString = (res: EMIResult) => {
    const parts: string[] = [];
    if (res.years > 0) {
      parts.push(`${res.years} Yr${res.years > 1 ? 's' : ''}`);
    }
    if (res.additionalMonths > 0) {
      parts.push(`${res.additionalMonths} Mo${res.additionalMonths > 1 ? 's' : ''}`);
    }
    const breakdown = parts.length > 0 ? ` (${parts.join(' ')})` : '';
    return `${res.totalMonths} Month${res.totalMonths > 1 ? 's' : ''}${breakdown}`;
  };

  const principalRatio = result && result.totalRepayment > 0 
    ? Math.round((result.principal / result.totalRepayment) * 100) 
    : 100;
  const interestRatio = 100 - principalRatio;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.mainBackground}>

            {/* TOP DARK SECTION */}
            <View style={styles.topDarkSection}>
              <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <View style={styles.backButtonInner}>
                    <Ionicons name="arrow-back" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>EMI Calculator</Text>
                <View style={{ width: 40 }} />
              </View>

              <Text style={styles.pageTitle}>EMI Calculator</Text>
              <Text style={styles.pageSubtitle}>Calculate monthly loan EMI, interest, and total repayment</Text>
            </View>

            {/* THE WAVE CONNECTOR */}
            <View style={styles.waveConnectorDark}>
              <View style={styles.waveConnectorLightCutout} />
            </View>

            {/* BOTTOM LIGHT SECTION */}
            <View style={styles.bottomLightSection}>
              <View style={styles.neuFormContainer}>
                <ErrorMessage message={error} />

                <AppInput
                  label="Loan Amount (₹)"
                  placeholder="e.g., 500000"
                  value={loanAmount}
                  onChangeText={setLoanAmount}
                  keyboardType="numeric"
                />

                <AppInput
                  label="Annual Interest Rate (% p.a.)"
                  placeholder="e.g., 8.5"
                  value={interestRate}
                  onChangeText={setInterestRate}
                  keyboardType="numeric"
                />

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel} numberOfLines={1} adjustsFontSizeToFit>
                      Loan Tenure (Years)
                    </Text>
                    <AppInput
                      placeholder="1"
                      value={years}
                      onChangeText={setYears}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel} numberOfLines={1} adjustsFontSizeToFit>
                      Additional Months
                    </Text>
                    <AppInput
                      placeholder="0"
                      value={months}
                      onChangeText={setMonths}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.neuCalculateBtn} onPress={handleCalculate} activeOpacity={0.8}>
                  <View style={styles.neuCalculateBtnInner}>
                    <Ionicons name="calculator" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.neuCalculateBtnText}>Calculate EMI</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {result && (
                <View style={styles.neonResultCard}>
                  <View style={styles.neonCardHeader}>
                    <View style={styles.neonIconWrapper}>
                      <Ionicons name="calendar" size={20} color="#4D8BFF" />
                    </View>
                    <Text style={styles.neonCardTitle}>EMI Calculation Result</Text>
                  </View>

                  {/* Monthly EMI Hero Box */}
                  <View style={styles.emiHighlightBox}>
                    <Text style={styles.emiHighlightLabel}>Monthly EMI</Text>
                    <Text style={styles.emiHighlightAmount}>{formatCurrency(result.monthlyEMI)}</Text>
                    <Text style={styles.emiHighlightSub}>Per month for {result.totalMonths} instalments</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Principal Amount</Text>
                    <Text style={styles.infoValue}>{formatCurrency(result.principal)}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Interest Payable</Text>
                    <Text style={styles.interestValue}>{formatCurrency(result.totalInterest)}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Repayment Amount</Text>
                    <Text style={styles.repaymentValue}>{formatCurrency(result.totalRepayment)}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Loan Tenure</Text>
                    <Text style={styles.infoValue}>{getTenureString(result)}</Text>
                  </View>

                  {/* Ratio bar */}
                  <View style={styles.barContainer}>
                    <View style={styles.barLabelsRow}>
                      <View style={styles.barLegendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#4A90E2' }]} />
                        <Text style={styles.legendText}>Principal: {principalRatio}%</Text>
                      </View>
                      <View style={styles.barLegendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#FF6BE7' }]} />
                        <Text style={styles.legendText}>Interest: {interestRatio}%</Text>
                      </View>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarPrincipal, { width: `${principalRatio}%` }]} />
                      <View style={[styles.progressBarInterest, { width: `${interestRatio}%` }]} />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.neuResetBtn} onPress={handleReset} activeOpacity={0.8}>
                    <Text style={styles.neuResetBtnText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EFF5',
  },
  keyboardView: {
    flex: 1,
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
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomRightRadius: 80,
    zIndex: 10,
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
    paddingBottom: 40,
    marginTop: -1,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pageTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pageSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  neuFormContainer: {
    backgroundColor: '#E9EFF5',
    padding: 24,
    borderRadius: 24,
    marginTop: 10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.TEXT,
    marginBottom: 6,
    height: 18,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  col: {
    flex: 1,
    paddingHorizontal: 6,
  },
  neuCalculateBtn: {
    marginTop: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  neuCalculateBtnInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  neuCalculateBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  neonResultCard: {
    backgroundColor: 'rgba(38, 40, 69, 0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
    marginBottom: 20,
  },
  neonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  neonIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(77, 139, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  neonCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  emiHighlightBox: {
    backgroundColor: 'rgba(80, 227, 194, 0.12)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(80, 227, 194, 0.3)',
    marginBottom: 20,
  },
  emiHighlightLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#50E3C2',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  emiHighlightAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#50E3C2',
    marginBottom: 4,
  },
  emiHighlightSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  infoValue: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '700',
  },
  interestValue: {
    fontSize: 15,
    color: '#FF6BE7',
    fontWeight: '800',
  },
  repaymentValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  barContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
  barLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barLegendItem: {
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
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarPrincipal: {
    height: '100%',
    backgroundColor: '#4A90E2',
  },
  progressBarInterest: {
    height: '100%',
    backgroundColor: '#FF6BE7',
  },
  neuResetBtn: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  neuResetBtnText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '700',
  },
});

