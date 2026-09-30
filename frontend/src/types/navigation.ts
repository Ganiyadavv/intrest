import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminMembers: undefined;
  AdminMemberDetails: { id: string | number };
};

export type MainStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Payments: undefined;
  InterestCalculator: {
    principal?: string;
    rate?: string;
    years?: string;
    months?: string;
    days?: string;
    givenDate?: string;
  } | undefined;
  RateCalculator: undefined;
  SearchUser: undefined;
  PersonRecords: undefined;
  AddPerson: undefined;
  EditPerson: { id: string };
  PersonDetails: { id: string };
  LenderRecords: undefined;
  AddLenderRecord: undefined;
  EditLenderRecord: { id: string };
  LenderRecordDetails: { id: string };
  Notifications: undefined;
  NotificationDetails: { id: string };
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
};
