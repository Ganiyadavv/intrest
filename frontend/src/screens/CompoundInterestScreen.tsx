import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppInput } from '../components/AppInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { calculateCompoundInterest } from '../utils/compoundInterest';
import { formatCurrency } from '../utils/currency';
import { getUser } from '../storage/storage';
import { User } from '../types/user';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../types/navigation';

type CompoundInterestScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'CompoundInterest'>;
type CompoundInterestScreenRouteProp = RouteProp<MainStackParamList, 'CompoundInterest'>;

interface Props {
  navigation: CompoundInterestScreenNavigationProp;
  route: CompoundInterestScreenRouteProp;
}

export const CompoundInterestScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await getUser();
      setUser(u);
    };
    loadUser();
  }, []);

  const [principal, setPrincipal] = useState('');
  const [ptr, setPtr] = useState('');
  const [years, setYears] = useState('0');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('0');
  const [compoundsPerYear, setCompoundsPerYear] = useState(12);
  
  const [error, setError] = useState('');
  
  const [result, setResult] = useState<{
    principal: number;
    ptr: number;
    years: number;
    months: number;
    days: number;
    totalAmount: number;
    compoundInterest: number;
    timeInYears: number;
    compoundsPerYear: number;
  } | null>(null);

  const handleCalculate = () => {
    setError('');
    setResult(null);

    const p = parseFloat(principal);
    const r = parseFloat(ptr);
    const y = years ? parseInt(years, 10) : 0;
    const m = months ? parseInt(months, 10) : 0;
    const d = days ? parseInt(days, 10) : 0;

    // Validation
    if (!principal || isNaN(p) || p <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!ptr || isNaN(r) || r < 0) {
      setError('Please enter a valid interest rate.');
      return;
    }
    if (isNaN(y) || y < 0 || isNaN(m) || m < 0 || isNaN(d) || d < 0) {
      setError('Negative duration is not allowed');
      return;
    }
    
    if (y === 0 && m === 0 && d === 0) {
      setError('Please enter a valid duration.');
      return;
    }

    const compoundResult = calculateCompoundInterest({
        principal: p,
        annualRate: r,
        years: y,
        months: m,
        days: d,
        compoundsPerYear
    });

    if (isNaN(compoundResult.totalAmount) || !isFinite(compoundResult.totalAmount)) {
      setError('Unable to calculate with the entered values. Please check your inputs.');
      return;
    }

    setResult({
      principal: p,
      ptr: r,
      years: y,
      months: m,
      days: d,
      totalAmount: compoundResult.totalAmount,
      compoundInterest: compoundResult.compoundInterest,
      timeInYears: compoundResult.timeInYears,
      compoundsPerYear
    });
  };

  const handleReset = () => {
    setPrincipal('');
    setPtr('');
    setYears('0');
    setMonths('0');
    setDays('0');
    setCompoundsPerYear(12);
    setError('');
    setResult(null);
  };

  const getFrequencyText = (val: number) => {
    switch (val) {
      case 1: return 'Yearly (1 time per year)';
      case 2: return 'Half-Yearly (2 times per year)';
      case 4: return 'Quarterly (4 times per year)';
      case 12: return 'Monthly (12 times per year)';
      case 365: return 'Daily (365 times per year)';
      default: return '';
    }
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
            
            <View style={styles.topDarkSection}>
              <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <View style={styles.backButtonInner}>
                    <Ionicons name="arrow-back" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Compound Interest</Text>
                <View style={{ width: 40 }} />
              </View>
              
              <Text style={styles.pageTitle}>Compound Interest</Text>
              <Text style={styles.pageSubtitle}>Calculate compounding interest dynamically</Text>
            </View>

            <View style={styles.waveConnectorDark}>
               <View style={styles.waveConnectorLightCutout} />
            </View>

            <View style={styles.bottomLightSection}>
              <View style={styles.neuFormContainer}>
            <ErrorMessage message={error} />

            <AppInput
              label="Principal Amount (₹)"
              placeholder="e.g., 10000"
              value={principal}
              onChangeText={setPrincipal}
              keyboardType="numeric"
            />
            
            <AppInput
              label="Annual Interest Rate (%)"
              placeholder="e.g., 2"
              value={ptr}
              onChangeText={setPtr}
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

            <View style={styles.frequencyContainer}>
                <Text style={styles.frequencyLabel}>Compounding Frequency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.frequencyScroll}>
                    {[
                        { label: 'Daily', value: 365 },
                        { label: 'Monthly', value: 12 },
                        { label: 'Quarterly', value: 4 },
                        { label: 'Half-Yearly', value: 2 },
                        { label: 'Yearly', value: 1 },
                    ].map((freq) => (
                        <TouchableOpacity
                            key={freq.value}
                            style={[styles.freqButton, compoundsPerYear === freq.value && styles.freqButtonActive]}
                            onPress={() => setCompoundsPerYear(freq.value)}
                        >
                            <Text style={[styles.freqButtonText, compoundsPerYear === freq.value && styles.freqButtonTextActive]}>
                                {freq.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <Text style={styles.frequencyDescText}>{getFrequencyText(compoundsPerYear)}</Text>
            </View>

            <TouchableOpacity style={styles.neuCalculateBtn} onPress={handleCalculate} activeOpacity={0.8}>
              <View style={styles.neuCalculateBtnInner}>
                <Ionicons name="calculator" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.neuCalculateBtnText}>Calculate</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.neuResetBtnLight} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.neuResetBtnTextLight}>Reset</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.neonResultCard}>
              <View style={styles.neonCardHeader}>
                <View style={styles.neonIconWrapper}>
                  <Ionicons name="analytics" size={20} color="#FF6BE7" />
                </View>
                <Text style={styles.neonCardTitle}>Calculation Result</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Principal Amount</Text>
                <Text style={styles.infoValue}>{formatCurrency(result.principal)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Interest Rate</Text>
                <Text style={styles.infoValue}>{result.ptr}%</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>
                  {result.years} Yr {result.months} Mo {result.days} D
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Compounding</Text>
                <Text style={styles.infoValue}>
                  {result.compoundsPerYear === 365 ? 'Daily' :
                   result.compoundsPerYear === 12 ? 'Monthly' :
                   result.compoundsPerYear === 4 ? 'Quarterly' :
                   result.compoundsPerYear === 2 ? 'Half-Yearly' : 'Yearly'}
                </Text>
              </View>

              <View style={styles.neonDivider} />



              <View style={styles.highlightRow}>
                <Text style={styles.highlightLabel}>Compound Interest</Text>
                <Text style={styles.highlightValue}>{formatCurrency(result.compoundInterest || 0)}</Text>
              </View>

              <View style={styles.highlightRow}>
                <Text style={styles.highlightLabel}>Total Amount</Text>
                <Text style={styles.highlightValueTotal}>{formatCurrency(result.totalAmount)}</Text>
              </View>
            </View>
          )}

          {/* Educational Section */}
          <View style={styles.educationalCard}>
             <Text style={styles.eduTitle}>What is Compound Interest?</Text>
             <Text style={styles.eduText}>
                Compound interest is interest calculated on the original principal and on the interest accumulated during previous periods.
             </Text>
             <View style={styles.eduFormulaBox}>
                <Text style={styles.eduFormula}>A = P(1 + r/n)^(nt)</Text>
             </View>
             <Text style={styles.eduFormulaDesc}>
                P = Principal{'\n'}
                r = Annual interest rate{'\n'}
                n = Compounding frequency{'\n'}
                t = Time in years
             </Text>
          </View>

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
  frequencyContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
    marginLeft: 4,
  },
  frequencyScroll: {
    paddingVertical: 4,
  },
  freqButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 20,
    marginRight: 10,
  },
  freqButtonActive: {
    backgroundColor: '#4D8BFF',
    borderColor: '#4D8BFF',
  },
  freqButtonText: {
    color: '#7F8C8D',
    fontWeight: '600',
    fontSize: 13,
  },
  freqButtonTextActive: {
    color: '#FFF',
  },
  frequencyDescText: {
    marginTop: 8,
    fontSize: 13,
    color: '#95A5A6',
    marginLeft: 4,
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
  neuResetBtnLight: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#E9EFF5',
    borderWidth: 1,
    borderColor: '#D1D9E6',
  },
  neuResetBtnTextLight: {
    color: '#7F8C8D',
    fontSize: 15,
    fontWeight: '700',
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
    color: '#FF6BE7',
  },
  highlightValueTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#50E3C2',
  },
  educationalCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  eduTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 12,
  },
  eduText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
    marginTop: 4,
  },
  eduFormulaBox: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  eduFormula: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2980B9',
    letterSpacing: 1,
  },
  eduFormulaDesc: {
    fontSize: 13,
    color: '#95A5A6',
    lineHeight: 20,
  }
});
