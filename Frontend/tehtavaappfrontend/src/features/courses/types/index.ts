import { User } from '../../users/types';

export interface Course {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  createdAt?: string;
  updatedAt?: string;
  contentBlocks?: any[];
  studentCount?: number;
  groups?: SchoolGroup[];
}

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
  students?: any[];
  studentEnrollments?: StudentEnrollment[];
  courseId?: string;
  createdAt?: string;
  updatedAt?: string;
  hasCourse?: boolean;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  groupId: string;
  enrollmentDate: string;
  status: string;
  progress: number;
  student?: User;
}

export interface Material {
  id: string;
  title: string;
  content: string;
  courseId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
} 