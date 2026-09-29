import api from './api';
import { PersonRecord } from '../types/personRecord';

export const personRecordService = {
  createPersonRecord: async (data: FormData): Promise<PersonRecord> => {
    const response = await api.post('/person-records', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPersonRecords: async (): Promise<PersonRecord[]> => {
    const response = await api.get('/person-records');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.data || [];
  },

  getPersonRecordById: async (id: string): Promise<PersonRecord> => {
    const response = await api.get(`/person-records/${id}`);
    return response.data?.data ? response.data.data : response.data;
  },

  updatePersonRecord: async (id: string, data: FormData): Promise<PersonRecord> => {
    const response = await api.put(`/person-records/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deletePersonRecord: async (id: string): Promise<void> => {
    await api.delete(`/person-records/${id}`);
  },

  completePersonRecord: async (id: string): Promise<PersonRecord> => {
    const response = await api.put(`/person-records/${id}/complete`);
    return response.data;
  },

  acceptPersonRecord: async (id: string): Promise<PersonRecord> => {
    const response = await api.put(`/person-records/${id}/accept`);
    return response.data;
  },

  rejectPersonRecord: async (id: string): Promise<PersonRecord> => {
    const response = await api.put(`/person-records/${id}/reject`);
    return response.data;
  },
};
