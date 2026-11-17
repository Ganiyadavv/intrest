export type PersonalRelationship = 'Friend' | 'Family' | 'Relative' | 'Other';
export type PersonalRecordType = 'INTEREST_FREE' | 'GIFT';
export type PersonalRecordStatus = 'PENDING' | 'PARTIALLY_RETURNED' | 'FULLY_RETURNED' | 'GIFT';

export interface PersonalRecordRepayment {
  id: number | string;
  personalRecordId: number | string;
  amount: number | string;
  returnDate: string;
  notes?: string | null;
  paymentScreenshot?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonalRecord {
  id: number | string;
  ownerId: number | string;
  name: string;
  relationship: PersonalRelationship | string;
  phoneNumber?: string | null;
  recordType: PersonalRecordType;
  amount: number | string;
  givenDate: string;
  expectedReturnDate?: string | null;
  notes?: string | null;
  paymentScreenshot?: string | null;
  totalReturned: number | string;
  remainingAmount: number | string;
  status: PersonalRecordStatus;
  repayments?: PersonalRecordRepayment[];
  createdAt?: string;
  updatedAt?: string;
}
