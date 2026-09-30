import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MainStackParamList } from '../types/navigation';
import { AppInput } from '../components/AppInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { SuccessMessage } from '../components/SuccessMessage';
import { lenderRecordService } from '../services/lenderRecordService';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

type AddLenderRecordNavigationProp = NativeStackNavigationProp<MainStackParamList, 'AddLenderRecord'>;

interface Props {
  navigation: AddLenderRecordNavigationProp;
}

export const AddLenderRecordScreen: React.FC<Props> = ({ navigation }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload a screenshot.');
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

    if (!name.trim()) newErrors.name = 'Name is required.';
    
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

      await lenderRecordService.createLenderRecord(formData);
      setSuccess('Lender record created successfully!');
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        {/* TOP DARK SECTION */}
        <View style={styles.topDarkSection}>
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <View style={styles.backButtonInner}>
                <Ionicons name="arrow-back" size={20} color="#FFF" />
              </View>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Add Lender Record</Text>
              <Text style={styles.headerSubTitle}>Store details of the person who gave you money</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* THE WAVE CONNECTOR */}
        <View style={styles.waveConnectorDark}>
           <View style={styles.waveConnectorLightCutout} />
        </View>

        {/* BOTTOM LIGHT SECTION */}
        <View style={styles.bottomLightSection}>
          <View style={styles.content}>
            
            {error ? <ErrorMessage message={error} /> : null}
            {success ? <SuccessMessage message={success} /> : null}

            <View style={styles.cardNeu}>
              <Text style={styles.sectionTitle}>Link User (Optional)</Text>
              <AppInput
                label="User ID (Optional)"
                value={userId}
                onChangeText={(text) => setUserId(text.toUpperCase())}
                placeholder="USR-XXXXXXXX"
                error={errors.userId}
              />
              <Text style={styles.helperText}>If provided, a notification will be sent to this user.</Text>
            </View>

            {/* REQUIRED INFO NEU CARD */}
            <View style={styles.cardNeu}>
              <Text style={styles.sectionTitle}>Required Information</Text>
              <AppInput
                label="Lender Name *"
                value={name}
                onChangeText={setName}
                placeholder="Enter lender name"
                error={errors.name}
              />
              <AppInput
                label="Father Name (Optional)"
                value={fatherName}
                onChangeText={setFatherName}
                placeholder="Enter father name"
              />
              <AppInput
                label="Phone Number *"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                error={errors.phoneNumber}
              />
              <AppInput
                label="Amount Received *"
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                error={errors.amount}
              />
              <AppInput
                label="Interest Rate (%) *"
                value={interestRate}
                onChangeText={setInterestRate}
                placeholder="Enter interest rate"
                keyboardType="numeric"
                error={errors.interestRate}
              />

              <View style={styles.datePickerContainer}>
                <Text style={styles.label}>Received Date *</Text>
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: date.toISOString().split('T')[0],
                    onChange: (e: any) => {
                      if (e.target.value) {
                        const newDate = new Date(e.target.value);
                        if (!isNaN(newDate.getTime())) setDate(newDate);
                      }
                    },
                    style: {
                      height: 52, borderRadius: 12, borderWidth: 1, borderColor: COLORS.BORDER,
                      backgroundColor: COLORS.INPUT_BACKGROUND, paddingLeft: 16, paddingRight: 16,
                      fontSize: 15, color: COLORS.TEXT, outline: 'none', width: '100%', boxSizing: 'border-box',
                    }
                  })
                ) : (
                  <>
                    <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                      <Text style={styles.dateText}>{date.toISOString().split('T')[0]}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />
                    )}
                  </>
                )}
              </View>
            </View>

            {/* OPTIONAL INFO NEU CARD */}
            <View style={styles.cardNeu}>
              <TouchableOpacity 
                style={styles.optionalHeader} 
                onPress={() => setShowOptionalInfo(!showOptionalInfo)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Optional Information</Text>
                <Ionicons name={showOptionalInfo ? "chevron-up" : "chevron-down"} size={24} color="#2C3E50" />
              </TouchableOpacity>
              
              {showOptionalInfo && (
                <View style={styles.optionalContent}>
                  <AppInput label="Village" value={village} onChangeText={setVillage} placeholder="Enter village" />
                  <AppInput label="Mandal" value={mandal} onChangeText={setMandal} placeholder="Enter mandal" />
                  <AppInput label="Pincode" value={pincode} onChangeText={setPincode} placeholder="Enter pincode" keyboardType="number-pad" />
                  <AppInput label="District" value={district} onChangeText={setDistrict} placeholder="Enter district" />
                  <AppInput label="State" value={state} onChangeText={setState} placeholder="Enter state" />
                  <AppInput label="Country" value={country} onChangeText={setCountry} placeholder="Enter country" />
                  <AppInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Enter any notes" />
                </View>
              )}
            </View>

            {/* PAYMENT SCREENSHOT NEU CARD */}
            <View style={styles.cardNeu}>
              <Text style={styles.sectionTitle}>Payment Screenshot</Text>
              {paymentScreenshot ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: paymentScreenshot }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.changeImageBtn} onPress={() => setPaymentScreenshot(null)}>
                    <Text style={[styles.changeImageText, {color: '#E74C3C'}]}>Remove Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={styles.uploadBtnText}>Choose Image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ACTION BUTTON */}
            <View style={styles.actionsContainerNeu}>
              <TouchableOpacity 
                style={styles.actionBtnNeuPrimary} 
                onPress={handleSave} 
                disabled={saving}
                activeOpacity={0.8}
              >
                <Ionicons name="save" size={20} color="#FFF" style={{marginRight: 8}}/>
                <Text style={styles.actionBtnTextNeuPrimary}>
                  {saving ? "Saving..." : "Save Lender Record"}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EFF5' },
  topDarkSection: {
    backgroundColor: '#1A1B2F',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomRightRadius: 80,
    zIndex: 10,
  },
  waveConnectorDark: {
    height: 40,
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
    marginTop: -1,
  },
  scrollView: { flex: 1, backgroundColor: '#E9EFF5' },
  content: { paddingTop: 16, paddingBottom: 60 },
  customHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  backButtonInner: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  headerSubTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4 },
  cardNeu: {
    backgroundColor: '#E9EFF5', borderRadius: 24, padding: 24, marginBottom: 24,
    shadowColor: '#FFFFFF', shadowOffset: { width: -6, height: -6 }, shadowOpacity: 0.9,
    shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#FFF'
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2C3E50', marginBottom: 20 },
  helperText: { fontSize: 12, color: '#7F8C8D', marginTop: -8, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#6B7A93', marginBottom: 8 },
  datePickerContainer: { marginBottom: 16 },
  datePickerButton: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', borderRadius: 16,
    paddingHorizontal: 16, height: 56, justifyContent: 'center', shadowColor: '#A3B1C6',
    shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  dateText: { color: '#2C3E50', fontSize: 15, fontWeight: '500' },
  optionalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionalContent: { marginTop: 20 },
  uploadBtn: {
    backgroundColor: '#E9EFF5', borderWidth: 2, borderColor: '#FFF', borderStyle: 'dashed',
    borderRadius: 16, height: 120, justifyContent: 'center', alignItems: 'center'
  },
  uploadBtnText: { color: '#4A90E2', fontWeight: '700', fontSize: 16 },
  imagePreviewContainer: { alignItems: 'center' },
  imagePreview: { width: '100%', height: 200, borderRadius: 16, marginBottom: 16, resizeMode: 'cover', borderWidth: 2, borderColor: '#FFF' },
  changeImageBtn: { padding: 12, backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: 12 },
  changeImageText: { color: '#E74C3C', fontWeight: '800', fontSize: 14 },
  actionsContainerNeu: { marginTop: 8, marginBottom: 24 },
  actionBtnNeuPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4A90E2',
    paddingVertical: 18, borderRadius: 16, shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8
  },
  actionBtnTextNeuPrimary: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
