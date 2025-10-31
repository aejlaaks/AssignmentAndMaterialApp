export interface TestDTO {
  Id: string;
  Title: string;
  Description: string;
  Proctored: boolean;
  ShowResults: string;
  TimeLimit: number;
  PassingScore: number;
  Attempts: number;
  DueDate?: string;
  AllowedResources: string[];
  IsVisible: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedById: string;
  CreatedByName: string;
  Questions: QuestionDTO[];
}

export interface CreateTestDTO {
  Title: string;
  Description: string;
  Proctored: boolean;
  ShowResults: string;
  TimeLimit: number;
  PassingScore: number;
  Attempts: number;
  DueDate?: string;
  AllowedResources: string[];
  IsVisible: boolean;
  Questions: CreateQuestionDTO[];
}

export interface UpdateTestDTO {
  Title: string;
  Description: string;
  Proctored: boolean;
  ShowResults: string;
  TimeLimit: number;
  PassingScore: number;
  Attempts: number;
  DueDate?: string;
  AllowedResources: string[];
  IsVisible: boolean;
  Questions: UpdateQuestionDTO[];
}

export interface QuestionDTO {
  Id: string;
  Text: string;
  Type: string;
  Points: number;
  Order: number;
  Explanation?: string;
  Options?: QuestionOptionDTO[];
  TestCases?: TestCaseDTO[];
  CodeTemplate?: string;
  CodeLanguage?: string;
}

export interface CreateQuestionDTO {
  Text: string;
  Type: string;
  Points: number;
  Order: number;
  Explanation?: string;
  Options?: CreateQuestionOptionDTO[];
  TestCases?: CreateTestCaseDTO[];
  CodeTemplate?: string;
  CodeLanguage?: string;
}

export interface UpdateQuestionDTO {
  Id: string;
  Text: string;
  Type: string;
  Points: number;
  Order: number;
  Explanation?: string;
  Options?: UpdateQuestionOptionDTO[];
  TestCases?: UpdateTestCaseDTO[];
  CodeTemplate?: string;
  CodeLanguage?: string;
}

export interface QuestionOptionDTO {
  Id: string;
  Text: string;
  IsCorrect: boolean;
}

export interface CreateQuestionOptionDTO {
  Text: string;
  IsCorrect: boolean;
}

export interface UpdateQuestionOptionDTO {
  Id: string;
  Text: string;
  IsCorrect: boolean;
}

export interface TestCaseDTO {
  Id: string;
  Input: string;
  ExpectedOutput: string;
  IsHidden: boolean;
}

export interface CreateTestCaseDTO {
  Input: string;
  ExpectedOutput: string;
  IsHidden: boolean;
}

export interface UpdateTestCaseDTO {
  Id: string;
  Input: string;
  ExpectedOutput: string;
  IsHidden: boolean;
}

export interface TestAttemptDTO {
  Id: string;
  TestId: string;
  StudentId: string;
  StudentName: string;
  StartTime: string;
  EndTime?: string;
  Score?: number;
  Status: string;
  IsProctored: boolean;
  ProctorNotes?: string;
  Answers: StudentAnswerDTO[];
}

export interface StudentAnswerDTO {
  Id: string;
  QuestionId: string;
  Answer: string;
  Points?: number;
  Feedback?: string;
  TimeSpent?: number;
}

export interface SubmitTestAnswerDTO {
  QuestionId: string;
  Answer: string;
  TimeSpent?: number;
}

export interface StartTestAttemptDTO {
  TestId: string;
}

export interface SubmitTestAttemptDTO {
  TestAttemptId: string;
  Answers: SubmitTestAnswerDTO[];
}

export interface GradeTestAttemptDTO {
  TestAttemptId: string;
  Answers: GradeAnswerDTO[];
  ProctorNotes?: string;
}

export interface GradeAnswerDTO {
  StudentAnswerId: string;
  Points: number;
  Feedback?: string;
} 