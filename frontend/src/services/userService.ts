import api from './api';
import { User } from '../types/user';

export const userService = {
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get('/users/profile');
      return response.data.data.user || response.data.data; 
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  updateProfile: async (profileData: any): Promise<User> => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data.data.user || response.data.data;
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : null) ||
        error.message ||
        'Failed to update profile';
      throw { message: msg };
    }
  },

  searchUserByUserId: async (userId: string): Promise<User> => {
    try {
      const response = await api.get(`/users/search?userId=${userId}`);
      return response.data.data.user || response.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Something went wrong. Please try again.' };
    }
  },

  searchUsersByName: async (name: string): Promise<User[]> => {
    try {
      const response = await api.get(`/users/search?name=${name}`);
      return response.data.data.users || response.data.data || [];
    } catch (error: any) {
      throw error.response?.data || { message: 'Something went wrong. Please try again.' };
    }
  },

  searchUserById: async (id: number | string): Promise<User | null> => {
    try {
      const response = await api.get(`/users/search?id=${id}`);
      return response.data.data.user || response.data.data || null;
    } catch {
      return null;
    }
  },
};
