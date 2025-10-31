/**
 * Central file for assignment-related types
 * These types are used throughout the application to ensure type consistency
 */

/**
 * Base Assignment interface with essential properties
 * All assignments must have these properties
 */
export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  
  // Optional properties
  contentMarkdown?: string;
  createdById?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  points?: number;
  status?: string;
  submissionCount?: number;
}

/**
 * Interface for creating a new assignment
 */
export interface CreateAssignmentRequest {
  title: string;
  description: string;
  dueDate?: string;
  courseId: string;
  points?: number;
  contentMarkdown?: string;
}

/**
 * Interface for updating an existing assignment
 */
export interface UpdateAssignmentRequest {
  id: string;
  title?: string;
  description?: string;
  dueDate?: string;
  courseId?: string;
  status?: string;
  points?: number;
  contentMarkdown?: string;
}

/**
 * Interface for submitting an assignment
 */
export interface SubmitAssignmentRequest {
  assignmentId: string;
  studentId: string;
  file?: File;
  comment?: string;
  content?: string;
}

/**
 * Interface for grading a submission
 */
export interface GradeSubmissionRequest {
  grade: number;
  feedback?: string;
  isRichTextFeedback?: boolean;
}

/**
 * Interface for assignment submission
 */
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
  studentName?: string;
} 