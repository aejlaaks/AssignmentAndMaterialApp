import axios from 'axios';
import { Assignment, CreateAssignmentRequest, UpdateAssignmentRequest, Submission } from '../../types/assignments';
import { authService } from '../auth/authService';
import { API_URL } from '../../utils/apiConfig';
import { IAssignmentService } from '../../interfaces/services/IAssignmentService';

// Create axios instance with default auth headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  config => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * Concrete implementation of the IAssignmentService interface
 * Following Single Responsibility Principle by handling only assignment-related operations
 */
export class AssignmentServiceImpl implements IAssignmentService {
  async getAssignments(): Promise<Assignment[]> {
    try {
      const response = await api.get('/assignment');
      console.log('Retrieved assignments:', response.data);
      return this.normalizeAssignments(response.data) as Assignment[];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  async getAssignmentById(id: string): Promise<Assignment | null> {
    try {
      const response = await api.get(`/assignment/${id}`);
      return response.data as Assignment;
    } catch (error) {
      console.error(`Error fetching assignment ${id}:`, error);
      return null;
    }
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    try {
      const response = await api.get(`/assignment/course/${courseId}`);
      console.log(`Retrieved assignments for course ${courseId}:`, response.data);
      return this.normalizeAssignments(response.data) as Assignment[];
    } catch (error) {
      console.error(`Error fetching assignments for course ${courseId}:`, error);
      throw error;
    }
  }

  async createAssignment(assignmentData: CreateAssignmentRequest): Promise<Assignment> {
    try {
      const response = await api.post('/assignment', assignmentData);
      return response.data as Assignment;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  async updateAssignment(assignmentData: UpdateAssignmentRequest): Promise<Assignment> {
    try {
      const response = await api.put(`/assignment/${assignmentData.id}`, assignmentData);
      return response.data as Assignment;
    } catch (error) {
      console.error(`Error updating assignment ${assignmentData.id}:`, error);
      throw error;
    }
  }

  async deleteAssignment(id: string): Promise<void> {
    try {
      console.log(`Attempting to delete assignment: ${id}`);
      
      // Get token
      const token = authService.getToken();
      
      // Use fetch API directly for more reliable deletion
      const response = await fetch(`${API_URL}/assignment/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'No error details available';
        }
        
        // Check for database constraint errors
        if (response.status === 500 && errorText.includes('REFERENCE constraint')) {
          throw new Error('Tehtävää ei voitu poistaa, koska siihen liittyy muita tietoja (ilmoituksia tai palautuksia). Ota yhteyttä järjestelmänvalvojaan.');
        }
        
        throw new Error(`Delete failed with status ${response.status}: ${errorText}`);
      }
      
      console.log('Assignment deleted successfully');
    } catch (error) {
      console.error(`Error deleting assignment ${id}:`, error);
      throw error;
    }
  }

  async addAssignmentToCourse(assignmentId: string, courseId: string): Promise<Assignment> {
    try {
      const response = await api.post(`/assignment/${assignmentId}/course/${courseId}`);
      return response.data as Assignment;
    } catch (error) {
      console.error(`Error adding assignment ${assignmentId} to course ${courseId}:`, error);
      throw error;
    }
  }

  async getStudentAssignments(studentId: string): Promise<Assignment[]> {
    try {
      const response = await api.get(`/assignment/student/${studentId}`);
      return this.normalizeAssignments(response.data) as Assignment[];
    } catch (error) {
      console.error(`Error fetching assignments for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Get submissions for an assignment
   * @param assignmentId The assignment ID to get submissions for
   * @returns Array of submissions
   */
  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    try {
      const response = await api.get(`/assignment/${assignmentId}/submissions`);
      return response.data as Submission[];
    } catch (error) {
      console.error('Error getting submissions for assignment:', error);
      return [];
    }
  }

  /**
   * Submit an assignment
   * @param request The submission request
   * @returns The created submission
   */
  async submitAssignment(request: { assignmentId: string; studentId: string; file?: File; comment?: string }): Promise<Submission> {
    try {
      // Create a FormData object to handle file uploads
      const formData = new FormData();
      formData.append('assignmentId', request.assignmentId);
      formData.append('studentId', request.studentId);
      
      if (request.comment) {
        formData.append('comment', request.comment);
      }
      
      if (request.file) {
        formData.append('file', request.file);
      }
      
      const response = await api.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data as Submission;
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    }
  }

  /**
   * Grade a submission
   * @param submissionId The submission ID to grade
   * @param request The grading request
   * @returns The updated submission
   */
  async gradeSubmission(submissionId: string, request: { grade: number; feedback?: string }): Promise<Submission> {
    try {
      const response = await api.post(`/submissions/${submissionId}/grade`, request);
      return response.data as Submission;
    } catch (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
  }

  /**
   * Get all grades for a student in a specific course
   * @param studentId The ID of the student
   * @param courseId The ID of the course
   * @returns Array of assignment grades for the student
   */
  async getStudentGrades(studentId: string, courseId: string): Promise<any[]> {
    try {
      console.log(`[AssignmentService] Fetching grades for student ${studentId} in course ${courseId}`);
      
      try {
        // First try the direct student grades endpoint
        const response = await api.get(`/student/${studentId}/grades?courseId=${courseId}`);
        console.log(`[AssignmentService] Successfully fetched ${response.data.length} grades from endpoint`);
        return response.data;
      } catch (endpointError: any) {
        // Check if it's a permissions error
        if (endpointError?.response?.status === 403) {
          console.log('[AssignmentService] Not authorized to access grades directly, using submissions endpoint');
          
          // Try the submissions endpoint (which should be accessible to more users)
          const submissionsResponse = await api.get(`/assignment/submissions/student`);
          console.log(`[AssignmentService] Successfully fetched ${submissionsResponse.data.length} submissions from endpoint`);
          
          // Filter by courseId if provided
          const courseSubmissions = courseId 
            ? submissionsResponse.data.filter((sub: any) => 
                sub.assignment && sub.assignment.courseId === parseInt(courseId, 10))
            : submissionsResponse.data;
            
          console.log(`[AssignmentService] Filtered to ${courseSubmissions.length} submissions for course ${courseId}`);
          
          // If requesting grades for a specific student (not current user)
          if (studentId) {
            const studentSubmissions = courseSubmissions.filter((sub: any) => 
              sub.studentId === studentId
            );
            
            // Transform submissions to grade format
            const grades = studentSubmissions.map((submission: any) => ({
              assignmentId: submission.assignmentId,
              title: submission.assignment?.title || `Assignment ${submission.assignmentId}`,
              maxGrade: submission.assignment?.points || 5,
              grade: submission.grade,
              submittedAt: submission.submittedAt || submission.createdAt,
              isGraded: submission.grade !== null && submission.grade !== undefined
            }));
            
            console.log(`[AssignmentService] Transformed ${grades.length} submissions into grades`);
            return grades;
          }
          
          return courseSubmissions;
        } else if (endpointError?.response?.status === 404) {
          // If the direct endpoint doesn't exist (404), use a fallback approach
          console.log('[AssignmentService] Grades endpoint not found, using fallback approach');
        } else {
          console.log('[AssignmentService] Error accessing grades endpoint:', endpointError);
        }
        
        // Get all assignments for the course
        const assignments = await this.getAssignmentsByCourse(courseId);
        console.log(`[AssignmentService] Found ${assignments.length} assignments for course ${courseId}`);
        
        if (!assignments.length) {
          return [];
        }
        
        // Get submissions for each assignment
        const gradesPromises = assignments.map(async (assignment) => {
          try {
            const submissions = await this.getSubmissionsByAssignment(assignment.id);
            
            // Filter for this student's submission
            const studentSubmission = submissions.find(s => s.studentId === studentId);
            
            if (!studentSubmission) {
              return {
                assignmentId: assignment.id,
                title: assignment.title,
                maxGrade: assignment.points || 5,
                grade: null,
                isGraded: false,
                submittedAt: null
              };
            }
            
            return {
              assignmentId: assignment.id,
              title: assignment.title,
              maxGrade: assignment.points || 5,
              grade: studentSubmission.grade || null,
              submittedAt: studentSubmission.submittedAt,
              isGraded: studentSubmission.grade !== null && studentSubmission.grade !== undefined
            };
          } catch (error) {
            console.error(`[AssignmentService] Error fetching submissions for assignment ${assignment.id}:`, error);
            return null;
          }
        });
        
        const grades = (await Promise.all(gradesPromises)).filter(Boolean);
        console.log(`[AssignmentService] Generated ${grades.length} grade entries from submissions`);
        
        return grades;
      }
    } catch (error) {
      console.error(`[AssignmentService] Error fetching grades for student ${studentId} in course ${courseId}:`, error);
      
      // Add more detailed error information
      if (axios.isAxiosError(error)) {
        console.error(`[AssignmentService] HTTP status: ${error.response?.status}`);
        console.error(`[AssignmentService] Response data:`, error.response?.data);
      }
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Helper method to normalize assignments from the API
   * @param data The data from the API
   * @returns Normalized array of assignments
   */
  private normalizeAssignments(data: any): Assignment[] {
    // Handle various response formats
    let assignments = [];
    
    if (data && data.$values) {
      // .NET-style response with $values array
      assignments = data.$values;
    } else if (Array.isArray(data)) {
      // Regular array response
      assignments = data;
    } else if (data && typeof data === 'object') {
      // Single assignment object
      assignments = [data];
    }
    
    // Ensure each assignment has the required properties
    return assignments.map((assignment: any) => {
      // Make sure each assignment has the required properties
      const normalized: Assignment = {
        id: assignment.id,
        title: assignment.title || '',
        description: assignment.description || '',
        dueDate: assignment.dueDate || '',
        courseId: assignment.courseId || '',
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        points: assignment.points,
        status: assignment.status
      };
      
      return normalized;
    });
  }
} 