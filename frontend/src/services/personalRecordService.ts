import api from './api';
import { PersonalRecord, PersonalRecordRepayment } from '../types/personalRecord';

export const personalRecordService = {
  createPersonalRecord: async (data: FormData): Promise<PersonalRecord> => {
    const response = await api.post('/personal-records', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data ? response.data.data : response.data;
  },

  getPersonalRecords: async (): Promise<PersonalRecord[]> => {
    const response = await api.get('/personal-records');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.data || [];
  },

  getPersonalRecordById: async (id: string | number): Promise<PersonalRecord> => {
    const response = await api.get(`/personal-records/${id}`);
    return response.data?.data ? response.data.data : response.data;
  },

  updatePersonalRecord: async (id: string | number, data: FormData): Promise<PersonalRecord> => {
    const response = await api.put(`/personal-records/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data ? response.data.data : response.data;
  },

  deletePersonalRecord: async (id: string | number): Promise<void> => {
    await api.delete(`/personal-records/${id}`);
  },

  addRepayment: async (id: string | number, data: FormData): Promise<{ repayment: PersonalRecordRepayment; record: PersonalRecord }> => {
    const response = await api.post(`/personal-records/${id}/repayments`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data ? response.data.data : response.data;
  },

  deleteRepayment: async (id: string | number, repaymentId: string | number): Promise<PersonalRecord> => {
    const response = await api.delete(`/personal-records/${id}/repayments/${repaymentId}`);
    return response.data?.data ? response.data.data : response.data;
  },
};
