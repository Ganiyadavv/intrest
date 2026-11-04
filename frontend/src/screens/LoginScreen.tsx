import React, { useState } from 'react';
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
import { authService } from '../services/authService';
import { isValidEmail } from '../utils/validation';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
  route: any;
}

export const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const sessionMessage = route.params?.message;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(sessionMessage || '');

  const handleLogin = async () => {
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Valid email format is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.loginUser({ email, password });
      const user = response.data?.user || (response as any).user;

      if (user && user.role === 'ADMIN') {
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: 'Admin' }],
        });
      } else {
        // Navigate to Dashboard and prevent going back to login
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top navigation / Back to Public Dashboard */}
          <View style={styles.topNavRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('PublicHome')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* BRAND HEADER: DhanaMitra */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <View style={styles.leafIconContainer}>
                <Ionicons name="leaf" size={12} color="#056B38" />
              </View>
            </View>
            <View style={styles.brandTextGroup}>
              <Text style={styles.brandTitle}>DhanaMitra</Text>
            </View>
          </View>

          {/* WELCOME BACK TITLE */}
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeTitleRow}>
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.wavingEmoji}> 👋</Text>
            </View>
            <Text style={styles.welcomeSubtitle}>Sign in to continue</Text>
          </View>

          {/* ERROR MESSAGE IF ANY */}
          {error ? <ErrorMessage message={error} /> : null}

          {/* INPUT FORM */}
          <View style={styles.formContainer}>
            {/* Email Field (Replaced Phone Number with Email as requested) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Email</Text>
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

            {/* Password Field with "Forgot?" on top right */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  isPasswordFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, { outlineStyle: 'none' } as any]}
                  placeholder="Enter your password"
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

            {/* Primary Action Button: "Sign In" */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.signInBtnText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Footer: "Don't have an account? Sign Up" */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.7}
              >
                <Text style={styles.signUpText}>Sign Up</Text>
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
    paddingTop: 12,
    paddingBottom: 36,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  topNavRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.8,
    borderColor: '#056B38',
    backgroundColor: '#F4FAF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  rupeeSymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: '#056B38',
  },
  leafIconContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F472B',
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#008744',
    marginTop: 1,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  wavingEmoji: {
    fontSize: 24,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#056B38',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
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
  signInBtn: {
    backgroundColor: '#056B38',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#056B38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signInBtnDisabled: {
    opacity: 0.7,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#056B38',
  },
});
