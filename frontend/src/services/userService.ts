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
      let msg = 'Failed to update profile';
      if (error.response?.status === 413) {
        msg = 'The selected image is too large. Please select a smaller photo.';
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        if (error.response.data.includes('Payload Too Large') || error.response.data.includes('413')) {
          msg = 'The selected image is too large. Please select a smaller photo.';
        } else {
          // Clean HTML tags if a proxy or server error page was returned
          const cleanText = error.response.data.replace(/<[^>]+>/g, '').trim();
          msg = cleanText || 'Failed to update profile';
        }
      } else if (error.message) {
        msg = error.message;
      }
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
