export interface User {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phoneNumber: string;
  role: "MEMBER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  profileImage: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  createdAt?: string;
  updatedAt?: string;
}
