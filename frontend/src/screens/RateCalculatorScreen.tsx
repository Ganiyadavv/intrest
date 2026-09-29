import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppInput } from '../components/AppInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/currency';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types/navigation';

type RateCalculatorScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'RateCalculator'>;

interface Props {
  navigation: RateCalculatorScreenNavigationProp;
}

export const RateCalculatorScreen: React.FC<Props> = ({ navigation }) => {
  const [principal, setPrincipal] = useState('');
  const [interestAmt, setInterestAmt] = useState('');
  const [years, setYears] = useState('0');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('0');
  
  const [error, setError] = useState('');
  
  const [result, setResult] = useState<{
    principal: number;
    monthlyRate: number;
    yearlyRate: number;
    monthlyInterest: number;
    yearlyInterest: number;
    totalInterest: number;
    timeLabel: string;
  } | null>(null);

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

    const totalMonths = (y * 12) + m + (d / 30);

    if (totalMonths <= 0) {
      setError('Total time must be greater than 0');
      return;
    }

    // Calculations
    const monthlyRate = (i / p) / totalMonths * 100;
    const yearlyRate = monthlyRate * 12;
    const monthlyInterest = (p * monthlyRate) / 100;
    const yearlyInterest = monthlyInterest * 12;
    const totalInterest = monthlyInterest * totalMonths; // Equivalent to 'i' ideally

    let timeParts = [];
    if (y > 0) timeParts.push(`${y} Yr`);
    if (m > 0) timeParts.push(`${m} Mo`);
    if (d > 0) timeParts.push(`${d} D`);
    const timeLabel = timeParts.length > 0 ? timeParts.join(' ') : '0 Months';

    setResult({
      principal: p,
      monthlyRate,
      yearlyRate,
      monthlyInterest,
      yearlyInterest,
      totalInterest,
      timeLabel
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
                <Text style={styles.headerTitle}>Rate Calculator</Text>
                <View style={{ width: 40 }} />
              </View>
              
              <Text style={styles.pageTitle}>Rate Calculator</Text>
              <Text style={styles.pageSubtitle}>Find the interest rate from the amount and duration</Text>
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
                  label="Principal Amount (₹)"
                  placeholder="e.g., 20000"
                  value={principal}
                  onChangeText={setPrincipal}
                  keyboardType="numeric"
                />
                
                <AppInput
                  label="Interest Amount (₹)"
                  placeholder="e.g., 2000"
                  value={interestAmt}
                  onChangeText={setInterestAmt}
                  keyboardType="numeric"
                />

                <View style={styles.row}>
                  <View style={styles.col}>
                    <AppInput
                      label="Years"
                      placeholder="0"
                      value={years}
                      onChangeText={setYears}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.col}>
                    <AppInput
                      label="Months"
                      placeholder="0"
                      value={months}
                      onChangeText={setMonths}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.col}>
                    <AppInput
                      label="Days"
                      placeholder="0"
                      value={days}
                      onChangeText={setDays}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.neuCalculateBtn} onPress={handleCalculate} activeOpacity={0.8}>
                  <View style={styles.neuCalculateBtnInner}>
                    <Ionicons name="calculator" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.neuCalculateBtnText}>Calculate Rate</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {result && (
                <View style={styles.neonResultCard}>
                  <View style={styles.neonCardHeader}>
                    <View style={styles.neonIconWrapper}>
                      <Ionicons name="pie-chart" size={20} color="#4D8BFF" />
                    </View>
                    <Text style={styles.neonCardTitle}>Calculation Result</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Principal Amount</Text>
                    <Text style={styles.infoValue}>{formatCurrency(result.principal)}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Monthly Interest Rate</Text>
                    <Text style={styles.highlightValueRate}>{result.monthlyRate.toFixed(2)}%</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Yearly Interest Rate</Text>
                    <Text style={styles.infoValue}>{result.yearlyRate.toFixed(2)}%</Text>
                  </View>
                  
                  <View style={styles.neonDivider} />
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Time Period</Text>
                    <Text style={styles.infoValue}>{result.timeLabel}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Monthly Interest</Text>
                    <Text style={styles.infoValue}>{formatCurrency(result.monthlyInterest)}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Yearly Interest</Text>
                    <Text style={styles.infoValue}>{formatCurrency(result.yearlyInterest)}</Text>
                  </View>

                  <View style={styles.neonDivider} />

                  <View style={styles.highlightRow}>
                    <Text style={styles.highlightLabel}>Total Interest</Text>
                    <Text style={styles.highlightValue}>{formatCurrency(result.totalInterest)}</Text>
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
    marginBottom: 24,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  highlightValueRate: {
    fontSize: 16,
    color: '#50E3C2',
    fontWeight: '800',
  },
  neonDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  highlightLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6BE7', // Neon Pink for interest
  },
  neuResetBtn: {
    marginTop: 24,
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
  }
});
