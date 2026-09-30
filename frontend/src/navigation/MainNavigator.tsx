import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types/navigation';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { InterestCalculatorScreen } from '../screens/InterestCalculatorScreen';
import { RateCalculatorScreen } from '../screens/RateCalculatorScreen';
import { SearchUserScreen } from '../screens/SearchUserScreen';
import { PersonRecordsScreen } from '../screens/PersonRecordsScreen';
import { AddPersonScreen } from '../screens/AddPersonScreen';
import { EditPersonScreen } from '../screens/EditPersonScreen';
import { PersonDetailsScreen } from '../screens/PersonDetailsScreen';
import { LenderRecordsScreen } from '../screens/LenderRecordsScreen';
import { AddLenderRecordScreen } from '../screens/AddLenderRecordScreen';
import { LenderRecordDetailsScreen } from '../screens/LenderRecordDetailsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { NotificationDetailsScreen } from '../screens/NotificationDetailsScreen';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.PRIMARY },
        headerTintColor: COLORS.SURFACE,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: COLORS.BACKGROUND },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Payments" 
        component={PaymentsScreen} 
        options={{ title: 'Payments' }} 
      />
      <Stack.Screen 
        name="InterestCalculator" 
        component={InterestCalculatorScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="RateCalculator" 
        component={RateCalculatorScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="SearchUser" 
        component={SearchUserScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen name="PersonRecords" component={PersonRecordsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditPerson" component={EditPersonScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PersonDetails" component={PersonDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LenderRecords" component={LenderRecordsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddLenderRecord" component={AddLenderRecordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LenderRecordDetails" component={LenderRecordDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NotificationDetails" component={NotificationDetailsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
