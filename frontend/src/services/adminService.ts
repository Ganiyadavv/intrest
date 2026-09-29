import api from './api';
import { AdminDashboard, AdminMember } from '../types/admin';

export const adminService = {
  getAdminDashboard: async (): Promise<AdminDashboard> => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch dashboard' };
    }
  },

  getMembers: async (search?: string): Promise<AdminMember[]> => {
    try {
      const url = search ? `/admin/members?search=${encodeURIComponent(search)}` : '/admin/members';
      const response = await api.get(url);
      return response.data.data.members || response.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch members' };
    }
  },

  getMemberById: async (id: string | number): Promise<AdminMember> => {
    try {
      const response = await api.get(`/admin/members/${id}`);
      return response.data.data.member || response.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch member details' };
    }
  },

  updateMemberStatus: async (id: string | number, status: string): Promise<any> => {
    try {
      const response = await api.put(`/admin/members/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to update member status' };
    }
  }
};
