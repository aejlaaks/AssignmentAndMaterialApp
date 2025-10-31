/**
 * Represents a teacher in the system
 */
export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Represents a teacher's enrollment in a course
 */
export interface CourseTeacherEnrollment {
  id: string;
  teacherId: string;
  courseId: string;
  enrollmentDate: string | Date;
  role?: string;
  status?: string;
} 