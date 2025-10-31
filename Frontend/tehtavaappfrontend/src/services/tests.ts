import createApiClient from './apiClient';

// Create an API client instance for tests
const apiClient = createApiClient();

// Export as named export
export { apiClient };

// Question Option Types
export interface TestQuestionOption {
  Id?: string;
  Text: string;
  IsCorrect: boolean;
}

export interface CreateTestQuestionOption {
  Text: string;
  IsCorrect: boolean;
}

// Question Types
export interface TestQuestionDTO {
  Id: string;
  Text: string;
  Type: string;
  Points: number;
  Order: number;
  Options?: TestQuestionOption[];
}

export interface CreateTestQuestion {
  id?: string; // Optional for creating new questions
  Text: string;
  Type: string;
  Points: number;
  Order: number;
  Options?: CreateTestQuestionOption[];
}

export interface UpdateTestQuestion extends CreateTestQuestion {
  Id: string;
}

// Test Types
export interface TestDTO {
  Id: string;
  Title: string;
  Description?: string;
  Duration?: number;
  PassingScore?: number;
  IsVisible: boolean;
  StartTime?: string;
  EndTime?: string;
  RandomizeQuestions: boolean;
  ShowResults: boolean;
  Questions: TestQuestionDTO[];
  CourseId?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateTestDTO {
  Title: string;
  Description?: string;
  Duration?: number;
  PassingScore?: number;
  IsVisible: boolean;
  StartTime?: Date;
  EndTime?: Date;
  RandomizeQuestions: boolean;
  ShowResults: boolean;
  Questions: CreateTestQuestion[];
  CourseId?: string;
}

export interface UpdateTestDTO {
  Title: string;
  Description?: string;
  Duration?: number;
  PassingScore?: number;
  IsVisible: boolean;
  StartTime?: Date;
  EndTime?: Date;
  RandomizeQuestions: boolean;
  ShowResults: boolean;
  Questions: UpdateTestQuestion[];
  CourseId?: string;
}

// Test Attempt and Result Types
export interface TestAttemptDTO {
  Id: string;
  TestId: string;
  UserId: string;
  StartTime: string;
  EndTime?: string;
  Score?: number;
  IsPassed?: boolean;
  Answers: TestAnswerDTO[];
}

export interface TestAnswerDTO {
  Id: string;
  QuestionId: string;
  SelectedOptions?: string[];
  TextAnswer?: string;
  IsCorrect?: boolean;
  Points?: number;
}

export interface SubmitTestDTO {
  TestId: string;
  Answers: {
    QuestionId: string;
    SelectedOptions?: string[];
    TextAnswer?: string;
  }[];
}

class TestService {
  async getAllTests(): Promise<TestDTO[]> {
    const response = await apiClient.get('/tests');
    return response.data;
  }

  async getTestsByCourse(courseId: string): Promise<TestDTO[]> {
    const response = await apiClient.get(`/courses/${courseId}/tests`);
    return response.data;
  }

  async getTest(testId: string): Promise<TestDTO> {
    const response = await apiClient.get(`/tests/${testId}`);
    return response.data;
  }

  async createTest(testData: CreateTestDTO): Promise<TestDTO> {
    const response = await apiClient.post('/tests', testData);
    return response.data;
  }

  async updateTest(testId: string, testData: UpdateTestDTO): Promise<TestDTO> {
    const response = await apiClient.put(`/tests/${testId}`, testData);
    return response.data;
  }

  async deleteTest(testId: string): Promise<void> {
    await apiClient.delete(`/tests/${testId}`);
  }

  async startTestAttempt(testId: string): Promise<TestAttemptDTO> {
    const response = await apiClient.post(`/tests/${testId}/attempts`, {});
    return response.data;
  }

  async submitTestAttempt(testId: string, attemptId: string, data: SubmitTestDTO): Promise<TestAttemptDTO> {
    const response = await apiClient.post(`/tests/${testId}/attempts/${attemptId}/submit`, data);
    return response.data;
  }

  async getTestAttempt(testId: string, attemptId: string): Promise<TestAttemptDTO> {
    const response = await apiClient.get(`/tests/${testId}/attempts/${attemptId}`);
    return response.data;
  }

  async getTestAttempts(testId: string): Promise<TestAttemptDTO[]> {
    const response = await apiClient.get(`/tests/${testId}/attempts/my`);
    return response.data;
  }

  async getUserTestAttempts(testId: string, userId?: string): Promise<TestAttemptDTO[]> {
    const url = userId 
      ? `/tests/${testId}/users/${userId}/attempts`
      : `/tests/${testId}/attempts/my`;
    
    const response = await apiClient.get(url);
    return response.data;
  }
}

export const testService = new TestService(); 