import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { handleApiError } from '../errorHandler';
import { GradingHistory } from '../../types';

class GradingHistoryService {
  private baseUrl = `${API_BASE_URL}/grading-history`;

  /**
   * Get grading history for a specific submission
   */
  async getGradingHistoryBySubmission(submissionId: string): Promise<GradingHistory[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/submission/${submissionId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error fetching grading history');
    }
  }

  /**
   * Get grading history for all submissions of an assignment
   */
  async getGradingHistoryByAssignment(assignmentId: string): Promise<GradingHistory[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/assignment/${assignmentId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error fetching assignment grading history');
    }
  }

  /**
   * Get grading history for all submissions graded by a specific teacher
   */
  async getGradingHistoryByTeacher(teacherId: string): Promise<GradingHistory[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error fetching teacher grading history');
    }
  }

  /**
   * Revert a submission to a previous grading version
   */
  async revertToHistoryVersion(historyId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/revert/${historyId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error reverting to previous grading version');
    }
  }

  /**
   * Get statistics about grading history
   */
  async getGradingStatistics(filters?: { 
    teacherId?: string, 
    assignmentId?: string, 
    courseId?: string,
    startDate?: string,
    endDate?: string
  }): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/statistics`, { params: filters });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Error fetching grading statistics');
    }
  }

  /**
   * Get recent grading activity
   */
  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/recent`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }
}

export const gradingHistoryService = new GradingHistoryService(); 