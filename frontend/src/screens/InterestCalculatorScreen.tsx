import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AppInput } from '../components/AppInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { COLORS } from '../constants/colors';
import { 
  calculateMonthlyInterest, 
  calculateTotalMonths, 
  calculateTotalInterestCalc, 
  calculateTotalAmount 
} from '../utils/interestCalculator';
import { formatCurrency } from '../utils/currency';
import { getUser } from '../storage/storage';
import { User } from '../types/user';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../types/navigation';

type InterestCalculatorScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'InterestCalculator'>;
type InterestCalculatorScreenRouteProp = RouteProp<MainStackParamList, 'InterestCalculator'>;

interface Props {
  navigation: InterestCalculatorScreenNavigationProp;
  route: InterestCalculatorScreenRouteProp;
}

export const InterestCalculatorScreen: React.FC<Props> = ({ navigation, route }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await getUser();
      setUser(u);
    };
    loadUser();
  }, []);
  const [principal, setPrincipal] = useState(route.params?.principal || '');
  const [ptr, setPtr] = useState(route.params?.rate || '');
  const [years, setYears] = useState(route.params?.years || '0');
  const [months, setMonths] = useState(route.params?.months || '0');
  const [days, setDays] = useState(route.params?.days || '0');
  
  const [givenDate] = useState(route.params?.givenDate ? new Date(route.params.givenDate) : null);
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  useEffect(() => {
    if (givenDate) {
      const d1 = givenDate;
      const d2 = endDate;
      
      let y = d2.getFullYear() - d1.getFullYear();
      let m = d2.getMonth() - d1.getMonth();
      let d = d2.getDate() - d1.getDate();

      if (d < 0) {
        m -= 1;
        const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
        d += prevMonth.getDate();
      }
      if (m < 0) {
        y -= 1;
        m += 12;
      }
      
      setYears(Math.max(0, y).toString());
      setMonths(Math.max(0, m).toString());
      setDays(Math.max(0, d).toString());
    }
  }, [endDate, givenDate]);

  const [error, setError] = useState('');
  
  const [result, setResult] = useState<{
    principal: number;
    ptr: number;
    years: number;
    months: number;
    days: number;
    monthlyInterest: number;
    totalMonths: number;
    totalInterest: number;
    totalAmount: number;
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
    if (!principal || isNaN(p)) {
      setError('Empty Principal Amount');
      return;
    }
    if (p <= 0) {
      setError('Principal Amount must be greater than 0');
      return;
    }
    if (isNaN(r) || r < 0) {
      setError('Negative Interest/PTR is not allowed');
      return;
    }
    if (isNaN(y) || y < 0) {
      setError('Negative Years is not allowed');
      return;
    }
    if (isNaN(m) || m < 0) {
      setError('Negative Months is not allowed');
      return;
    }
    if (isNaN(d) || d < 0) {
      setError('Negative Days is not allowed');
      return;
    }
    if (m > 11) {
      setError('Months should normally be 0–11');
      return;
    }
    if (d > 29) {
      setError('Days should normally be 0–29');
      return;
    }

    const monthlyInterest = calculateMonthlyInterest(p, r);
    const totalMonths = calculateTotalMonths(y, m, d);
    
    // If all duration values are 0, total interest should be 0
    let totalInterest = 0;
    if (totalMonths > 0) {
      totalInterest = calculateTotalInterestCalc(p, r, y, m, d);
    }
    
    const totalAmount = calculateTotalAmount(p, totalInterest);

    setResult({
      principal: p,
      ptr: r,
      years: y,
      months: m,
      days: d,
      monthlyInterest,
      totalMonths,
      totalInterest,
      totalAmount
    });
  };

  const handleReset = () => {
    setPrincipal('');
    setPtr('');
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
            
            {/* TOP DARK SECTION (Top half of the S curve) */}
            <View style={styles.topDarkSection}>
              <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <View style={styles.backButtonInner}>
                    <Ionicons name="arrow-back" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calculator</Text>
                <View style={{ width: 40 }} />
              </View>
              
              <Text style={styles.pageTitle}>Interest Calculator</Text>
              <Text style={styles.pageSubtitle}>Calculate interest based on amount, PTR and duration</Text>
            </View>

            {/* THE WAVE CONNECTOR (Bottom half of the S curve) */}
            <View style={styles.waveConnectorDark}>
               <View style={styles.waveConnectorLightCutout} />
            </View>

            {/* BOTTOM LIGHT SECTION */}
            <View style={styles.bottomLightSection}>
              <View style={styles.neuFormContainer}>
            <ErrorMessage message={error} />

            {givenDate ? (
              <View style={styles.linkedModeCard}>
                <View style={styles.linkedModeStatsRow}>
                  <View style={styles.linkedModeStat}>
                    <Text style={styles.linkedModeLabel}>Principal</Text>
                    <Text style={styles.linkedModeValue}>{formatCurrency(Number(principal))}</Text>
                  </View>
                  <View style={styles.linkedModeStat}>
                    <Text style={styles.linkedModeLabel}>Interest</Text>
                    <Text style={styles.linkedModeValue}>{ptr}%</Text>
                  </View>
                </View>
                
                <View style={styles.linkedModeDivider} />
                
                <Text style={styles.dateLabel}>Given Date: <Text style={{ color: '#2C3E50', fontWeight: 'bold' }}>{givenDate.toLocaleDateString('en-GB')}</Text></Text>
                
                <Text style={[styles.dateLabel, { marginTop: 12 }]}>Select End Date:</Text>
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: endDate.toISOString().split('T')[0],
                    onChange: (e: any) => {
                      if (e.target.value) {
                        const newDate = new Date(e.target.value);
                        if (!isNaN(newDate.getTime())) setEndDate(newDate);
                      }
                    },
                    style: { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#ECF0F1', paddingHorizontal: 12, marginBottom: 16, backgroundColor: '#FFF', width: '100%' }
                  })
                ) : (
                  <>
                    <TouchableOpacity style={[styles.datePickerButton, { backgroundColor: '#FFF' }]} onPress={() => setShowDatePicker(true)}>
                      <Text style={styles.dateText}>{endDate.toISOString().split('T')[0]}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(Platform.OS === 'ios');
                          if (selectedDate) setEndDate(selectedDate);
                        }}
                      />
                    )}
                  </>
                )}
                
                <View style={styles.linkedModeDurationBox}>
                  <Text style={styles.linkedModeLabel}>Calculated Duration</Text>
                  <Text style={styles.linkedModeDurationText}>{years} Yrs, {months} Mos, {days} Days</Text>
                </View>
              </View>
            ) : (
              <>
                <AppInput
                  label="Principal Amount (₹)"
                  placeholder="e.g., 50000"
                  value={principal}
                  onChangeText={setPrincipal}
                  keyboardType="numeric"
                />
                
                <AppInput
                  label="Interest / PTR (%)"
                  placeholder="e.g., 2.5"
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
              </>
            )}

            <TouchableOpacity style={styles.neuCalculateBtn} onPress={handleCalculate} activeOpacity={0.8}>
              <View style={styles.neuCalculateBtnInner}>
                <Ionicons name="calculator" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.neuCalculateBtnText}>Calculate Interest</Text>
              </View>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.neonResultCard}>
              <View style={styles.neonCardHeader}>
                <View style={styles.neonIconWrapper}>
                  <Ionicons name="analytics" size={20} color="#4D8BFF" />
                </View>
                <Text style={styles.neonCardTitle}>Calculation Result</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Principal Amount</Text>
                <Text style={styles.infoValue}>{formatCurrency(result.principal)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Interest / PTR</Text>
                <Text style={styles.infoValue}>{result.ptr}%</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>
                  {result.years} Yr {result.months} Mo {result.days} D
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Monthly Interest</Text>
                <Text style={styles.infoValue}>{formatCurrency(result.monthlyInterest)}</Text>
              </View>

              <View style={styles.neonDivider} />

              <View style={styles.highlightRow}>
                <Text style={styles.highlightLabel}>Total Interest</Text>
                <Text style={styles.highlightValue}>{formatCurrency(result.totalInterest)}</Text>
              </View>

              <View style={styles.highlightRow}>
                <Text style={styles.highlightLabel}>Total Amount</Text>
                <Text style={styles.highlightValueTotal}>{formatCurrency(result.totalAmount)}</Text>
              </View>
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
  userIdPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(77, 139, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(77, 139, 255, 0.3)',
  },
  userIdText: {
    color: '#4D8BFF',
    fontWeight: '700',
    fontSize: 12,
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
  highlightValueTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#50E3C2', // Neon Mint for Total
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
  },
  datePickerContainer: { marginBottom: 16 },
  dateLabel: { fontSize: 14, fontWeight: '600', color: '#7F8C8D', marginBottom: 8 },
  datePickerButton: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 8, paddingHorizontal: 12, height: 44, justifyContent: 'center', marginBottom: 16 },
  dateText: { color: '#2C3E50', fontSize: 15 },
  linkedModeCard: { backgroundColor: '#F4F6F8', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E0E6ED' },
  linkedModeStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  linkedModeStat: { flex: 1 },
  linkedModeLabel: { fontSize: 13, color: '#95A5A6', fontWeight: '600', marginBottom: 4 },
  linkedModeValue: { fontSize: 18, color: '#2C3E50', fontWeight: 'bold' },
  linkedModeDivider: { height: 1, backgroundColor: '#E0E6ED', marginVertical: 12 },
  linkedModeDurationBox: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E6ED', alignItems: 'center', marginTop: 4 },
  linkedModeDurationText: { fontSize: 16, color: '#2980B9', fontWeight: 'bold', marginTop: 4 }
});
