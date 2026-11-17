import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MainStackParamList } from '../types/navigation';
import { personalRecordService } from '../services/personalRecordService';
import { PersonalRelationship } from '../types/personalRecord';

type EditPersonalRecordNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'EditPersonalRecord'
>;
type EditPersonalRecordRouteProp = RouteProp<MainStackParamList, 'EditPersonalRecord'>;

interface Props {
  navigation: EditPersonalRecordNavigationProp;
  route: EditPersonalRecordRouteProp;
}

const RELATIONSHIP_OPTIONS: { label: string; value: PersonalRelationship; icon: string }[] = [
  { label: 'Friend', value: 'Friend', icon: 'people-outline' },
  { label: 'Family', value: 'Family', icon: 'home-outline' },
  { label: 'Relative', value: 'Relative', icon: 'heart-outline' },
  { label: 'Other', value: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export const EditPersonalRecordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<PersonalRelationship>('Friend');
  const [showRelDropdown, setShowRelDropdown] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [givenDate, setGivenDate] = useState<Date>(new Date());
  const [showGivenPicker, setShowGivenPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await personalRecordService.getPersonalRecordById(id);
        setName(data.name || '');
        setRelationship((data.relationship as PersonalRelationship) || 'Friend');
        setPhoneNumber(data.phoneNumber || '');
        setAmount(String(data.amount || ''));
        if (data.givenDate) setGivenDate(new Date(data.givenDate));
        setNotes(data.notes || '');
        setPaymentScreenshot(data.paymentScreenshot || null);
      } catch (err: any) {
        Alert.alert('Error', 'Unable to load record for editing.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigation]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date (optional)';
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const toISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPaymentScreenshot(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to pick screenshot.');
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Person name is required.');
      return;
    }

    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('Validation Error', 'Valid amount is required.');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('relationship', relationship);
      if (phoneNumber.trim()) {
        formData.append('phoneNumber', phoneNumber.trim());
      }
      formData.append('amount', amount.trim());
      formData.append('givenDate', toISODate(givenDate));

      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      if (paymentScreenshot && paymentScreenshot.startsWith('file:')) {
        const filename = paymentScreenshot.split('/').pop() || 'screenshot.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('paymentScreenshot', {
          uri: paymentScreenshot,
          name: filename,
          type,
        } as any);
      }

      await personalRecordService.updatePersonalRecord(id, formData);
      if (Platform.OS === 'web') {
        window.alert('Record updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Success', 'Record updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update record.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* TOP HEADER */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Edit Personal Record</Text>
          <Text style={styles.headerSubtitle}>మన లెక్క</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          {/* Person Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Person Name</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color="#056B38" style={styles.inputIcon} />
              <TextInput style={styles.textInput} value={name} onChangeText={setName} />
            </View>
          </View>

          {/* Relationship */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Relationship</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setShowRelDropdown(!showRelDropdown)}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={20} color="#056B38" style={styles.inputIcon} />
              <Text style={styles.dropdownSelectedText}>{relationship}</Text>
              <Ionicons
                name={showRelDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>

            {showRelDropdown && (
              <View style={styles.dropdownMenu}>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.dropdownItem,
                      relationship === opt.value && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setRelationship(opt.value);
                      setShowRelDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownItemText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={20} color="#056B38" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          </View>

          {/* Amount */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Given Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date Given</Text>
            {Platform.OS === 'web' ? (
              React.createElement('input', {
                type: 'date',
                value: toISODate(givenDate),
                onChange: (e: any) => {
                  if (e.target.value) {
                    const parts = e.target.value.split('-');
                    if (parts.length === 3) {
                      const newDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                      if (!isNaN(newDate.getTime())) setGivenDate(newDate);
                    }
                  }
                },
                style: {
                  height: 50,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: '#E2E8F0',
                  backgroundColor: '#F8FAFC',
                  paddingLeft: 14,
                  paddingRight: 14,
                  fontSize: 14.5,
                  fontWeight: '600',
                  color: '#0F172A',
                  outlineStyle: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                },
              })
            ) : (
              <>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setShowGivenPicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={20} color="#056B38" style={styles.inputIcon} />
                  <Text style={styles.datePickerText}>{formatDate(givenDate)}</Text>
                </TouchableOpacity>
                {showGivenPicker && (
                  <DateTimePicker
                    value={givenDate}
                    mode="date"
                    display="default"
                    onChange={(_, d) => {
                      setShowGivenPicker(Platform.OS === 'ios');
                      if (d) setGivenDate(d);
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <View style={[styles.inputBox, { height: 80, alignItems: 'flex-start', paddingVertical: 8 }]}>
              <TextInput
                style={[styles.textInput, { textAlignVertical: 'top' }]}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          {/* Screenshot Proof */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Payment Screenshot (Proof)</Text>
            {paymentScreenshot ? (
              <View style={styles.screenshotPreviewCard}>
                <Image source={{ uri: paymentScreenshot }} style={styles.screenshotFullImage} />
                <View style={styles.screenshotBtnRow}>
                  <TouchableOpacity style={styles.screenshotActionBtn} onPress={pickImage}>
                    <Text style={styles.screenshotActionBtnText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.screenshotActionBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => setPaymentScreenshot(null)}
                  >
                    <Text style={[styles.screenshotActionBtnText, { color: '#DC2626' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.screenshotUploadDashed} onPress={pickImage}>
                <Ionicons name="cloud-upload-outline" size={24} color="#056B38" />
                <Text style={styles.uploadPrimaryText}>Upload Screenshot</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleUpdate}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Update Record</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#044E28',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topAppBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#044E28',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  rupeePrefix: {
    fontSize: 17,
    fontWeight: '800',
    color: '#056B38',
    marginRight: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 50,
  },
  dropdownSelectedText: {
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#F0FDF4',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 50,
  },
  datePickerText: {
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  screenshotUploadDashed: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#056B38',
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    paddingVertical: 20,
    alignItems: 'center',
  },
  uploadPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#056B38',
    marginTop: 4,
  },
  screenshotPreviewCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    overflow: 'hidden',
  },
  screenshotFullImage: {
    width: '100%',
    height: 180,
  },
  screenshotBtnRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    backgroundColor: '#F8FAFC',
  },
  screenshotActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
  },
  screenshotActionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#056B38',
  },
  saveBtn: {
    backgroundColor: '#056B38',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
