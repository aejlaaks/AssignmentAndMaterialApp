import { FeedbackAttachment } from '../feedbackService';

// Base submission entity type
export interface Submission {
  id: string;
  assignmentId: string;
  assignmentName?: string;
  courseId?: string;
  courseName?: string;
  studentId: string;
  studentName?: string;
  submissionText: string;
  status: SubmissionStatus;
  submittedAt: string;
  gradedAt?: string;
  grade?: number;
  feedbackText?: string;
  isRichTextFeedback?: boolean;
  gradedById?: string;
  gradedByName?: string;
  attemptNumber: number;
  requiresRevision: boolean;
  isLate: boolean;
  feedbackAttachments?: FeedbackAttachment[];
  submittedMaterials?: SubmittedMaterial[];
}

// Submission status enum (matching backend values)
export type SubmissionStatus = 
  'draft' | 
  'submitted' | 
  'graded' | 
  'returned';

// Material attached to a submission
export interface SubmittedMaterial {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

// Request types

// For creating a new submission
export interface SubmissionCreateRequest {
  dto: {
    Id: string;
    AssignmentId: string;
    StudentId: string;
    SubmissionText: string;
    Status: string;
  }
}

// For updating an existing submission
export interface SubmissionUpdateRequest {
  id: string;
  content?: string;
  status?: SubmissionStatus;
}

// For grading a submission
export interface GradeSubmissionRequest {
  grade: number;
  feedback: string;
  isRichTextFeedback: boolean;
  requiresRevision?: boolean;
  revisionDueDate?: string;
  notes?: string;
  attachments?: FeedbackAttachment[];
}

// For returning a submission to student
export interface ReturnSubmissionRequest {
  feedback: string;
  isRichTextFeedback: boolean;
  requiresRevision: boolean;
  revisionDueDate?: string;
  attachments?: FeedbackAttachment[];
}

// For filtering submissions in queries
export interface SubmissionFilter {
  courseId?: string;
  assignmentId?: string;
  studentId?: string;
  status?: string;
  isGraded?: boolean;
  requiresRevision?: boolean;
  submittedAfter?: string;
  submittedBefore?: string;
}

// For file upload tracking
export interface FileUploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

// API response for file uploads
export interface FileUploadResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

// For internal use - passing around submission data
export interface SubmissionData {
  assignmentId: string;
  content: string;
  files?: File[];
} 