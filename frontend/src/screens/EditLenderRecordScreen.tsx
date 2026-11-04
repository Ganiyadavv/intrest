import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MainStackParamList } from '../types/navigation';
import { ErrorMessage } from '../components/ErrorMessage';
import { SuccessMessage } from '../components/SuccessMessage';
import { Loading } from '../components/Loading';
import { lenderRecordService } from '../services/lenderRecordService';
import { Ionicons } from '@expo/vector-icons';

type EditLenderRecordNavigationProp = NativeStackNavigationProp<MainStackParamList, 'EditLenderRecord'>;
type EditLenderRecordRouteProp = RouteProp<MainStackParamList, 'EditLenderRecord'>;

interface Props {
  navigation: EditLenderRecordNavigationProp;
  route: EditLenderRecordRouteProp;
}

const formatDateForInput = (d: Date | null): string => {
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDateDisplay = (d: Date | null): string => {
  if (!d || isNaN(d.getTime())) return 'Select date';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
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

export const EditLenderRecordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [pincode, setPincode] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [notes, setNotes] = useState('');

  // Date State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Optional Info Toggle State
  const [showOptionalInfo, setShowOptionalInfo] = useState(false);

  // Image State
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [existingScreenshot, setExistingScreenshot] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchLenderDetails();
  }, [id]);

  const fetchLenderDetails = async () => {
    try {
      const person = await lenderRecordService.getLenderRecordById(id);
      setUserId(person.targetUserId || '');
      setName(person.name || '');
      setFatherName(person.fatherName || '');
      setPhoneNumber(person.phoneNumber || '');
      setVillage(person.village || '');
      setMandal(person.mandal || '');
      setPincode(person.pincode || '');
      setDistrict(person.district || '');
      setState(person.state || '');
      setCountry(person.country || '');
      setAmount(person.amount ? person.amount.toString() : '');
      setInterestRate(person.interestRate ? person.interestRate.toString() : '');
      setNotes(person.notes || '');

      if (person.receivedDate) {
        const parsed = parseDateString(person.receivedDate);
        if (parsed) setDate(parsed);
      }

      if (person.paymentScreenshot) {
        setExistingScreenshot(person.paymentScreenshot);
      }

      if (
        person.fatherName ||
        person.village ||
        person.mandal ||
        person.pincode ||
        person.district ||
        person.state ||
        person.country
      ) {
        setShowOptionalInfo(true);
      }
    } catch (err) {
      setError('Failed to load lender details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPaymentScreenshot(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    let formattedUserId = userId.trim().toUpperCase();
    if (formattedUserId && !/^USR-[A-Z0-9]{8}$/.test(formattedUserId)) {
      newErrors.userId = 'Invalid User ID format. Example: USR-7K4M9X2Q';
    }

    if (!name.trim()) newErrors.name = 'Lender name is required.';

    const phoneRegex = /^\d{10}$/;
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (!phoneRegex.test(phoneNumber.trim().replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid 10-digit phone number.';
    }

    const amountNum = parseFloat(amount);
    if (!amount) {
      newErrors.amount = 'Amount is required.';
    } else if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Amount must be greater than 0.';
    }

    const interestNum = parseFloat(interestRate);
    if (!interestRate) {
      newErrors.interestRate = 'Interest rate is required.';
    } else if (isNaN(interestNum) || interestNum < 0) {
      newErrors.interestRate = 'Interest rate must be 0 or greater.';
    }

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      Alert.alert('Validation Error', 'Please check the required fields.');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();

      let formattedUserId = userId.trim().toUpperCase();
      if (formattedUserId) {
        formData.append('userId', formattedUserId);
      }

      formData.append('name', name);
      formData.append('phoneNumber', phoneNumber);
      formData.append('amount', amount);
      formData.append('interestRate', interestRate);
      formData.append('receivedDate', date.toISOString().split('T')[0]);

      if (fatherName) formData.append('fatherName', fatherName);
      if (village) formData.append('village', village);
      if (mandal) formData.append('mandal', mandal);
      if (pincode) formData.append('pincode', pincode);
      if (district) formData.append('district', district);
      if (state) formData.append('state', state);
      if (country) formData.append('country', country);
      if (notes) formData.append('notes', notes);

      if (paymentScreenshot) {
        if (Platform.OS === 'web') {
          const response = await fetch(paymentScreenshot);
          const blob = await response.blob();
          formData.append('paymentScreenshot', blob, 'screenshot.jpg');
        } else {
          const filename = paymentScreenshot.split('/').pop() || 'screenshot.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append('paymentScreenshot', {
            uri: paymentScreenshot,
            name: filename,
            type,
          } as any);
        }
      }

      await lenderRecordService.updateLenderRecord(id, formData);
      setSuccess('Lender record updated successfully!');

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Loading message="Loading lender details..." />
      </SafeAreaView>
    );
  }

  const currentScreenshot = paymentScreenshot || existingScreenshot;

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Lender Record</Text>
        <View style={styles.headerSpacer} />
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
          {error ? <ErrorMessage message={error} /> : null}
          {success ? <SuccessMessage message={success} /> : null}

          {/* FORM FIELDS (Matching Borrower Edit UI) */}
          <View style={styles.formCard}>
            {/* Lender Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Lender Name</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'name' && styles.inputBoxFocused,
                  errors.name ? styles.inputBoxError : null,
                ]}
              >
                <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIconLeft} />
                <TextInput
                  style={[styles.textInput, { outlineStyle: 'none' } as any]}
                  placeholder="Enter lender name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Phone Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'phoneNumber' && styles.inputBoxFocused,
                  errors.phoneNumber ? styles.inputBoxError : null,
                ]}
              >
                <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.inputIconLeft} />
                <TextInput
                  style={[styles.textInput, { outlineStyle: 'none' } as any]}
                  placeholder="Enter phone number"
                  placeholderTextColor="#94A3B8"
                  value={phoneNumber}
                  onFocus={() => setFocusedField('phoneNumber')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                  }}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
            </View>

            {/* Amount Received */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Amount Received</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'amount' && styles.inputBoxFocused,
                  errors.amount ? styles.inputBoxError : null,
                ]}
              >
                <Text style={styles.inputCurrencyLeft}>₹</Text>
                <TextInput
                  style={[styles.textInput, { outlineStyle: 'none' } as any]}
                  placeholder="Enter amount"
                  placeholderTextColor="#94A3B8"
                  value={amount}
                  onFocus={() => setFocusedField('amount')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(text) => {
                    setAmount(text);
                    if (errors.amount) setErrors({ ...errors, amount: '' });
                  }}
                  keyboardType="numeric"
                />
              </View>
              {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
            </View>

            {/* Interest Rate (% per month) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Interest Rate (% per month)</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'interestRate' && styles.inputBoxFocused,
                  errors.interestRate ? styles.inputBoxError : null,
                ]}
              >
                <TextInput
                  style={[styles.textInput, { outlineStyle: 'none' } as any]}
                  placeholder="Enter rate"
                  placeholderTextColor="#94A3B8"
                  value={interestRate}
                  onFocus={() => setFocusedField('interestRate')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(text) => {
                    setInterestRate(text);
                    if (errors.interestRate) setErrors({ ...errors, interestRate: '' });
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.inputSuffixRight}>%</Text>
              </View>
              {errors.interestRate ? <Text style={styles.errorText}>{errors.interestRate}</Text> : null}
            </View>

            {/* Received Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Received Date</Text>
              {Platform.OS === 'web' ? (
                React.createElement('input', {
                  type: 'date',
                  value: formatDateForInput(date),
                  onChange: (e: any) => {
                    if (e.target.value) {
                      const newDate = parseDateString(e.target.value);
                      if (newDate) setDate(newDate);
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
                    height: 50,
                    borderRadius: 14,
                    borderWidth: 1,
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
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerText}>{formatDateDisplay(date)}</Text>
                    <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                    />
                  )}
                </>
              )}
            </View>

            {/* Link User ID (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>User ID (Optional)</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'userId' && styles.inputBoxFocused,
                  errors.userId ? styles.inputBoxError : null,
                ]}
              >
                <Ionicons name="link-outline" size={18} color="#94A3B8" style={styles.inputIconLeft} />
                <TextInput
                  style={[styles.textInput, { outlineStyle: 'none' } as any]}
                  placeholder="USR-XXXXXXXX"
                  placeholderTextColor="#94A3B8"
                  value={userId}
                  onFocus={() => setFocusedField('userId')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(text) => {
                    setUserId(text.toUpperCase());
                    if (errors.userId) setErrors({ ...errors, userId: '' });
                  }}
                  autoCapitalize="characters"
                />
              </View>
              <Text style={styles.fieldHelperText}>
                If provided, a notification will be sent to this user.
              </Text>
              {errors.userId ? <Text style={styles.errorText}>{errors.userId}</Text> : null}
            </View>

            {/* Notes (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes (Optional)</Text>
              <View
                style={[
                  styles.inputBox,
                  styles.inputBoxMultiline,
                  focusedField === 'notes' && styles.inputBoxFocused,
                ]}
              >
                <TextInput
                  style={[styles.textInput, styles.textInputMultiline, { outlineStyle: 'none' } as any]}
                  placeholder="Add notes"
                  placeholderTextColor="#94A3B8"
                  value={notes}
                  onFocus={() => setFocusedField('notes')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Payment Screenshot Upload */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Payment Screenshot (Optional)</Text>
              <Text style={styles.fieldHelperText}>
                Attach transaction proof (UPI slip, bank receipt, or cash voucher)
              </Text>
              {currentScreenshot ? (
                <View style={styles.screenshotPreviewCard}>
                  <Image source={{ uri: currentScreenshot }} style={styles.screenshotFullImage} />
                  <View style={styles.screenshotBtnRow}>
                    <TouchableOpacity style={styles.screenshotActionBtn} onPress={pickImage} activeOpacity={0.7}>
                      <Ionicons name="camera-outline" size={16} color="#056B38" style={{ marginRight: 4 }} />
                      <Text style={styles.screenshotActionBtnText}>Change Screenshot</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.screenshotActionBtn, styles.screenshotRemoveBtn]}
                      onPress={() => {
                        setPaymentScreenshot(null);
                        setExistingScreenshot(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" style={{ marginRight: 4 }} />
                      <Text style={[styles.screenshotActionBtnText, { color: '#DC2626' }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.screenshotUploadDashed} onPress={pickImage} activeOpacity={0.7}>
                  <View style={styles.uploadIconBadge}>
                    <Ionicons name="receipt-outline" size={24} color="#056B38" />
                  </View>
                  <Text style={styles.uploadPrimaryText}>Upload Payment Screenshot</Text>
                  <Text style={styles.uploadSubText}>PNG, JPG or JPEG from your gallery</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Expandable: Additional Details (Father name, Address, etc.) */}
            <View style={styles.optionalSection}>
              <TouchableOpacity
                style={styles.optionalHeader}
                onPress={() => setShowOptionalInfo(!showOptionalInfo)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionalHeaderTitle}>Additional Details (Optional)</Text>
                <Ionicons
                  name={showOptionalInfo ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showOptionalInfo && (
                <View style={styles.optionalBody}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Father Name</Text>
                    <View style={[styles.inputBox, focusedField === 'fatherName' && styles.inputBoxFocused]}>
                      <TextInput
                        style={[styles.textInput, { outlineStyle: 'none' } as any]}
                        placeholder="Enter father name"
                        placeholderTextColor="#94A3B8"
                        value={fatherName}
                        onFocus={() => setFocusedField('fatherName')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setFatherName}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Village / Town</Text>
                    <View style={[styles.inputBox, focusedField === 'village' && styles.inputBoxFocused]}>
                      <TextInput
                        style={[styles.textInput, { outlineStyle: 'none' } as any]}
                        placeholder="Enter village or town"
                        placeholderTextColor="#94A3B8"
                        value={village}
                        onFocus={() => setFocusedField('village')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setVillage}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Mandal</Text>
                    <View style={[styles.inputBox, focusedField === 'mandal' && styles.inputBoxFocused]}>
                      <TextInput
                        style={[styles.textInput, { outlineStyle: 'none' } as any]}
                        placeholder="Enter mandal"
                        placeholderTextColor="#94A3B8"
                        value={mandal}
                        onFocus={() => setFocusedField('mandal')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setMandal}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Pincode</Text>
                    <View style={[styles.inputBox, focusedField === 'pincode' && styles.inputBoxFocused]}>
                      <TextInput
                        style={[styles.textInput, { outlineStyle: 'none' } as any]}
                        placeholder="Enter pincode"
                        placeholderTextColor="#94A3B8"
                        value={pincode}
                        onFocus={() => setFocusedField('pincode')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setPincode}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>District</Text>
                    <View style={[styles.inputBox, focusedField === 'district' && styles.inputBoxFocused]}>
                      <TextInput
                        style={[styles.textInput, { outlineStyle: 'none' } as any]}
                        placeholder="Enter district"
                        placeholderTextColor="#94A3B8"
                        value={district}
                        onFocus={() => setFocusedField('district')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setDistrict}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>State</Text>
                    <View style={[styles.inputBox, focusedField === 'state' && styles.inputBoxFocused]}>
                      <TextInput
                        style={[styles.textInput, { outlineStyle: 'none' } as any]}
                        placeholder="Enter state"
                        placeholderTextColor="#94A3B8"
                        value={state}
                        onFocus={() => setFocusedField('state')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setState}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Country</Text>
                    <View style={[styles.inputBox, focusedField === 'country' && styles.inputBoxFocused]}>
                      <TextInput
                        style={[styles.textInput, { outlineStyle: 'none' } as any]}
                        placeholder="Enter country"
                        placeholderTextColor="#94A3B8"
                        value={country}
                        onFocus={() => setFocusedField('country')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setCountry}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Updating...' : 'Update Lender Record'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 6,
  },
  fieldHelperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 50,
    paddingHorizontal: 14,
  },
  inputBoxBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 50,
    paddingHorizontal: 14,
  },
  inputBoxFocused: {
    borderColor: '#056B38',
    borderWidth: 1.5,
  },
  inputBoxError: {
    borderColor: '#DC2626',
  },
  inputBoxMultiline: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  inputCurrencyLeft: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 8,
  },
  inputSuffixRight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
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
  textInputMultiline: {
    height: '100%',
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '500',
  },
  datePickerText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  screenshotPreviewCard: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  screenshotFullImage: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
    backgroundColor: '#0F172A',
  },
  screenshotBtnRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  screenshotActionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  screenshotRemoveBtn: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  screenshotActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#056B38',
  },
  screenshotUploadDashed: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#056B38',
    marginBottom: 2,
  },
  uploadSubText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  optionalSection: {
    marginTop: 6,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  optionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  optionalHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  optionalBody: {
    marginTop: 12,
  },
  saveBtn: {
    backgroundColor: '#056B38',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
