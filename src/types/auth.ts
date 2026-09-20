export type UserRole = 'USER' | 'ADMIN';

export type UserType = 
  | 'STUDENT'
  | 'FIRST_TIME_EARNER'
  | 'YOUNG_WORKING_PROFESSIONAL'
  | 'BEGINNER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  userType: UserType;
  preferredLanguage: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}
