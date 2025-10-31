import { 
  Submission, 
  SubmissionCreateRequest, 
  SubmissionUpdateRequest,
  GradeSubmissionRequest,
  ReturnSubmissionRequest,
  SubmissionFilter,
  SubmissionData,
  FileUploadResponse
} from './submissionTypes';
import { formatSubmissionRequest, getSubmissionErrorMessage } from './submissionUtils';
import { API_BASE_URL } from '../../config';
import { authService } from '../auth/authService';

class SubmissionService {
  private baseUrl = `${API_BASE_URL}/submissions`;
  private assignmentUrl = `${API_BASE_URL}/assignment`;

  /**
   * Creates a new submission for an assignment
   */
  async createSubmission(data: SubmissionData): Promise<Submission> {
    try {
      // Format the request data with all required fields
      const requestData = formatSubmissionRequest(data.content, data.assignmentId);
      
      // Log the request for debugging
      console.log('Creating submission with data:', requestData);
      
      // Make the API request
      const response = await fetch(`${this.assignmentUrl}/${data.assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify(requestData),
        credentials: 'include'
      });
      
      // Handle errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Submission error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      // Parse and return the response
      const submission = await response.json();
      console.log('Submission created successfully:', submission);
      
      // Handle file uploads if any
      if (data.files && data.files.length > 0) {
        await this.uploadSubmissionFiles(submission.id, data.files);
      }
      
      return submission;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  /**
   * Gets a submission by ID
   */
  async getSubmission(id: string): Promise<Submission> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeader(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw new Error(getSubmissionErrorMessage(error, 'fetching submission'));
    }
  }

  /**
   * Updates an existing submission
   */
  async updateSubmission(id: string, data: SubmissionUpdateRequest): Promise<Submission> {
    try {
      // Ensure ID is a valid number
      const numericId = parseInt(id, 10);
      
      if (isNaN(numericId)) {
        throw new Error(`Invalid submission ID: ${id}`);
      }
      
      // Format the data for the backend - must match URL path ID
      const requestData = {
        Id: numericId,
        Content: data.content || "",
        Feedback: "", // Required by backend validation
        Grade: null,
        Status: null
      };
      
      console.log('Updating submission with data:', requestData);
      
      const response = await fetch(`${this.assignmentUrl}/submissions/${numericId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify(requestData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating submission:', error);
      throw new Error(getSubmissionErrorMessage(error, 'updating submission'));
    }
  }

  /**
   * Grades a submission
   */
  async gradeSubmission(id: string, gradeData: GradeSubmissionRequest): Promise<Submission> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify(gradeData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error grading submission:', error);
      throw new Error(getSubmissionErrorMessage(error, 'grading submission'));
    }
  }

  /**
   * Returns a submission to the student
   */
  async returnSubmission(id: string, returnData: ReturnSubmissionRequest): Promise<Submission> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify(returnData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error returning submission:', error);
      throw new Error(getSubmissionErrorMessage(error, 'returning submission'));
    }
  }

  /**
   * Gets all submissions for an assignment
   */
  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    try {
      const response = await fetch(`${this.baseUrl}/assignment/${assignmentId}`, {
        method: 'GET',
        headers: this.getAuthHeader(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching submissions by assignment:', error);
      throw new Error(getSubmissionErrorMessage(error, 'fetching submissions'));
    }
  }

  /**
   * Gets all submissions for a student
   */
  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    try {
      const response = await fetch(`${this.baseUrl}/student/${studentId}`, {
        method: 'GET',
        headers: this.getAuthHeader(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching submissions by student:', error);
      throw new Error(getSubmissionErrorMessage(error, 'fetching submissions'));
    }
  }

  /**
   * Gets pending submissions that need grading
   */
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
        headers: this.getAuthHeader(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
      throw new Error(getSubmissionErrorMessage(error, 'fetching pending submissions'));
    }
  }

  /**
   * Gets the count of pending submissions
   */
  async getPendingSubmissionsCount(courseId?: string): Promise<number> {
    try {
      let url = `${this.baseUrl}/pending/count`;
      
      if (courseId) {
        url += `?courseId=${courseId}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Error fetching pending submissions count:', error);
      return 0; // Return 0 on error to avoid breaking UI
    }
  }

  /**
   * Uploads files for a submission
   */
  async uploadSubmissionFiles(submissionId: string, files: File[]): Promise<FileUploadResponse[]> {
    try {
      const formData = new FormData();
      
      // Add each file to the form data
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      // Add the submission ID
      formData.append('submissionId', submissionId);
      
      const response = await fetch(`${this.baseUrl}/${submissionId}/files`, {
        method: 'POST',
        headers: this.getAuthHeader(false), // Don't include Content-Type for FormData
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading submission files:', error);
      throw new Error(getSubmissionErrorMessage(error, 'uploading files'));
    }
  }

  /**
   * Gets the authentication header for API requests
   */
  private getAuthHeader(includeContentType: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Add Content-Type header if needed
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Add Authorization header if user is logged in
    const token = authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
}

// Create and export a singleton instance
export const submissionService = new SubmissionService();

// Also export the class for testing or custom instances
export default SubmissionService; 