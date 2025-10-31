import { Assignment, CreateAssignmentRequest, UpdateAssignmentRequest, Submission } from '../../types/assignments';

/**
 * Interface for Assignment Service operations
 * Following Dependency Inversion Principle, high-level modules like components 
 * should depend on this abstraction instead of concrete implementations
 */
export interface IAssignmentService {
  /**
   * Get all assignments
   */
  getAssignments(): Promise<Assignment[]>;
  
  /**
   * Get an assignment by ID
   */
  getAssignmentById(id: string): Promise<Assignment | null>;
  
  /**
   * Get all assignments for a course
   */
  getAssignmentsByCourse(courseId: string): Promise<Assignment[]>;
  
  /**
   * Create a new assignment
   */
  createAssignment(assignmentData: CreateAssignmentRequest): Promise<Assignment>;
  
  /**
   * Update an existing assignment
   */
  updateAssignment(assignmentData: UpdateAssignmentRequest): Promise<Assignment>;
  
  /**
   * Delete an assignment
   */
  deleteAssignment(id: string): Promise<void>;
  
  /**
   * Add an existing assignment to a course
   */
  addAssignmentToCourse(assignmentId: string, courseId: string): Promise<Assignment>;
  
  /**
   * Get all assignments for a student
   */
  getStudentAssignments(studentId: string): Promise<Assignment[]>;
  
  /**
   * Get submissions for an assignment
   */
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  
  /**
   * Submit an assignment
   */
  submitAssignment(request: { assignmentId: string; studentId: string; file?: File; comment?: string }): Promise<Submission>;
  
  /**
   * Grade a submission
   */
  gradeSubmission(submissionId: string, request: { grade: number; feedback?: string }): Promise<Submission>;
  
  /**
   * Get all grades for a student in a specific course
   */
  getStudentGrades(studentId: string, courseId: string): Promise<any[]>;
} 