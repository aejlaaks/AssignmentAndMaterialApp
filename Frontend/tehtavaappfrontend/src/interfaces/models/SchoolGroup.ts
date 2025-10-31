import { Student } from '../models/Student';

/**
 * Enhanced SchoolGroup interface with all required properties
 * This contains a superset of all group properties used in the application
 */
export interface SchoolGroup {
  id: string;
  name: string;
  description?: string;
  createdById?: string;
  createdByName?: string;
  isActive?: boolean;
  memberCount?: number;
  studentCount?: number;
  courseCount?: number;
  courseId?: string;
  students?: Student[];
  studentEnrollments?: StudentGroupEnrollment[];
  hasCourse?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

/**
 * Interface for group enrollment
 */
export interface StudentGroupEnrollment {
  id: string;
  groupId: string;
  studentId: string;
  enrollmentDate: string | Date;
  status: string;
  progress: number;
  student?: Student;
  group?: SchoolGroup;
} 