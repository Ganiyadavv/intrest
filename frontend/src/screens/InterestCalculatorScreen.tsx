import React, { useState, useEffect } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ErrorMessage } from '../components/ErrorMessage';
import {
  calculateMonthlyInterest,
  calculateTotalMonths,
  calculateTotalInterestCalc,
  calculateTotalAmount,
} from '../utils/interestCalculator';
import { formatCurrency } from '../utils/currency';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

type InterestCalculatorScreenNavigationProp = NativeStackNavigationProp<any, 'InterestCalculator'>;
type InterestCalculatorScreenRouteProp = RouteProp<any, 'InterestCalculator'>;

interface Props {
  navigation: InterestCalculatorScreenNavigationProp;
  route: InterestCalculatorScreenRouteProp;
}

const formatDateForInput = (d: Date | null): string => {
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDateString = (str: string | null | undefined): Date | null => {
  if (!str) return null;
  const parts = str.split('T')[0].split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
};

const formatDateDisplay = (d: Date | null): string => {
  if (!d || isNaN(d.getTime())) return 'Select date';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const InterestCalculatorScreen: React.FC<Props> = ({ navigation, route }) => {
  const isFromRecord = Boolean(route.params?.givenDate || route.params?.principal);
  const personName = route.params?.personName;

  const [calculationMode, setCalculationMode] = useState<'DURATION' | 'DATES'>(
    isFromRecord ? 'DATES' : 'DURATION'
  );

  const [principal, setPrincipal] = useState(route.params?.principal || '');
  const [ptr, setPtr] = useState(route.params?.rate || '');
  const [years, setYears] = useState(route.params?.years || '0');
  const [months, setMonths] = useState(route.params?.months || '0');
  const [days, setDays] = useState(route.params?.days || '0');

  const [givenDate, setGivenDate] = useState<Date | null>(
    parseDateString(route.params?.givenDate)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Sync state if navigation route params change
  useEffect(() => {
    if (route.params) {
      if (route.params.principal !== undefined) setPrincipal(route.params.principal.toString());
      if (route.params.rate !== undefined) setPtr(route.params.rate.toString());
      if (route.params.givenDate) {
        const parsed = parseDateString(route.params.givenDate);
        if (parsed) {
          setGivenDate(parsed);
          setCalculationMode('DATES');
        }
      }
      if (route.params.years !== undefined) setYears(route.params.years.toString());
      if (route.params.months !== undefined) setMonths(route.params.months.toString());
      if (route.params.days !== undefined) setDays(route.params.days.toString());
    }
  }, [route.params]);

  // Helper for numeric duration change
  const handleDurationChange = (val: string, setter: (v: string) => void) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 1 && cleaned.startsWith('0')) {
      setter(cleaned.replace(/^0+/, ''));
    } else {
      setter(cleaned);
    }
  };

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

  // Recalculate duration when givenDate or endDate changes (only in DATES mode)
  useEffect(() => {
    if (givenDate && calculationMode === 'DATES') {
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
  }, [endDate, givenDate, calculationMode]);

  // Run initial calculation automatically if params were supplied from Borrower Details
  useEffect(() => {
    if (route.params?.principal && route.params?.rate) {
      const p = parseFloat(route.params.principal);
      const r = parseFloat(route.params.rate);
      const y = parseInt(years, 10) || 0;
      const m = parseInt(months, 10) || 0;
      const d = parseInt(days, 10) || 0;

      if (!isNaN(p) && p > 0 && !isNaN(r) && r >= 0) {
        const monthlyInterest = calculateMonthlyInterest(p, r);
        const totalMonths = calculateTotalMonths(y, m, d);
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
          totalAmount,
        });
      }
    }
  }, [years, months, days]);

  const handleCalculate = () => {
    setError('');
    setResult(null);

    const p = parseFloat(principal);
    const r = parseFloat(ptr);
    const y = years ? parseInt(years, 10) : 0;
    const m = months ? parseInt(months, 10) : 0;
    const d = days ? parseInt(days, 10) : 0;

    if (!principal || isNaN(p) || p <= 0) {
      setError('Please enter a valid loan amount greater than 0.');
      return;
    }
    if (!ptr || isNaN(r) || r < 0) {
      setError('Please enter a valid interest rate.');
      return;
    }
    if (isNaN(y) || y < 0 || isNaN(m) || m < 0 || isNaN(d) || d < 0) {
      setError('Negative duration is not allowed.');
      return;
    }

    const monthlyInterest = calculateMonthlyInterest(p, r);
    const totalMonths = calculateTotalMonths(y, m, d);

    let totalInterest = 0;
    if (totalMonths > 0) {
      totalInterest = calculateTotalInterestCalc(p, r, y, m, d);
    }

    const totalAmount = calculateTotalAmount(p, totalInterest);

    if (isNaN(totalAmount) || !isFinite(totalAmount)) {
      setError('Unable to calculate with the entered values. Please check your inputs.');
      return;
    }

    setResult({
      principal: p,
      ptr: r,
      years: y,
      months: m,
      days: d,
      monthlyInterest,
      totalMonths,
      totalInterest,
      totalAmount,
    });
  };

  const handleReset = () => {
    if (isFromRecord) {
      setEndDate(new Date());
      setError('');
    } else {
      setPrincipal('');
      setPtr('');
      setYears('0');
      setMonths('0');
      setDays('0');
      setGivenDate(null);
      setEndDate(new Date());
      setError('');
      setResult(null);
    }
  };

  const formattedGivenDate = formatDateDisplay(givenDate);
  const formattedEndDate = formatDateDisplay(endDate);

  const getTimePeriodString = (y: number, m: number, d: number) => {
    const parts: string[] = [];
    if (y > 0) parts.push(`${y} Yr${y > 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} Mo${m > 1 ? 's' : ''}`);
    if (d > 0) parts.push(`${d} Day${d > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' ') : '0 Days';
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
              <Text style={styles.screenTitle}>Simple Interest</Text>
              <Text style={styles.screenSubtitle}>
                Calculate simple interest quickly and easily
              </Text>
            </View>

            {/* Graphic Illustration (Rupee coin, clipboard, and calculator) */}
            <View style={styles.illustrationWrapper}>
              <View style={styles.illustrationCircle}>
                <View style={styles.leafDecor1} />
                <View style={styles.leafDecor2} />

                {/* Clipboard Card */}
                <View style={styles.clipboardCard}>
                  <View style={styles.clipboardClip} />
                  <View style={styles.clipboardLine1} />
                  <View style={styles.clipboardLine2} />
                  <View style={styles.clipboardLine3} />
                </View>

                {/* Calculator icon badge */}
                <View style={styles.calcGraphicBadge}>
                  <Ionicons name="calculator" size={22} color="#056B38" />
                </View>

                {/* Rupee Coin Badge */}
                <View style={styles.rupeeCoinBadge}>
                  <Text style={styles.rupeeCoinText}>₹</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Linked Record Banner if opened from Borrower / Lender details */}
          {personName && (
            <View style={styles.personBanner}>
              <View style={styles.personBannerAvatar}>
                <Text style={styles.personBannerAvatarText}>
                  {personName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personBannerTitle}>{personName}</Text>
                <Text style={styles.personBannerSubtitle}>Record Details Linked</Text>
              </View>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={12} color="#64748B" />
                <Text style={styles.lockBadgeText}>Read-Only</Text>
              </View>
            </View>
          )}

          {/* 3. FORM CARD (Matching Pic 1 layout & preserving all fields) */}
          <View style={styles.formCard}>
            <Text style={styles.formSectionHeader}>Enter Details</Text>
            {error ? <ErrorMessage message={error} /> : null}

            {/* Field: Loan Amount (Principal) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Principal Amount (₹)</Text>
                {isFromRecord && (
                  <View style={styles.lockedPill}>
                    <Ionicons name="lock-closed" size={11} color="#64748B" />
                    <Text style={styles.lockedPillText}>Fixed</Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.inputBox,
                  isFromRecord
                    ? styles.inputBoxReadOnly
                    : focusedField === 'principal' && styles.inputBoxFocused,
                ]}
              >
                <View style={styles.inputPrefixBadge}>
                  <Ionicons name="calculator" size={16} color="#056B38" />
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    isFromRecord && styles.textReadOnly,
                    { outlineStyle: 'none' } as any,
                  ]}
                  placeholder="e.g., 1,00,000"
                  placeholderTextColor="#94A3B8"
                  value={principal}
                  editable={!isFromRecord}
                  onFocus={() => !isFromRecord && setFocusedField('principal')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setPrincipal}
                  keyboardType="numeric"
                />
                {isFromRecord && <Ionicons name="lock-closed" size={14} color="#94A3B8" />}
              </View>
            </View>

            {/* Field: Annual Interest Rate (% p.a. or % per month) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Annual Interest Rate (% p.a.)</Text>
                {isFromRecord && (
                  <View style={styles.lockedPill}>
                    <Ionicons name="lock-closed" size={11} color="#64748B" />
                    <Text style={styles.lockedPillText}>Fixed</Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.inputBox,
                  isFromRecord
                    ? styles.inputBoxReadOnly
                    : focusedField === 'ptr' && styles.inputBoxFocused,
                ]}
              >
                <View style={styles.inputPrefixBadge}>
                  <Ionicons name="time-outline" size={16} color="#056B38" />
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    isFromRecord && styles.textReadOnly,
                    { outlineStyle: 'none' } as any,
                  ]}
                  placeholder="e.g., 10"
                  placeholderTextColor="#94A3B8"
                  value={ptr}
                  editable={!isFromRecord}
                  onFocus={() => !isFromRecord && setFocusedField('ptr')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setPtr}
                  keyboardType="numeric"
                />
                <Text style={[styles.inputSuffix, isFromRecord && styles.textReadOnly]}>%</Text>
                {isFromRecord && (
                  <Ionicons
                    name="lock-closed"
                    size={14}
                    color="#94A3B8"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
            </View>

            {/* MODE SWITCHER (When not opened from a fixed record) */}
            {!isFromRecord && (
              <View style={styles.modeSwitchContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeSwitchTab,
                    calculationMode === 'DURATION' && styles.modeSwitchTabActive,
                  ]}
                  onPress={() => setCalculationMode('DURATION')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={calculationMode === 'DURATION' ? '#056B38' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.modeSwitchTabText,
                      calculationMode === 'DURATION' && styles.modeSwitchTabTextActive,
                    ]}
                  >
                    By Duration
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeSwitchTab,
                    calculationMode === 'DATES' && styles.modeSwitchTabActive,
                  ]}
                  onPress={() => setCalculationMode('DATES')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={calculationMode === 'DATES' ? '#056B38' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.modeSwitchTabText,
                      calculationMode === 'DATES' && styles.modeSwitchTabTextActive,
                    ]}
                  >
                    By Dates
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* DURATION INPUTS (When calculationMode is DURATION) */}
            {calculationMode === 'DURATION' ? (
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
            ) : (
              <>
                {/* Field: Loan Given Date */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Loan Given Date</Text>
                    {isFromRecord && (
                      <View style={styles.lockedPill}>
                        <Ionicons name="lock-closed" size={11} color="#64748B" />
                        <Text style={styles.lockedPillText}>Fixed</Text>
                      </View>
                    )}
                  </View>
                  {isFromRecord ? (
                    <View style={[styles.inputBoxBetween, styles.inputBoxReadOnly]}>
                      <Text style={[styles.datePickerText, styles.textReadOnly]}>
                        {formattedGivenDate}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="lock-closed" size={14} color="#94A3B8" />
                        <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                      </View>
                    </View>
                  ) : Platform.OS === 'web' ? (
                    React.createElement('input', {
                      type: 'date',
                      value: formatDateForInput(givenDate),
                      onChange: (e: any) => {
                        if (e.target.value) {
                          const newD = parseDateString(e.target.value);
                          if (newD) setGivenDate(newD);
                        }
                      },
                      onFocus: (e: any) => {
                        e.target.style.borderColor = '#056B38';
                        e.target.style.borderWidth = '1.5px';
                      },
                      onBlur: (e: any) => {
                        e.target.style.borderColor = '#E2E8F0';
                        e.target.style.borderWidth = '1px';
                      },
                      style: {
                        height: 52,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: '#E2E8F0',
                        backgroundColor: '#FFFFFF',
                        paddingLeft: 14,
                        paddingRight: 14,
                        fontSize: 14,
                        color: '#1E293B',
                        outlineStyle: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      },
                    })
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.inputBoxBetween}
                        onPress={() => setShowStartDatePicker(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.datePickerText}>{formattedGivenDate}</Text>
                        <Ionicons name="calendar-outline" size={18} color="#056B38" />
                      </TouchableOpacity>
                      {showStartDatePicker && (
                        <DateTimePicker
                          value={givenDate || new Date()}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowStartDatePicker(Platform.OS === 'ios');
                            if (selectedDate) setGivenDate(selectedDate);
                          }}
                        />
                      )}
                    </>
                  )}
                </View>

                {/* Field: Calculate To Date (End Date) */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Calculate To Date (End Date)</Text>
                    <View style={styles.editablePill}>
                      <Ionicons name="calendar" size={11} color="#056B38" />
                      <Text style={styles.editablePillText}>Select End Date</Text>
                    </View>
                  </View>
                  {Platform.OS === 'web' ? (
                    React.createElement('input', {
                      type: 'date',
                      value: formatDateForInput(endDate),
                      onChange: (e: any) => {
                        if (e.target.value) {
                          const newD = parseDateString(e.target.value);
                          if (newD) setEndDate(newD);
                        }
                      },
                      onFocus: (e: any) => {
                        e.target.style.borderColor = '#056B38';
                        e.target.style.borderWidth = '1.5px';
                      },
                      onBlur: (e: any) => {
                        e.target.style.borderColor = '#E2E8F0';
                        e.target.style.borderWidth = '1px';
                      },
                      style: {
                        height: 52,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: '#E2E8F0',
                        backgroundColor: '#FFFFFF',
                        paddingLeft: 14,
                        paddingRight: 14,
                        fontSize: 14,
                        color: '#1E293B',
                        outlineStyle: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      },
                    })
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.inputBoxBetween}
                        onPress={() => setShowEndDatePicker(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.datePickerText}>{formattedEndDate}</Text>
                        <Ionicons name="calendar-outline" size={18} color="#056B38" />
                      </TouchableOpacity>
                      {showEndDatePicker && (
                        <DateTimePicker
                          value={endDate}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowEndDatePicker(Platform.OS === 'ios');
                            if (selectedDate) setEndDate(selectedDate);
                          }}
                        />
                      )}
                    </>
                  )}
                </View>

                {/* Calculated Duration Display Card */}
                <View style={styles.durationCard}>
                  <View style={styles.durationIconCircle}>
                    <Ionicons name="time-outline" size={18} color="#056B38" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.durationLabel}>Calculated Duration</Text>
                    <Text style={styles.durationValue}>
                      {years} Years, {months} Months, {days} Days
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Calculate Button */}
            <TouchableOpacity
              style={styles.calculateBtn}
              onPress={handleCalculate}
              activeOpacity={0.85}
            >
              <Ionicons name="calculator" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.calculateBtnText}>Calculate Simple Interest</Text>
            </TouchableOpacity>
          </View>

          {/* 4. RESULT CARD (Matching Pic 1 Simple Interest Result) */}
          {result && (
            <View style={styles.resultCard}>
              {/* Header */}
              <View style={styles.resultHeader}>
                <View style={styles.resultIconCircle}>
                  <Ionicons name="trending-up" size={18} color="#056B38" />
                </View>
                <Text style={styles.resultTitle}>Simple Interest Result</Text>
              </View>

              {/* 3 Metric Columns (Principal, Interest, Total Amount) matching Pic 1 */}
              <View style={styles.statsRow}>
                {/* Col 1: Principal */}
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Principal</Text>
                  <Text style={styles.statValueDark}>
                    {formatCurrency(result.principal)}
                  </Text>
                  <View style={styles.statBadge}>
                    <Ionicons name="person-outline" size={11} color="#056B38" style={{ marginRight: 3 }} />
                    <Text style={styles.statBadgeText}>Principal</Text>
                  </View>
                </View>

                <View style={styles.statDivider} />

                {/* Col 2: Total Interest */}
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Interest</Text>
                  <Text style={styles.statValueGreen}>
                    {formatCurrency(result.totalInterest)}
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

              {/* 2 Detail Chips (Interest Rate, Time Period) matching Pic 1 */}
              <View style={styles.detailChipsRow}>
                {/* Chip 1: Interest Rate */}
                <View style={styles.detailChip}>
                  <View style={styles.detailChipIconBox}>
                    <Ionicons name="information-circle-outline" size={14} color="#056B38" />
                  </View>
                  <View>
                    <Text style={styles.detailChipLabel}>Interest Rate</Text>
                    <Text style={styles.detailChipValue}>{result.ptr}% / mo</Text>
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
              </View>

              {/* Monthly Interest note */}
              <View style={styles.monthlyInterestStrip}>
                <Text style={styles.monthlyInterestLabel}>Monthly Interest Rate:</Text>
                <Text style={styles.monthlyInterestValue}>
                  {formatCurrency(result.monthlyInterest)} / month
                </Text>
              </View>
            </View>
          )}

          {/* 5. FORMULA NOTE CARD (Matching Pic 1 bottom green pill card) */}
          <View style={styles.formulaCard}>
            <Ionicons name="information-circle" size={18} color="#056B38" style={{ marginRight: 8 }} />
            <Text style={styles.formulaText}>
              Simple Interest Formula:{' '}
              <Text style={styles.formulaMath}>SI = (P × R × T) / 100</Text>
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
  clipboardCard: {
    width: 36,
    height: 46,
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
    width: 22,
    height: 2.5,
    backgroundColor: '#CBD5E1',
    borderRadius: 1.5,
    marginVertical: 2,
  },
  clipboardLine2: {
    width: 16,
    height: 2.5,
    backgroundColor: '#E2E8F0',
    borderRadius: 1.5,
    marginVertical: 2,
  },
  clipboardLine3: {
    width: 18,
    height: 2.5,
    backgroundColor: '#CBD5E1',
    borderRadius: 1.5,
    marginVertical: 2,
  },
  calcGraphicBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
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
  rupeeCoinBadge: {
    position: 'absolute',
    top: 6,
    left: 8,
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
  personBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  personBannerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personBannerAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  personBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  personBannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedPillText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  editablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editablePillText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
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
  inputBoxReadOnly: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        cursor: 'default',
        userSelect: 'none',
      } as any,
    }),
  },
  textReadOnly: {
    color: '#334155',
    fontWeight: '700',
  },
  inputBoxBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 52,
    paddingHorizontal: 14,
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
  inputSuffix: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
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
  datePickerText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  modeSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeSwitchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  modeSwitchTabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      },
    }),
  },
  modeSwitchTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeSwitchTabTextActive: {
    color: '#056B38',
    fontWeight: '800',
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
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  durationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  durationValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532D',
    marginTop: 2,
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
  monthlyInterestStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  monthlyInterestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  monthlyInterestValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#056B38',
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
