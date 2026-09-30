export interface LenderRecord {
  id: string; // backend uses id or _id, we map it properly in the service or just use id. Based on PersonRecord let's just use id or _id
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
  receivedDate: string;
  paymentScreenshot?: string;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}
