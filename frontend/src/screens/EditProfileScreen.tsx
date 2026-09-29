import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { ErrorMessage } from '../components/ErrorMessage';
import { SuccessMessage } from '../components/SuccessMessage';
import { ProfileImage } from '../components/ProfileImage';
import { userService } from '../services/userService';
import { getUser, saveUser } from '../storage/storage';
import { isValidEmail, isValidPhone } from '../utils/validation';
import { COLORS } from '../constants/colors';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'EditProfile'>;

interface Props {
  navigation: EditProfileScreenNavigationProp;
}

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      const user = await getUser();
      if (user) {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setPhoneNumber(user.phoneNumber || '');
        setAddress(user.address || '');
        setCity(user.city || '');
        setState(user.state || '');
        setPincode(user.pincode || '');
        setProfileImage(user.profileImage || null);
      }
      setInitialLoading(false);
    };
    loadUserData();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    setError('');
    setSuccess('');
    
    if (!firstName) { setError('First Name is required'); return; }
    if (!lastName) { setError('Last Name is required'); return; }
    if (!email || !isValidEmail(email)) { setError('Valid email format is required'); return; }
    if (!phoneNumber || !isValidPhone(phoneNumber)) { setError('Valid phone number is required'); return; }

    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile({
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        city,
        state,
        pincode,
        profileImage
      });
      
      await saveUser(updatedUser); // Update local storage
      setSuccess('Profile updated successfully');
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <View style={styles.container} />; // Or a loader
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.mainBackground}>
            
            {/* TOP DARK SECTION */}
            <View style={styles.topDarkSection}>
              <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
              </View>

              <View style={styles.profileSection}>
                <ProfileImage uri={profileImage} onEdit={pickImage} />
              </View>
              
              <ErrorMessage message={error} />
              <SuccessMessage message={success} />
            </View>

            {/* WAVE CONNECTOR */}
            <View style={styles.waveConnectorDark}>
               <View style={styles.waveConnectorLightCutout} />
            </View>

            {/* BOTTOM LIGHT SECTION */}
            <View style={styles.bottomLightSection}>
              <View style={styles.formContainer}>
                <AppInput
                  label="First Name"
                  placeholder="Enter first name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <AppInput
                  label="Last Name"
                  placeholder="Enter last name"
                  value={lastName}
                  onChangeText={setLastName}
                />
                <AppInput
                  label="Email"
                  placeholder="Enter email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <AppInput
                  label="Phone"
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
                <AppInput
                  label="Address"
                  placeholder="Enter address"
                  value={address}
                  onChangeText={setAddress}
                />
                <AppInput
                  label="City"
                  placeholder="Enter city"
                  value={city}
                  onChangeText={setCity}
                />
                <AppInput
                  label="State"
                  placeholder="Enter state"
                  value={state}
                  onChangeText={setState}
                />
                <AppInput
                  label="Pincode"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="numeric"
                />

                <AppButton
                  title={loading ? "Updating Profile..." : "Save Changes"}
                  onPress={handleUpdate}
                  loading={loading}
                  style={styles.updateButton}
                  textStyle={styles.updateButtonText}
                />
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
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomRightRadius: 80,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 10,
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
    paddingBottom: 48,
    marginTop: -1,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginTop: -20,
  },
  updateButton: {
    marginTop: 32,
    backgroundColor: '#1A1B2F',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#1A1B2F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
