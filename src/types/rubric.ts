export interface RubricLevel {
  id: string;
  title: string;
  description: string;
  points: number;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  weight: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  assignmentId: string;
  title: string;
  description: string;
  totalPoints: number;
  criteria: RubricCriterion[];
}

export interface RubricGradeDTO {
  submissionId: string;
  criteriaGrades: {
    criterionId: string;
    levelId: string;
    points: number;
    feedback?: string;
  }[];
  overallFeedback?: string;
  totalScore: number;
} 