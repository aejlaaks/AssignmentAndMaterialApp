import { API_BASE_URL } from '../config';
import { handleApiError } from '../utils/errorHandler';
import { FeedbackAttachment } from './feedbackService';

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentName?: string;
  courseId: string;
  courseName?: string;
  studentId: string;
  studentName: string;
  submissionText: string;
  status: string;
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

export interface SubmittedMaterial {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface GradeSubmissionData {
  grade: number;
  feedback: string;
  isRichTextFeedback: boolean;
  requiresRevision?: boolean;
  revisionDueDate?: string;
  notes?: string;
  attachments?: FeedbackAttachment[];
}

export interface ReturnSubmissionData {
  feedback: string;
  isRichTextFeedback: boolean;
  requiresRevision: boolean;
  revisionDueDate?: string;
  attachments?: FeedbackAttachment[];
}

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

class SubmissionService {
  private baseUrl = `${API_BASE_URL}/submissions`;

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    try {
      const response = await fetch(`${this.baseUrl}/assignment/${assignmentId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error fetching submissions by assignment');
    }
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    try {
      const response = await fetch(`${this.baseUrl}/student/${studentId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error fetching submissions by student');
    }
  }

  async getSubmissionsByCourse(courseId: string): Promise<Submission[]> {
    try {
      const response = await fetch(`${this.baseUrl}/course/${courseId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error fetching submissions by course');
    }
  }

  async getPendingSubmissions(filter?: SubmissionFilter): Promise<Submission[]> {
    try {
      let url = `${this.baseUrl}/pending`;
      
      if (filter) {
        const params = new URLSearchParams();
        
        if (filter.courseId) params.append('courseId', filter.courseId);
        if (filter.assignmentId) params.append('assignmentId', filter.assignmentId);
        if (filter.studentId) params.append('studentId', filter.studentId);
        if (filter.status) params.append('status', filter.status);
        if (filter.isGraded !== undefined) params.append('isGraded', filter.isGraded.toString());
        if (filter.requiresRevision !== undefined) params.append('requiresRevision', filter.requiresRevision.toString());
        if (filter.submittedAfter) params.append('submittedAfter', filter.submittedAfter);
        if (filter.submittedBefore) params.append('submittedBefore', filter.submittedBefore);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error fetching pending submissions');
    }
  }

  async getPendingSubmissionsCount(courseId?: string): Promise<number> {
    try {
      let url = `${this.baseUrl}/pending/count`;
      
      if (courseId) {
        url += `?courseId=${courseId}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.count;
    } catch (error) {
      return handleApiError(error, 'Error fetching pending submissions count');
    }
  }

  async getSubmissionById(id: string): Promise<Submission> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error fetching submission');
    }
  }

  async createSubmission(submission: Partial<Submission>): Promise<Submission> {
    try {
      // The controller only needs SubmissionText - it derives the rest from the URL and user context
      const dto = {
        SubmissionText: submission.submissionText || ""
      };
      
      // The API expects a wrapper with a 'dto' property
      const requestBody = { dto };
      
      console.log('Formatted request body:', JSON.stringify(requestBody));
      
      const response = await fetch(`${API_BASE_URL}/assignment/${submission.assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Error response:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error data:', errorData);
        throw new Error(`HTTP error! Status: ${response.status} - ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating submission:', error);
      return handleApiError(error, 'Error creating submission');
    }
  }

  async updateSubmission(id: string, submission: Partial<Submission>): Promise<Submission> {
    try {
      // Ensure ID is a valid number
      const numericId = parseInt(id, 10);
      
      if (isNaN(numericId)) {
        throw new Error(`Invalid submission ID: ${id}`);
      }
      
      // Format the data for the backend - must match URL path ID
      const dataToSend = {
        Id: numericId, // Must be numeric and match the path parameter
        Content: submission.submissionText || "",
        // Backend validation requires Feedback field to be non-null
        Feedback: submission.feedbackText || "", // Required by backend validation
        Grade: null,
        Status: null
      };
      
      console.log('Updating submission with data:', JSON.stringify(dataToSend));
      
      const response = await fetch(`${API_BASE_URL}/assignment/submissions/${numericId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Error response:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error data:', errorData);
        throw new Error(`HTTP error! Status: ${response.status} - ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in updateSubmission:', error);
      return handleApiError(error, 'Error updating submission');
    }
  }

  async gradeSubmission(id: string, gradeData: GradeSubmissionData): Promise<Submission> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gradeData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error grading submission');
    }
  }

  async returnSubmission(id: string, returnData: ReturnSubmissionData): Promise<Submission> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error returning submission');
    }
  }
}

export const submissionService = new SubmissionService(); 