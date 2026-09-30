import api from './api';
import { Notification } from '../types/notification';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.data || [];
  },

  getNotificationDetails: async (notificationId: string): Promise<any> => {
    const response = await api.get(`/notifications/${notificationId}`);
    return response.data?.data || response.data;
  },

  markNotificationAsRead: async (id: number | string): Promise<any> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  deleteNotification: async (notificationId: string): Promise<any> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};
