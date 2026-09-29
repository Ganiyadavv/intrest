import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../types/navigation';
import { AppInput } from '../components/AppInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { authService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

interface Props {
  navigation: ResetPasswordScreenNavigationProp;
  route: ResetPasswordScreenRouteProp;
}

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown > 0) {
      const timerId = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [cooldown]);

  const validatePassword = (pass: string) => {
    // Minimum 8 characters, at least one uppercase letter, one lowercase letter and one number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    return regex.test(pass);
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccessMsg('');

    if (!otp) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    if (!validatePassword(newPassword)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      setSuccessMsg('Password reset successfully. Please login with your new password.');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.statusCode === 429) {
        setError('Too many invalid OTP attempts. Please request a new OTP.');
      } else if (err.message && err.message.toLowerCase().includes('expired')) {
        setError('OTP has expired');
      } else if (err.message && err.message.toLowerCase().includes('invalid')) {
        setError('Invalid OTP');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    
    setError('');
    setSuccessMsg('');
    setResending(true);
    try {
      await authService.resendResetOtp(email);
      setCooldown(60);
      // Optional: you can show a success toast here if you have a component, 
      // but just resetting the timer gives enough feedback.
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the server. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // Partially mask email for display
  const maskedEmail = email.replace(/(^.{1})(.*)(@.*$)/, (match, p1, p2, p3) => {
    return p1 + '*'.repeat(p2.length) + p3;
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.topDarkSection}>
            <View style={styles.headerContainer}>
              <View style={styles.logoWrapperNeu}>
                <Ionicons name="refresh" size={32} color="#4D8BFF" />
              </View>
              <Text style={styles.titleNeu}>Reset Password</Text>
              <Text style={styles.subtitleNeu}>OTP sent to: {maskedEmail}</Text>
            </View>
          </View>

          <View style={styles.waveConnectorDark}>
             <View style={styles.waveConnectorLightCutout} />
          </View>

          <View style={styles.bottomLightSection}>
            <View style={styles.content}>
              
              <ErrorMessage message={error} />
              {!!successMsg && (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{successMsg}</Text>
                  <TouchableOpacity style={styles.goToLoginBtn} onPress={handleGoToLogin}>
                    <Text style={styles.goToLoginBtnText}>Go to Login</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!successMsg && (
                <View style={styles.cardNeu}>
                  <AppInput
                    label="6-digit OTP"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <AppInput
                    label="New Password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />

                  <AppInput
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />

                  <TouchableOpacity 
                    style={styles.actionBtnNeuPrimary} 
                    onPress={handleResetPassword} 
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{marginRight: 8}}/>
                    <Text style={styles.actionBtnTextNeuPrimary}>
                      {loading ? "Resetting Password..." : "Reset Password"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.resendBtn, (cooldown > 0 || resending) && styles.resendBtnDisabled]} 
                    onPress={handleResendOtp}
                    disabled={cooldown > 0 || resending}
                  >
                    <Text style={[styles.resendText, (cooldown > 0 || resending) && styles.resendTextDisabled]}>
                      {resending ? "Resending..." : cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {!successMsg && (
                <View style={styles.footerContainer}>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                    <Text style={styles.registerTextNeu}>Back to Login</Text>
                  </TouchableOpacity>
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
  scrollView: {
    flex: 1,
    backgroundColor: '#E9EFF5',
  },
  topDarkSection: {
    backgroundColor: '#1A1B2F',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomRightRadius: 80,
    zIndex: 10,
    alignItems: 'center',
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
    marginTop: -1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 60,
  },
  headerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logoWrapperNeu: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(77, 139, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(77, 139, 255, 0.3)',
  },
  titleNeu: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitleNeu: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  cardNeu: {
    backgroundColor: '#E9EFF5',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  actionBtnNeuPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4D8BFF',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#4D8BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 16,
  },
  actionBtnTextNeuPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resendBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendBtnDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: '#4D8BFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: '#95A5A6',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerTextNeu: {
    color: '#6B7A93',
    fontSize: 15,
    fontWeight: '800',
  },
  successContainer: {
    backgroundColor: '#E9EFF5',
    borderRadius: 24,
    padding: 30,
    marginBottom: 24,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FFF',
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    color: '#2ECC71',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  goToLoginBtn: {
    backgroundColor: '#4D8BFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  goToLoginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  }
});
