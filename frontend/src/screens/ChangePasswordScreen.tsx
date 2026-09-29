import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types/navigation';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { ErrorMessage } from '../components/ErrorMessage';
import { SuccessMessage } from '../components/SuccessMessage';
import { authService } from '../services/authService';

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ChangePassword'>;

interface Props {
  navigation: ChangePasswordScreenNavigationProp;
}

export const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');
    
    if (!currentPassword) { setError('Current Password is required'); return; }
    if (!newPassword) { setError('New Password is required'); return; }
    if (newPassword !== confirmPassword) { setError('New Passwords do not match'); return; }

    setLoading(true);
    try {
      await authService.changePassword({
        oldPassword: currentPassword,
        newPassword
      });
      
      setSuccess('Password changed successfully');
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Error occurred while changing password');
    } finally {
      setLoading(false);
    }
  };

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
                <Text style={styles.headerTitle}>Change Password</Text>
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
                  label="Current Password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
                <AppInput
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <AppInput
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <AppButton
                  title={loading ? "Changing..." : "Change Password"}
                  onPress={handleChangePassword}
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
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 60,
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
    marginTop: -40,
  },
  updateButton: {
    marginTop: 32,
    backgroundColor: '#F39C12',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#F39C12',
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
