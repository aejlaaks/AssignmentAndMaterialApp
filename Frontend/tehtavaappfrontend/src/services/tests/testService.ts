import { apiClient } from '../apiClient';
import {
  TestDTO,
  TestAttemptDTO,
  StartTestAttemptDTO,
  SubmitTestAnswerDTO,
  GradeTestAttemptDTO,
  CreateTestDTO,
  UpdateTestDTO
} from './testTypes';

class TestService {
  async getTest(testId: string): Promise<TestDTO> {
    const response = await apiClient.get(`/api/tests/${testId}`);
    return response.data;
  }

  async createTest(test: CreateTestDTO): Promise<TestDTO> {
    try {
      console.log('Creating test with data:', JSON.stringify(test));
      
      // Create temporary IDs for questions if they don't have one
      const questionsWithIds = (test.Questions || []).map((question, index) => ({
        ...question,
        // Use temporary ID for reference within this request
        _tempId: `temp-question-${index}`
      }));
      
      // Make sure AllowedResources is a string, not an empty array (backend expects a JSON string)
      const preparedData = {
        ...test,
        // Convert empty array to JSON string "[]" instead of null
        AllowedResources: Array.isArray(test.AllowedResources) 
          ? (test.AllowedResources.length === 0 ? "[]" : JSON.stringify(test.AllowedResources))
          : "[]",
        // Ensure Questions have all required fields
        Questions: questionsWithIds.map(question => ({
          ...question,
          // Ensure CodeLanguage is never null/undefined
          CodeLanguage: question.CodeLanguage || 'none',
          // Ensure Explanation is never null/undefined
          Explanation: question.Explanation || '',
          // Ensure CodeTemplate is never null/undefined
          CodeTemplate: question.CodeTemplate || '',
          // Ensure Options have QuestionId set
          Options: (question.Options || []).map(option => ({
            ...option,
            QuestionId: question._tempId // Use the temporary ID
          }))
        }))
      };
      
      console.log('Prepared test data:', JSON.stringify(preparedData));
      
      const response = await apiClient.post('/api/tests', preparedData);
      return response.data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  }

  async updateTest(testId: string, test: UpdateTestDTO): Promise<TestDTO> {
    const response = await apiClient.put(`/api/tests/${testId}`, test);
    return response.data;
  }

  async deleteTest(testId: string): Promise<void> {
    await apiClient.delete(`/api/tests/${testId}`);
  }

  async startTestAttempt(testId: string): Promise<TestAttemptDTO> {
    const data: StartTestAttemptDTO = { TestId: testId };
    const response = await apiClient.post('/api/tests/attempts/start', data);
    return response.data;
  }

  async submitTestAttempt(
    attemptId: string,
    answers: SubmitTestAnswerDTO[]
  ): Promise<void> {
    const data = {
      TestAttemptId: attemptId,
      Answers: answers,
    };
    await apiClient.post('/api/tests/attempts/submit', data);
  }

  async getTestAttempt(attemptId: string): Promise<TestAttemptDTO> {
    const response = await apiClient.get(`/api/tests/attempts/${attemptId}`);
    return response.data;
  }

  async getTestAttempts(testId: string): Promise<TestAttemptDTO[]> {
    const response = await apiClient.get(`/api/tests/${testId}/attempts`);
    return response.data;
  }

  async gradeTestAttempt(
    attemptId: string,
    answers: GradeTestAttemptDTO['Answers'],
    proctorNotes?: string
  ): Promise<void> {
    const data: GradeTestAttemptDTO = {
      TestAttemptId: attemptId,
      Answers: answers,
      ProctorNotes: proctorNotes,
    };
    await apiClient.post('/api/tests/attempts/grade', data);
  }
}

export const testService = new TestService(); 