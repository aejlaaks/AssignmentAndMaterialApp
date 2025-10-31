import { SchoolGroup, StudentGroupEnrollment } from '../models/SchoolGroup';
import { ISchoolGroup, IStudent, IStudentGroupEnrollment } from '../../services/courses/groupService';

/**
 * Assignment statistics for a student
 */
export interface AssignmentStats {
  studentId: string;
  courseId: string;
  totalAssignments: number;
  submittedAssignments: number;
  submissionRate: number;
}

/**
 * Student with assignment statistics
 */
export interface IStudentWithStats extends IStudent {
  assignmentStats?: AssignmentStats;
  enrolledToCourse?: boolean;
}

/**
 * Interface for Group Service operations
 * Following Dependency Inversion Principle, high-level modules like components 
 * should depend on this abstraction instead of concrete implementations
 */
export interface IGroupService {
  /**
   * Get all groups
   */
  getGroups(): Promise<ISchoolGroup[]>;
  
  /**
   * Get groups for a specific course
   */
  getGroupsByCourse(courseId: string): Promise<ISchoolGroup[]>;
  
  /**
   * Get student IDs for a course
   */
  getCourseStudentIds(courseId: number): Promise<string[]>;
  
  /**
   * Create a new group
   */
  createGroup(groupData: { name: string; description: string; courseId?: string }): Promise<ISchoolGroup>;
  
  /**
   * Update a group
   */
  updateGroup(id: string, groupData: { name: string; description: string }): Promise<ISchoolGroup>;
  
  /**
   * Delete a group
   */
  deleteGroup(groupId: string): Promise<boolean>;
  
  /**
   * Get students for a group
   */
  getGroupWithStudents(groupId: string): Promise<ISchoolGroup>;
  
  /**
   * Get available students for a group
   */
  getAvailableStudents(groupId: string): Promise<IStudent[]>;
  
  /**
   * Add a student to a group
   */
  addStudentToGroup(groupId: string, studentId: string): Promise<boolean>;
  
  /**
   * Remove a student from a group
   */
  removeStudentFromGroup(groupId: string, studentId: string): Promise<boolean>;
  
  /**
   * Add a course to a group
   */
  addCourseToGroup(groupId: string, courseId: string): Promise<any>;
  
  /**
   * Remove a course from a group
   */
  removeCourseFromGroup(groupId: string, courseId: string): Promise<{ success: boolean, error?: string }>;
  
  /**
   * Get all enrollments for a group
   */
  getGroupEnrollments(groupId: string): Promise<IStudentGroupEnrollment[]>;
  
  /**
   * Get assignment statistics for a student in a course
   */
  getStudentAssignmentStats(studentId: string, courseId: string): Promise<AssignmentStats | null>;
}

/**
 * Interface for creating a new group
 */
export interface CreateGroupRequest {
  name: string;
  description: string;
  memberIds?: string[];
  courseIds?: string[];
  metadata?: Record<string, string>;
}

/**
 * Interface for updating an existing group
 */
export interface UpdateGroupRequest {
  name: string;
  description: string;
}

/**
 * Response interface for adding a course to a group
 */
export interface AddCourseToGroupResponse {
  success: boolean;
  enrolledStudents?: any[];
  error?: string;
} 