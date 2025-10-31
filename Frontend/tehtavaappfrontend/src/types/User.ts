/**
 * User entity interface
 */
export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  role?: 'student' | 'teacher' | 'admin';
  token?: string;
  createdAt?: string;
  updatedAt?: string;
} 