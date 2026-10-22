import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { PublicHomeScreen } from '../screens/PublicHomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { InterestCalculatorScreen } from '../screens/InterestCalculatorScreen';
import { CompoundInterestScreen } from '../screens/CompoundInterestScreen';
import { RateCalculatorScreen } from '../screens/RateCalculatorScreen';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="PublicHome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.BACKGROUND },
      }}
    >
      <Stack.Screen name="PublicHome" component={PublicHomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="InterestCalculator" component={InterestCalculatorScreen} />
      <Stack.Screen name="CompoundInterest" component={CompoundInterestScreen} />
      <Stack.Screen name="RateCalculator" component={RateCalculatorScreen} />
    </Stack.Navigator>
  );
};
