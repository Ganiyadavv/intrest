import { PersonRecord } from './personRecord';

export interface Notification {
  id: string;
  targetUserId: string;
  ownerId: string;
  personRecordId: PersonRecord | string; // Could be populated or just ID
  status: 'UNREAD' | 'READ';
  createdAt: string;
  updatedAt: string;
}
