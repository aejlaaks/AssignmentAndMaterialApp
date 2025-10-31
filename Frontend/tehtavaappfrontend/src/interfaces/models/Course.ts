import { SchoolGroup } from './SchoolGroup';
import { Block } from '../../types/blocks';

/**
 * Enhanced Course interface with all required properties
 * This contains a superset of all course properties used in the application
 */
export interface Course {
  id: string;
  name: string;
  description: string;
  code?: string;
  teacherId: string;
  teacherName?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  contentBlocks?: Block[];
  studentCount?: number;
  materialCount?: number;
  assignmentCount?: number;
  groups?: SchoolGroup[];
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
}

/**
 * Interface for course enrollment
 */
export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  enrollmentDate: string | Date;
  status: string;
  completionDate?: string | Date;
  progress?: number;
}

/**
 * Interface for course teacher
 */
export interface CourseTeacher {
  id: string;
  courseId: string;
  teacherId: string;
  teacherName?: string;
  email?: string;
  isMainTeacher?: boolean;
  assignedDate?: string | Date;
} 