export interface StoredPerson {
  id: number;
  name: string;
  fatherName?: string | null;
  phoneNumber: string;

  village?: string | null;
  mandal?: string | null;
  pincode?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;

  amount: number;
  interestRate: number;
  givenDate: string;

  paymentScreenshot?: string | null;
  notes?: string | null;

  status: 'PENDING' | 'COMPLETE';

  createdAt?: string;
  updatedAt?: string;
}
