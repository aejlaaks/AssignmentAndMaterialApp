import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { getAuthHeader } from '../../utils/auth';
import { handleApiError } from '../../utils/errorHandler';
import { Rubric, RubricGradeDTO } from '../../types/rubric';

export const rubricService = {
  /**
   * Get a rubric by ID
   * @param rubricId The ID of the rubric to fetch
   * @returns Promise with the rubric data
   */
  getRubric: async (rubricId: string): Promise<Rubric> => {
    try {
      const response = await axios.get<Rubric>(`${API_BASE_URL}/rubrics/${rubricId}`, {
        headers: getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Error fetching rubric');
    }
  },
  
  /**
   * Get the rubric for an assignment
   * @param assignmentId The ID of the assignment
   * @returns Promise with the rubric data
   */
  getRubricByAssignment: async (assignmentId: string): Promise<Rubric> => {
    try {
      const response = await axios.get<Rubric>(`${API_BASE_URL}/rubrics/assignment/${assignmentId}`, {
        headers: getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Error fetching rubric for assignment');
    }
  },
  
  /**
   * Create a new rubric
   * @param rubric The rubric data to create
   * @returns Promise with the created rubric
   */
  createRubric: async (rubric: Rubric): Promise<Rubric> => {
    try {
      const response = await axios.post<Rubric>(`${API_BASE_URL}/rubrics`, rubric, {
        headers: getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Error creating rubric');
    }
  },
  
  /**
   * Update an existing rubric
   * @param rubricId The ID of the rubric to update
   * @param rubric The updated rubric data
   * @returns Promise with the updated rubric
   */
  updateRubric: async (rubricId: string, rubric: Rubric): Promise<Rubric> => {
    try {
      const response = await axios.put<Rubric>(`${API_BASE_URL}/rubrics/${rubricId}`, rubric, {
        headers: getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Error updating rubric');
    }
  },
  
  /**
   * Delete a rubric
   * @param rubricId The ID of the rubric to delete
   * @returns Promise with the deletion result
   */
  deleteRubric: async (rubricId: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/rubrics/${rubricId}`, {
        headers: getAuthHeader()
      });
    } catch (error) {
      throw handleApiError(error, 'Error deleting rubric');
    }
  },
  
  /**
   * Grade a submission using a rubric
   * @param submissionId The ID of the submission to grade
   * @param gradeData The grading data
   * @returns Promise with the grading result
   */
  gradeWithRubric: async (submissionId: string, gradeData: RubricGradeDTO): Promise<any> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/rubrics/grade/${submissionId}`,
        gradeData,
        {
          headers: getAuthHeader()
        }
      );
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Error grading with rubric');
    }
  },
  
  /**
   * Get the rubric grades for a submission
   * @param submissionId The ID of the submission
   * @returns Promise with the rubric grades
   */
  getRubricGrades: async (submissionId: string): Promise<RubricGradeDTO> => {
    try {
      const response = await axios.get<RubricGradeDTO>(
        `${API_BASE_URL}/rubrics/grades/${submissionId}`,
        {
          headers: getAuthHeader()
        }
      );
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Error fetching rubric grades');
    }
  }
}; 