export interface AdminStatistics {
  totalMembers: number;
  totalRecords: number;
  pendingRecords: number;
  acceptedRecords: number;
  rejectedRecords: number;
  completedRecords: number;
}

export interface AdminMember {
  id: number | string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  profileImage?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboard {
  statistics: AdminStatistics;
  members: AdminMember[];
}
