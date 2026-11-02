export interface PersonRecord {
  id?: string;
  _id?: string;
  ownerId: string;
  targetUserId?: string;
  name: string;
  fatherName?: string;
  phoneNumber: string;
  village?: string;
  mandal?: string;
  pincode?: string;
  district?: string;
  state?: string;
  country?: string;
  amount: number;
  interestRate: number;
  givenDate: string;
  paymentScreenshot?: string;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}
