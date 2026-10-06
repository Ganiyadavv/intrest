import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { AppInput } from '../components/AppInput';
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
      const user = response.data?.user || response.user;
      
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
          {/* TOP DARK SECTION */}
          <View style={styles.topDarkSection}>
            <View style={styles.headerContainer}>
              <View style={styles.logoWrapperNeu}>
                <Ionicons name="lock-closed" size={32} color="#4D8BFF" />
              </View>
              <Text style={styles.titleNeu}>Welcome Back</Text>
              <Text style={styles.subtitleNeu}>Sign in to your account</Text>
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

              <View style={styles.cardNeu}>
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
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity 
                  style={{ marginTop: -4, marginBottom: 8, alignSelf: 'flex-end' }} 
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={{ color: '#4D8BFF', fontSize: 14, fontWeight: '600' }}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionBtnNeuPrimary} 
                  onPress={handleLogin} 
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in" size={20} color="#FFF" style={{marginRight: 8}}/>
                  <Text style={styles.actionBtnTextNeuPrimary}>
                    {loading ? "Authenticating..." : "Login"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footerContainer}>
                <Text style={styles.footerTextNeu}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                  <Text style={styles.registerTextNeu}>Register Now</Text>
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
  registerTextNeu: {
    color: '#4D8BFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
