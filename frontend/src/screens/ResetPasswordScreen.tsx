import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types/navigation';
import { ErrorMessage } from '../components/ErrorMessage';
import { authService } from '../services/authService';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

interface Props {
  navigation: ResetPasswordScreenNavigationProp;
  route: ResetPasswordScreenRouteProp;
}

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, demoOtp } = route.params;

  const [otp, setOtp] = useState(demoOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    return regex.test(pass);
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccessMsg('');

    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    if (!validatePassword(newPassword)) {
      setError(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      setSuccessMsg('Password reset successfully! Please login with your new password.');
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
      const response = await authService.resendResetOtp(email);
      if (response?.data?.demoOtp) {
        setOtp(response.data.demoOtp);
      }
      setSuccessMsg(response?.message || 'A new OTP has been sent successfully.');
      setCooldown(60);
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

  const maskedEmail = email.replace(/(^.{1})(.*)(@.*$)/, (match, p1, p2, p3) => {
    return p1 + '*'.repeat(p2.length) + p3;
  });

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.brandCenter}>
          <View style={styles.brandLogoCircle}>
            <Text style={styles.brandRupeeText}>₹</Text>
            <Ionicons name="leaf" size={10} color="#4ADE80" style={styles.brandLeafIcon} />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitleText}>DhanaMitra</Text>
            <Text style={styles.brandSubtitleText}>Reset Password</Text>
          </View>
        </View>

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
          keyboardShouldPersistTaps="handled"
        >
          {/* 2. ICON & TITLE HEADER */}
          <View style={styles.headerBox}>
            <View style={styles.keyIconCircle}>
              <Ionicons name="lock-closed" size={28} color="#056B38" />
            </View>
            <Text style={styles.titleText}>Reset Password</Text>
            <Text style={styles.subtitleText}>
              We sent a 6-digit OTP code to <Text style={styles.maskedEmailText}>{maskedEmail}</Text>
            </Text>
          </View>

          {/* ERROR ALERT */}
          {error ? <ErrorMessage message={error} /> : null}

          {/* SUCCESS BANNER */}
          {!!successMsg && (
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={40} color="#16A34A" style={{ marginBottom: 12 }} />
              <Text style={styles.successTitle}>Password Updated!</Text>
              <Text style={styles.successText}>{successMsg}</Text>
              <TouchableOpacity
                style={styles.goToLoginBtn}
                onPress={handleGoToLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.goToLoginBtnText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 3. INPUT FORM CARD */}
          {!successMsg && (
            <View style={styles.formCard}>
              {/* OTP Input */}
              <Text style={styles.fieldLabel}>6-Digit OTP *</Text>
              <Pressable
                onPress={() => otpRef.current?.focus()}
                style={[
                  styles.inputWrapper,
                  focusedField === 'otp' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="shield-outline"
                  size={20}
                  color={focusedField === 'otp' ? '#056B38' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={otpRef}
                  style={[
                    styles.input,
                    styles.otpInput,
                  ]}
                  placeholder="123456"
                  placeholderTextColor="#94A3B8"
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                    if (error) setError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  onFocus={() => setFocusedField('otp')}
                  onBlur={() => setFocusedField(null)}
                />
              </Pressable>

              {/* New Password */}
              <Text style={styles.fieldLabel}>New Password *</Text>
              <Pressable
                onPress={() => newPasswordRef.current?.focus()}
                style={[
                  styles.inputWrapper,
                  focusedField === 'newPassword' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedField === 'newPassword' ? '#056B38' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={newPasswordRef}
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#94A3B8"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showNewPassword}
                  onFocus={() => setFocusedField('newPassword')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </Pressable>

              {/* Confirm Password */}
              <Text style={styles.fieldLabel}>Confirm Password *</Text>
              <Pressable
                onPress={() => confirmPasswordRef.current?.focus()}
                style={[
                  styles.inputWrapper,
                  focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedField === 'confirmPassword' ? '#056B38' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={handleResetPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </Pressable>

              {/* RESET BUTTON */}
              <TouchableOpacity
                style={[styles.resetButton, loading && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.resetButtonText}>
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>

              {/* RESEND OTP BUTTON */}
              <TouchableOpacity
                style={[
                  styles.resendBtn,
                  (cooldown > 0 || resending) && styles.resendBtnDisabled,
                ]}
                onPress={handleResendOtp}
                disabled={cooldown > 0 || resending}
              >
                <Text
                  style={[
                    styles.resendText,
                    (cooldown > 0 || resending) && styles.resendTextDisabled,
                  ]}
                >
                  {resending
                    ? 'Resending...'
                    : cooldown > 0
                    ? `Resend OTP in ${cooldown}s`
                    : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 4. BACK TO LOGIN LINK */}
          {!successMsg && (
            <TouchableOpacity
              style={styles.backToLoginBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color="#056B38" style={{ marginRight: 6 }} />
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          )}
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
    top: 2,
    right: 2,
  },
  brandTextCol: {
    alignItems: 'flex-start',
  },
  brandTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSubtitleText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerBox: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  keyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#056B38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  maskedEmailText: {
    color: '#056B38',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  inputWrapperFocused: {
    borderColor: '#056B38',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(5, 107, 56, 0.12)',
      },
    }),
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      } as any,
    }),
  },
  otpInput: {
    letterSpacing: 4,
    fontWeight: '700',
  },
  eyeBtn: {
    padding: 6,
  },
  resetButton: {
    backgroundColor: '#056B38',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#056B38',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  resetButtonDisabled: {
    opacity: 0.65,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  resendBtnDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: '#056B38',
    fontSize: 13,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: '#94A3B8',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  successText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  goToLoginBtn: {
    backgroundColor: '#056B38',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  goToLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#056B38',
  },
});
