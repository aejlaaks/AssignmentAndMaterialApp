export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  content: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  files?: SubmissionFile[];
}

export interface SubmissionFile {
  id: string;
  submissionId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
} 