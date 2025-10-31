import httpClient from '../../utils/httpClient';
import { handleApiError } from '../errorHandler';

export enum GradingType {
  Numeric = 0,  // Default 1-5 scale
  PassFail = 1  // Pass/Fail grading
}

export interface CourseGrade {
  id: number;
  courseId: number;
  studentId: string;
  studentName: string;
  grade: number;
  gradedById: string;
  gradedByName: string;
  gradedAt: string;
  feedback: string;
  isFinal: boolean;
  gradingType: GradingType;
  passed: boolean;
}

export interface SaveCourseGradeRequest {
  courseId: number;
  studentId: string;
  grade: number;
  feedback: string;
  isFinal: boolean;
  gradingType: number; // Must be a number to match C# enum
}

export interface CourseGradeStatistics {
  totalStudents: number;
  gradedStudents: number;
  averageGrade: number;
  gradeDistribution: number[];
  passCount: number;
  failCount: number;
  gradingType: GradingType;
}

const courseGradingService = {
  /**
   * Calculate a course grade for a student based on their assignment submissions
   */
  async calculateCourseGrade(courseId: number, studentId: string): Promise<number> {
    try {
      const response = await httpClient.get(`/api/course-grading/calculate/${courseId}/${studentId}`);
      return response.data.grade;
    } catch (error: any) {
      console.error('Error calculating course grade:', error);
      throw error;
    }
  },

  /**
   * Save a course grade for a student
   */
  async saveCourseGrade(gradeData: SaveCourseGradeRequest): Promise<number> {
    try {
      // Send the grade data directly without wrapping it in a 'model' property
      // Log the request for debugging
      console.log('Sending grade request:', gradeData);
      const response = await httpClient.post(`/api/course-grading`, gradeData);
      return response.data.id;
    } catch (error: any) {
      // Log the full error response for better debugging
      if (error.response) {
        console.error('Server error response:', error.response.status, error.response.data);
      }
      console.error('Error saving course grade:', error);
      throw error;
    }
  },

  /**
   * Get a student's course grade
   */
  async getStudentCourseGrade(courseId: number, studentId: string): Promise<CourseGrade | null> {
    try {
      const response = await httpClient.get(`/api/course-grading/${courseId}/${studentId}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error('Error getting student course grade:', error);
      throw error;
    }
  },

  /**
   * Get all course grades for a course
   */
  async getCourseGrades(courseId: number): Promise<CourseGrade[]> {
    try {
      const response = await httpClient.get(`/api/course-grading/${courseId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting course grades:', error);
      throw error;
    }
  }
};

export default courseGradingService; 