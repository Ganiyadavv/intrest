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
      // In reality, if it's multipart/form-data for image, it needs to be handled differently, 
      // but we will keep it as JSON for now or use FormData as requested.
      // If we use FormData in mobile:
      // const formData = new FormData();
      // ... append data
      
      const response = await api.put('/users/profile', profileData);
      return response.data.data.user || response.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to update profile' };
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
  }
};
