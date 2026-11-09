import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { ErrorMessage } from '../components/ErrorMessage';
import { SuccessMessage } from '../components/SuccessMessage';
import { authService } from '../services/authService';
import { warmUpBackend } from '../services/api';
import { isValidEmail } from '../utils/validation';
import { Ionicons } from '@expo/vector-icons';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [takingLonger, setTakingLonger] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    warmUpBackend();
  }, []);

  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setTimeout(() => {
        setTakingLonger(true);
      }, 3500);
    } else {
      setTakingLonger(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleRegister = async () => {
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
    if (!password) {
      setError('Password is required');
      return;
    }
    if (!confirmPassword) {
      setError('Confirm Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and Confirm Password must match');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms & Conditions');
      return;
    }

    setLoading(true);
    try {
      await authService.registerUser({
        fullName,
        email,
        password,
      });

      setSuccess('Registration successful');

      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Back Navigation Button (Fixed at the top) */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Title Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Let's get you started</Text>
          </View>

          {/* Feedback Messages */}
          {error ? <ErrorMessage message={error} /> : null}
          {success ? <SuccessMessage message={success} /> : null}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isNameFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, { outlineStyle: 'none' } as any]}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isEmailFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, { outlineStyle: 'none' } as any]}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(text) => setEmail(text.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isPasswordFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, { outlineStyle: 'none' } as any]}
                  placeholder="Create a password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isConfirmPasswordFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, { outlineStyle: 'none' } as any]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onFocus={() => setIsConfirmPasswordFocused(true)}
                  onBlur={() => setIsConfirmPasswordFocused(false)}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkboxBox, agreed && styles.checkboxBoxChecked]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the{' '}
                <Text style={styles.termsHighlight}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpBtn, loading && styles.signUpBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.signUpBtnText}>
                {loading
                  ? takingLonger
                    ? 'Connecting to Server...'
                    : 'Creating Account...'
                  : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            {takingLonger && (
              <Text style={styles.takingLongerHint}>
                Waking up cloud server, please wait a moment...
              </Text>
            )}

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  topNavRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    maxWidth: 420,
    alignSelf: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
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
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1E293B',
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxBoxChecked: {
    backgroundColor: '#056B38',
    borderColor: '#056B38',
  },
  checkboxText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  termsHighlight: {
    color: '#056B38',
    fontWeight: '700',
  },
  signUpBtn: {
    backgroundColor: '#056B38',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#056B38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpBtnDisabled: {
    opacity: 0.7,
  },
  signUpBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  takingLongerHint: {
    textAlign: 'center',
    color: '#056B38',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#056B38',
  },
});
