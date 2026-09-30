import api from './api';
import { LenderRecord } from '../types/lenderRecord';

export const lenderRecordService = {
  createLenderRecord: async (data: FormData): Promise<LenderRecord> => {
    const response = await api.post('/lender-records', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getLenderRecords: async (): Promise<LenderRecord[]> => {
    const response = await api.get('/lender-records');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.data || [];
  },

  getLenderRecordById: async (id: string): Promise<LenderRecord> => {
    const response = await api.get(`/lender-records/${id}`);
    return response.data?.data ? response.data.data : response.data;
  },

  updateLenderRecord: async (id: string, data: FormData): Promise<LenderRecord> => {
    const response = await api.put(`/lender-records/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteLenderRecord: async (id: string): Promise<void> => {
    await api.delete(`/lender-records/${id}`);
  },

  completeLenderRecord: async (id: string): Promise<LenderRecord> => {
    const response = await api.put(`/lender-records/${id}/complete`);
    return response.data;
  },

  acceptLenderRecord: async (id: string): Promise<LenderRecord> => {
    const response = await api.put(`/lender-records/${id}/accept`);
    return response.data;
  },

  rejectLenderRecord: async (id: string): Promise<LenderRecord> => {
    const response = await api.put(`/lender-records/${id}/reject`);
    return response.data;
  },
};
