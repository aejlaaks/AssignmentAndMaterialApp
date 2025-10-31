import { Block } from './blocks';

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  token: string;
  profileImage?: string;
  stats?: UserStats; // Added to fix Dashboard.tsx error
  phoneNumber?: string; // Added to fix Profile.tsx error
  bio?: string; // Added to fix Profile.tsx error
  isActive?: boolean; // Käyttäjän tila (aktiivinen/deaktivoitu)
}

export enum UserRole {
  Student = 'Student',
  Teacher = 'Teacher',
  Admin = 'Admin',
}

export interface UserStats {
  coursesEnrolled: number;
  assignmentsCompleted: number;
  averageGrade: number;
}

// Auth state
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Redux state
export interface RootState {
  auth: AuthState;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority; // Added priority property
  isRead: boolean;
  isArchived: boolean; // Added isArchived property
  createdAt: string;
  metadata?: NotificationMetadata;
}

export interface NotificationMetadata {
  url?: string;
  entityId?: string;
  entityType?: string;
  [key: string]: any;
}

export enum NotificationType {
  Info = 'Info',
  Success = 'Success',
  Warning = 'Warning',
  Error = 'Error',
  Assignment = 'Assignment',
  AssignmentSubmitted = 'AssignmentSubmitted',
  Group = 'Group',
  Course = 'Course',
  Material = 'Material',
  // Generic type for any backend types not explicitly defined
  System = 'System'
}

export enum NotificationPriority { // Added NotificationPriority enum
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export interface NotificationPreferences { // Added NotificationPreferences interface
  emailNotifications: boolean;
  pushNotifications: boolean;
  enrolledCoursesOnly: boolean; // Only show notifications for enrolled courses
  enabledTypes?: NotificationType[]; // Types of notifications to receive
  enabledPriorities?: NotificationPriority[]; // Priority levels to receive
}

export interface Course {
  id: string;
  name: string;
  description: string;
  code?: string;
  teacherId: string;
  teacherName?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  contentBlocks?: Block[];
  studentCount?: number;
  materialCount?: number;
  assignmentCount?: number;
  groups?: SchoolGroup[];
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  groupId: string;
  enrollmentDate: string;
  status: string;
  progress: number;
  student?: User;
}

export interface PaginatedResponse<T> { // Added PaginatedResponse generic interface
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export enum NotificationChannel { // Added NotificationChannel enum
  Email = 'Email',
  Push = 'Push',
  SMS = 'SMS',
}

export interface SchoolGroup {
  id: string;
  name: string;
  description?: string;
  createdById?: string;
  createdByName?: string;
  isActive?: boolean;
  memberCount?: number;
  studentCount?: number;
  courseCount?: number;
  courseId?: string;
  students?: any[];
  studentEnrollments?: StudentEnrollment[];
  hasCourse?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface Material {
  id: string;
  title: string;
  content: string;
  courseId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  points?: number;
  status?: string;
  relatedMaterials?: any[];
  deadline?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  content: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  files?: SubmissionFile[];
}

export interface SubmissionFile {
  id: string;
  submissionId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  weight: number; // Percentage of total grade
  maxPoints: number;
  pointsAwarded?: number;
  feedback?: string;
}

export interface Rubric {
  id: string;
  title: string;
  description?: string;
  assignmentId?: string;
  criteria: RubricCriterion[];
  isTemplate: boolean;
  createdById: string;
  createdAt: string;
  updatedAt?: string;
}

// AI Grading types
export interface AIGradingResult {
  grade: number;
  feedback: string;
  criteriaScores?: Record<string, number>;
  isAIGenerated: boolean;
  confidence: number;
  provider: string;
  model: string;
  reasoning?: string;
}

export interface AIGradingSettings {
  enabled: boolean;
  provider: 'OpenAI' | 'AzureOpenAI';
  mode: 'Automatic' | 'Assisted';
  markAsAIGenerated: boolean;
  openAI?: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  azureOpenAI?: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
    apiVersion: string;
  };
}

export interface AIGradingRequest {
  submissionId: string;
  useRubric: boolean;
  customInstructions?: string;
}

export interface GradingHistory {
  id: string;
  submissionId: string;
  gradedById: string;
  gradedByName: string;
  grade: number;
  feedback: string;
  timestamp: string;
  notes?: string;
}

// Export all types from CourseTypes.ts
export * from './CourseTypes';

// Keep existing exports
export * from './blocks';
export * from './assignments';
export * from './rubric';
export * from './Material';
export * from './User';

// Note: Course.ts is deprecated, use CourseTypes.ts instead
// export * from './Course';
