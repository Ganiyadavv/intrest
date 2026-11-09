import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
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
import { isValidEmail } from '../utils/validation';
import { Loading } from '../components/Loading';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'EditProfile'>;

interface Props {
  navigation: EditProfileScreenNavigationProp;
}

const processImageForProfile = async (
  uri: string,
  rawBase64?: string | null,
  mimeType?: string | null
): Promise<string> => {
  let dataUrl = '';

  if (rawBase64) {
    const mime = mimeType || 'image/jpeg';
    dataUrl = `data:${mime};base64,${rawBase64}`;
  } else if (uri.startsWith('data:')) {
    dataUrl = uri;
  } else if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('http')) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Failed to read image blob:', e);
      return uri;
    }
  } else {
    return uri;
  }

  // Compress & resize on Web using canvas to prevent payload errors and ensure fast upload and small storage (< 100KB)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && dataUrl.startsWith('data:image')) {
    try {
      dataUrl = await new Promise<string>((resolve) => {
        const img = new (window as any).Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(dataUrl);

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressed);
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      });
    } catch (e) {
      console.warn('Canvas compression failed:', e);
    }
  }

  return dataUrl;
};

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
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
        setFullName(
          user.fullName ||
            (user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || user.lastName || '')
        );
        setEmail(user.email || '');
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
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Sorry, we need camera roll permissions to make this work!');
          return;
        }
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const processed = await processImageForProfile(
          asset.uri,
          asset.base64,
          asset.mimeType
        );
        setProfileImage(processed);
      }
    } catch (err) {
      console.log('Image picker error', err);
      setError('Could not open image picker.');
    }
  };

  const handleUpdate = async () => {
    setError('');
    setSuccess('');

    if (!fullName) {
      setError('Full Name is required');
      return;
    }
    if (!email || !isValidEmail(email)) {
      setError('Valid email format is required');
      return;
    }

    setLoading(true);
    try {
      let finalProfileImage = profileImage;
      if (
        finalProfileImage &&
        (finalProfileImage.startsWith('blob:') ||
          (Platform.OS === 'web' && finalProfileImage.length > 500000))
      ) {
        finalProfileImage = await processImageForProfile(finalProfileImage);
      }

      const updatedUser = await userService.updateProfile({
        fullName,
        email,
        address,
        city,
        state,
        pincode,
        profileImage: finalProfileImage,
      });

      await saveUser(updatedUser);
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
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Loading fullScreen message="Loading Profile Data..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.appBarTitle}>Edit Profile</Text>

        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. AVATAR CARD */}
          <View style={styles.avatarCard}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.avatarWrapper}>
              <ProfileImage
                uri={profileImage}
                size={100}
                name={fullName}
                showCameraBadge={true}
                onEdit={pickImage}
                borderWidth={3.5}
                borderColor="#056B38"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage} activeOpacity={0.8}>
              <Ionicons name="camera" size={15} color="#056B38" style={{ marginRight: 6 }} />
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {error ? <ErrorMessage message={error} /> : null}
          {success ? <SuccessMessage message={success} /> : null}

          {/* 3. INPUT FORM CARD */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIconBox}>
                <Ionicons name="person" size={16} color="#056B38" />
              </View>
              <Text style={styles.cardHeaderTitle}>Personal Details</Text>
            </View>

            <AppInput
              label="Full Name *"
              placeholder="Enter full name"
              value={fullName}
              onChangeText={setFullName}
            />

            <AppInput
              label="Email Address *"
              placeholder="Enter email address"
              value={email}
              onChangeText={(text) => setEmail(text.toLowerCase())}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={[styles.cardHeader, { marginTop: 14 }]}>
              <View style={styles.cardHeaderIconBox}>
                <Ionicons name="location" size={16} color="#056B38" />
              </View>
              <Text style={styles.cardHeaderTitle}>Address Information</Text>
            </View>

            <AppInput
              label="Address"
              placeholder="Enter street / house address"
              value={address}
              onChangeText={setAddress}
            />

            <View style={styles.rowTwoCols}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <AppInput
                  label="City"
                  placeholder="Enter city"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <AppInput
                  label="State"
                  placeholder="Enter state"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <AppInput
              label="Pincode"
              placeholder="Enter 6-digit pincode"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              maxLength={6}
            />

            <AppButton
              title={loading ? 'Saving Changes...' : 'Save Changes'}
              onPress={handleUpdate}
              loading={loading}
              style={styles.updateButton}
              textStyle={styles.updateButtonText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  appBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrapper: {
    marginBottom: 8,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changePhotoText: {
    fontSize: 13,
    color: '#056B38',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  updateButton: {
    marginTop: 20,
    backgroundColor: '#056B38',
    borderRadius: 12,
    paddingVertical: 14,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
