export interface RequestSender {
  id?: number;
  userId?: string;
  name?: string;
  email?: string;
}

export interface RequestRecipient {
  id?: number;
  userId?: string;
  name?: string;
  email?: string;
}

export interface RequestItem {
  id: number;
  notificationId?: number | string;
  recordType: 'LENDER_RECORD' | 'PERSON_RECORD';
  amount: number;
  interestRate: number;
  interestFrequency?: string;
  name: string;
  phoneNumber?: string;
  fatherName?: string;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  date?: string;
  receivedDate?: string;
  givenDate?: string;
  notes?: string;
  paymentScreenshot?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  sender?: RequestSender;
  recipient?: RequestRecipient;
}

