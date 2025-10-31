import { Course, CourseEnrollment, CourseTeacher } from '../models/Course';
import { User } from '../../types';
import { Block } from '../../types/blocks';
import { Teacher } from '../models/Teacher';

/**
 * Interface for Course Service operations
 * Following Dependency Inversion Principle, high-level modules like components 
 * should depend on this abstraction instead of concrete implementations
 */
export interface ICourseService {
  /**
   * Get all courses
   */
  getCourses(): Promise<Course[]>;
  
  /**
   * Get courses available for enrollment
   */
  getAvailableCourses(): Promise<Course[]>;
  
  /**
   * Get a course by ID
   */
  getCourseById(id: string): Promise<Course | null>;
  
  /**
   * Create a new course
   */
  createCourse(request: CreateCourseRequest): Promise<Course>;
  
  /**
   * Update an existing course
   */
  updateCourse(id: string, request: UpdateCourseRequest): Promise<Course>;
  
  /**
   * Get students enrolled in a course
   */
  getCourseStudents(courseId: string): Promise<User[]>;
  
  /**
   * Clean up a course before deletion (remove related data)
   */
  cleanupCourseForDeletion(id: string): Promise<void>;
  
  /**
   * Delete a course
   */
  deleteCourse(id: string): Promise<boolean>;
  
  /**
   * Get courses the current user is enrolled in
   */
  getEnrolledCourses(): Promise<Course[]>;
  
  /**
   * Get teachers for a course
   */
  getCourseTeachers(courseId: string): Promise<Teacher[]>;
  
  /**
   * Add a teacher to a course
   */
  addTeacherToCourse(courseId: string, request: AddTeacherRequest): Promise<Teacher>;
  
  /**
   * Remove a teacher from a course
   */
  removeTeacherFromCourse(courseId: string, teacherId: string): Promise<boolean>;
}

/**
 * Interface for creating a new course
 */
export interface CreateCourseRequest {
  name: string;
  description: string;
  code?: string;       // Lowercase for frontend consistency
  Code?: string;       // Uppercase for backend model
  contentBlocks?: Block[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  TeacherId?: string;
}

/**
 * Interface for updating an existing course
 */
export interface UpdateCourseRequest {
  name?: string;
  description?: string;
  code?: string;       // Lowercase for frontend consistency
  Code?: string;       // Uppercase for backend model
  contentBlocks?: Block[];
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  TeacherId?: string;
}

export interface AddTeacherRequest {
  teacherId: string;
  role?: string;
} 