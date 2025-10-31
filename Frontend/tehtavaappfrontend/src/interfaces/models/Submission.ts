import { Student } from './Student';

/**
 * Represents a student's submission for an assignment
 */
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  student?: Student;
  submissionDate: string | Date;
  fileUrl?: string;
  fileName?: string;
  comment?: string;
  grade?: number;
  feedback?: string;
  status: SubmissionStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Possible statuses for a submission
 */
export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  LATE = 'LATE'
} 