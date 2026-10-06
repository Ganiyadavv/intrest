import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { AppInput } from '../components/AppInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { SuccessMessage } from '../components/SuccessMessage';
import { authService } from '../services/authService';
import { isValidEmail } from '../utils/validation';
import { Ionicons } from '@expo/vector-icons';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    
    if (!firstName) { setError('First Name is required'); return; }
    if (!lastName) { setError('Last Name is required'); return; }
    if (!email || !isValidEmail(email)) { setError('Valid email format is required'); return; }
    if (!phoneNumber) { setError('Phone Number is required'); return; }
    if (!password) { setError('Password is required'); return; }
    if (!confirmPassword) { setError('Confirm Password is required'); return; }
    if (password !== confirmPassword) { setError('Password and Confirm Password must match'); return; }

    setLoading(true);
    try {
      await authService.registerUser({
        firstName,
        lastName,
        email,
        phoneNumber,
        password
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
          {/* TOP DARK SECTION */}
          <View style={styles.topDarkSection}>
            <View style={styles.headerContainer}>
              <View style={styles.logoWrapperNeu}>
                <Ionicons name="person-add" size={32} color="#4D8BFF" />
              </View>
              <Text style={styles.titleNeu}>Create Account</Text>
              <Text style={styles.subtitleNeu}>Register to manage your account</Text>
            </View>
          </View>

          {/* THE WAVE CONNECTOR */}
          <View style={styles.waveConnectorDark}>
             <View style={styles.waveConnectorLightCutout} />
          </View>

          {/* BOTTOM LIGHT SECTION */}
          <View style={styles.bottomLightSection}>
            <View style={styles.content}>
              
              <ErrorMessage message={error} />
              <SuccessMessage message={success} />

              <View style={styles.cardNeu}>
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
                  label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={(text) => setEmail(text.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                <AppInput
                  label="Phone Number"
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
                
                <AppInput
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                
                <AppInput
                  label="Confirm Password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <TouchableOpacity 
                  style={styles.actionBtnNeuPrimary} 
                  onPress={handleRegister} 
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-add" size={20} color="#FFF" style={{marginRight: 8}}/>
                  <Text style={styles.actionBtnTextNeuPrimary}>
                    {loading ? "Creating Account..." : "Register"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footerContainer}>
                <Text style={styles.footerTextNeu}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                  <Text style={styles.loginTextNeu}>Login Here</Text>
                </TouchableOpacity>
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
  scrollView: {
    flex: 1,
    backgroundColor: '#E9EFF5',
  },
  topDarkSection: {
    backgroundColor: '#1A1B2F',
    paddingTop: 80,
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
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerTextNeu: {
    color: '#6B7A93',
    fontSize: 15,
  },
  loginTextNeu: {
    color: '#4D8BFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
