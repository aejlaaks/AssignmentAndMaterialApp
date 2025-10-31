export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  token: string;
  profileImage?: string;
  stats?: UserStats;
  phoneNumber?: string;
  bio?: string;
  isActive?: boolean;
}

export enum UserRole {
  Student = 'Student',
  Teacher = 'Teacher',
  Admin = 'Admin',
}

export interface UserStats {
  coursesEnrolled: number;
  assignmentsCompleted: number;
  averageGrade: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
} 