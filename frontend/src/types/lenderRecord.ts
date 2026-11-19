export interface LenderRecordRepayment {
  id: number | string;
  lenderRecordId: number | string;
  amount: number | string;
  returnDate: string;
  notes?: string | null;
  paymentScreenshot?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LenderRecord {
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
  receivedDate: string;
  paymentScreenshot?: string;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  repayments?: LenderRecordRepayment[];
  totalReturned?: number;
  createdAt: string;
  updatedAt: string;
}
