import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types/navigation';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminMembersScreen } from '../screens/AdminMembersScreen';
import { AdminMemberDetailsScreen } from '../screens/AdminMemberDetailsScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminMembers" component={AdminMembersScreen} />
      <Stack.Screen name="AdminMemberDetails" component={AdminMemberDetailsScreen} />
    </Stack.Navigator>
  );
};
