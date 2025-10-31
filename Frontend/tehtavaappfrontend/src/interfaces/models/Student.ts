/**
 * Student interface representing student data in the application
 */
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId?: string;
  studentNumber?: string;
  enrollmentDate?: string | Date;
  isActive?: boolean;
  avatarUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
} 