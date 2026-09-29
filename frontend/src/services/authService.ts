import api from './api';
import { AuthResponse } from '../types/auth';
import { saveToken, saveUser, clearStorage, getToken } from '../storage/storage';

export const authService = {
  registerUser: async (userData: any): Promise<any> => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  loginUser: async (credentials: any): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { token, user } = response.data.data;
      
      // Save token and user details on successful login
      await saveToken(token);
      await saveUser(user);
      
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error. Please try again.' };
    }
  },

  logoutUser: async (): Promise<void> => {
    await clearStorage();
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await getToken();
    return !!token;
  },

  changePassword: async (data: any): Promise<any> => {
    try {
      const response = await api.post('/auth/change-password', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error. Please try again.' };
    }
  },

  forgotPassword: async (email: string): Promise<any> => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error. Please try again.' };
    }
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<any> => {
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error. Please try again.' };
    }
  },

  resendResetOtp: async (email: string): Promise<any> => {
    try {
      const response = await api.post('/auth/resend-reset-otp', { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error. Please try again.' };
    }
  }
};
