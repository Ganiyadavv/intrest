import { User } from './user';

export interface AuthResponse {
  statusCode: number;
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiError {
  statusCode?: number;
  status?: string;
  message: string;
}
