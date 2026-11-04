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
import { calculateCompoundInterest } from '../utils/compoundInterest';
import { formatCurrency } from '../utils/currency';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CompoundInterestScreenNavigationProp = NativeStackNavigationProp<any, 'CompoundInterest'>;

interface Props {
  navigation: CompoundInterestScreenNavigationProp;
}

export const CompoundInterestScreen: React.FC<Props> = ({ navigation }) => {
  const [principal, setPrincipal] = useState('');
  const [ptr, setPtr] = useState('');
  const [years, setYears] = useState('0');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('0');
  const [compoundsPerYear, setCompoundsPerYear] = useState(12);

  const [focusedField, setFocusedField] = useState<string | null>(null);
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
      compoundsPerYear,
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
      compoundsPerYear,
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

  const getFrequencyLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Yearly';
      case 2:
        return 'Half-Yearly';
      case 4:
        return 'Quarterly';
      case 12:
        return 'Monthly';
      case 365:
        return 'Daily';
      default:
        return 'Monthly';
    }
  };

  const getFrequencyText = (val: number) => {
    switch (val) {
      case 1:
        return 'Yearly (1 time per year)';
      case 2:
        return 'Half-Yearly (2 times per year)';
      case 4:
        return 'Quarterly (4 times per year)';
      case 12:
        return 'Monthly (12 times per year)';
      case 365:
        return 'Daily (365 times per year)';
      default:
        return '';
    }
  };

  const getTimePeriodString = (y: number, m: number, d: number) => {
    const parts: string[] = [];
    if (y > 0) parts.push(`${y} Yr${y > 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} Mo${m > 1 ? 's' : ''}`);
    if (d > 0) parts.push(`${d} Day${d > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' ') : '0 Days';
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP APP BAR (DhanaMitra Dark Green Header matching Pic 2) */}
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
          {/* 2. TITLE SECTION WITH GRAPHIC ILLUSTRATION (Matching Pic 2) */}
          <View style={styles.titleSection}>
            <View style={styles.titleLeftCol}>
              <Text style={styles.screenTitle}>Compound Interest</Text>
              <Text style={styles.screenSubtitle}>
                Calculate compound interest and growth over time
              </Text>
            </View>

            {/* Illustration: Rupee Coin + Growth Chart / Arrow + Coins */}
            <View style={styles.illustrationWrapper}>
              <View style={styles.illustrationCircle}>
                <View style={styles.leafDecor1} />
                <View style={styles.leafDecor2} />

                {/* Growth Bars & Arrow */}
                <View style={styles.chartGraphicContainer}>
                  <View style={[styles.chartBar, { height: 16 }]} />
                  <View style={[styles.chartBar, { height: 26 }]} />
                  <View style={[styles.chartBar, { height: 38 }]} />
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color="#056B38"
                    style={styles.chartArrowIcon}
                  />
                </View>

                {/* Stack of Coins */}
                <View style={styles.coinStackBadge}>
                  <View style={styles.coin1} />
                  <View style={styles.coin2} />
                  <View style={styles.coin3} />
                </View>

                {/* Rupee Coin Badge */}
                <View style={styles.rupeeCoinBadge}>
                  <Text style={styles.rupeeCoinText}>₹</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3. FORM CARD (Matching Pic 2 layout & preserving all fields) */}
          <View style={styles.formCard}>
            <Text style={styles.formSectionHeader}>Enter Details</Text>
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
                  <Ionicons name="calculator" size={16} color="#056B38" />
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    { outlineStyle: 'none' } as any,
                  ]}
                  placeholder="e.g., 10000"
                  placeholderTextColor="#94A3B8"
                  value={principal}
                  onChangeText={setPrincipal}
                  onFocus={() => setFocusedField('principal')}
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
                  <Ionicons name="time-outline" size={16} color="#056B38" />
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    { outlineStyle: 'none' } as any,
                  ]}
                  placeholder="e.g., 10"
                  placeholderTextColor="#94A3B8"
                  value={ptr}
                  onChangeText={setPtr}
                  onFocus={() => setFocusedField('rate')}
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

              {/* Duration Preview Pill */}
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

            {/* Field: Compounding Frequency */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Compounding Frequency</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.frequencyScroll}
              >
                {[
                  { label: 'Daily', value: 365 },
                  { label: 'Monthly', value: 12 },
                  { label: 'Quarterly', value: 4 },
                  { label: 'Half-Yearly', value: 2 },
                  { label: 'Annually', value: 1 },
                ].map((freq) => {
                  const isActive = compoundsPerYear === freq.value;
                  return (
                    <TouchableOpacity
                      key={freq.value}
                      style={[styles.freqButton, isActive && styles.freqButtonActive]}
                      onPress={() => setCompoundsPerYear(freq.value)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.freqButtonText,
                          isActive && styles.freqButtonTextActive,
                        ]}
                      >
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={styles.frequencyDescText}>
                {getFrequencyText(compoundsPerYear)}
              </Text>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={styles.calculateBtn}
              onPress={handleCalculate}
              activeOpacity={0.85}
            >
              <Ionicons name="calculator" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.calculateBtnText}>Calculate Compound Interest</Text>
            </TouchableOpacity>
          </View>

          {/* 4. RESULT CARD (Matching Pic 2 Compound Interest Result) */}
          {result && (
            <View style={styles.resultCard}>
              {/* Header */}
              <View style={styles.resultHeader}>
                <View style={styles.resultIconCircle}>
                  <Ionicons name="trending-up" size={18} color="#056B38" />
                </View>
                <Text style={styles.resultTitle}>Compound Interest Result</Text>
              </View>

              {/* 3 Metric Columns (Principal, Total Interest, Total Amount) */}
              <View style={styles.statsRow}>
                {/* Col 1: Principal */}
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Principal</Text>
                  <Text style={styles.statValueDark}>
                    {formatCurrency(result.principal)}
                  </Text>
                  <View style={styles.statBadge}>
                    <Ionicons name="person-outline" size={11} color="#056B38" style={{ marginRight: 3 }} />
                    <Text style={styles.statBadgeText}>Invested</Text>
                  </View>
                </View>

                <View style={styles.statDivider} />

                {/* Col 2: Total Interest */}
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Total Interest</Text>
                  <Text style={styles.statValueGreen}>
                    {formatCurrency(result.compoundInterest)}
                  </Text>
                  <View style={styles.statBadge}>
                    <Ionicons name="trending-up" size={11} color="#056B38" style={{ marginRight: 3 }} />
                    <Text style={styles.statBadgeText}>Earned</Text>
                  </View>
                </View>

                <View style={styles.statDivider} />

                {/* Col 3: Total Amount */}
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Total Amount</Text>
                  <Text style={styles.statValueDark}>
                    {formatCurrency(result.totalAmount)}
                  </Text>
                  <View style={styles.statBadge}>
                    <Ionicons name="wallet-outline" size={11} color="#056B38" style={{ marginRight: 3 }} />
                    <Text style={styles.statBadgeText}>Maturity</Text>
                  </View>
                </View>
              </View>

              {/* Detail Chips Row (Rate, Duration, Frequency) matching Pic 2 */}
              <View style={styles.detailChipsRow}>
                {/* Chip 1: Interest Rate */}
                <View style={styles.detailChip}>
                  <View style={styles.detailChipIconBox}>
                    <Ionicons name="information-circle-outline" size={14} color="#056B38" />
                  </View>
                  <View>
                    <Text style={styles.detailChipLabel}>Interest Rate</Text>
                    <Text style={styles.detailChipValue}>{result.ptr}% p.a.</Text>
                  </View>
                </View>

                {/* Chip 2: Time Period */}
                <View style={styles.detailChip}>
                  <View style={styles.detailChipIconBox}>
                    <Ionicons name="time-outline" size={14} color="#056B38" />
                  </View>
                  <View>
                    <Text style={styles.detailChipLabel}>Time Period</Text>
                    <Text style={styles.detailChipValue}>
                      {getTimePeriodString(result.years, result.months, result.days)}
                    </Text>
                  </View>
                </View>

                {/* Chip 3: Frequency */}
                <View style={styles.detailChip}>
                  <View style={styles.detailChipIconBox}>
                    <Ionicons name="analytics-outline" size={14} color="#056B38" />
                  </View>
                  <View>
                    <Text style={styles.detailChipLabel}>Frequency</Text>
                    <Text style={styles.detailChipValue}>
                      {getFrequencyLabel(result.compoundsPerYear)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 5. FORMULA NOTE CARD (Matching Pic 2 bottom green pill card) */}
          <View style={styles.formulaCard}>
            <Ionicons name="information-circle" size={18} color="#056B38" style={{ marginRight: 8 }} />
            <Text style={styles.formulaText}>
              Compound Interest Formula:{' '}
              <Text style={styles.formulaMath}>A = P (1 + R/n)^nt</Text>
            </Text>
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
  chartGraphicContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    position: 'absolute',
    bottom: 16,
    right: 12,
  },
  chartBar: {
    width: 6,
    backgroundColor: '#056B38',
    borderRadius: 2,
  },
  chartArrowIcon: {
    position: 'absolute',
    top: -12,
    right: -4,
  },
  coinStackBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 24,
    height: 18,
    justifyContent: 'center',
  },
  coin1: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginBottom: -2,
  },
  coin2: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#056B38',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginBottom: -2,
  },
  coin3: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#044C27',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  rupeeCoinBadge: {
    position: 'absolute',
    top: 6,
    left: 10,
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
  formSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
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
  frequencyScroll: {
    paddingVertical: 2,
    gap: 8,
  },
  freqButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  freqButtonActive: {
    backgroundColor: '#056B38',
    borderColor: '#056B38',
  },
  freqButtonText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  freqButtonTextActive: {
    color: '#FFFFFF',
  },
  frequencyDescText: {
    marginTop: 6,
    fontSize: 12,
    color: '#056B38',
    fontWeight: '600',
    marginLeft: 2,
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
    marginBottom: 16,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValueDark: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statValueGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: '#056B38',
    marginBottom: 4,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#F1F5F9',
  },
  detailChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  detailChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    gap: 6,
  },
  detailChipIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailChipLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  detailChipValue: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 1,
  },
  formulaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 24,
  },
  formulaText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  formulaMath: {
    fontWeight: '800',
    color: '#056B38',
  },
});
