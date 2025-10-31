import { 
  SubmissionCreateRequest, 
  SubmissionStatus, 
  GradeSubmissionRequest, 
  ReturnSubmissionRequest 
} from './submissionTypes';

/**
 * Formats a submission text into the proper request format expected by the API
 * Includes all required fields for the AssignmentSubmissionDTO
 */
export const formatSubmissionRequest = (text: string, assignmentId: string): SubmissionCreateRequest => {
  return {
    dto: {
      Id: "0", // Temporary ID that will be replaced by the server
      AssignmentId: assignmentId,
      StudentId: "0", // Will be overridden by server from auth context
      SubmissionText: text,
      Status: "Submitted"
    }
  };
};

/**
 * Formats a grade submission request into the proper format expected by the API
 */
export const formatGradeRequest = (
  grade: number, 
  feedback: string, 
  isRichText: boolean = false,
  requiresRevision: boolean = false,
  revisionDueDate?: string
): GradeSubmissionRequest => {
  return {
    grade,
    feedback,
    isRichTextFeedback: isRichText,
    requiresRevision,
    revisionDueDate
  };
};

/**
 * Formats a return submission request into the proper format expected by the API
 */
export const formatReturnRequest = (
  feedback: string,
  isRichText: boolean = false,
  requiresRevision: boolean = false,
  revisionDueDate?: string
): ReturnSubmissionRequest => {
  return {
    feedback,
    isRichTextFeedback: isRichText,
    requiresRevision,
    revisionDueDate
  };
};

/**
 * Maps a numeric status from the backend to a string status
 */
export const mapStatusToText = (status: number): SubmissionStatus => {
  // Backend AssignmentStatus enum:
  // Draft = 0, Published = 1, InProgress = 2, Submitted = 3, Completed = 4, Returned = 5, Archived = 6
  switch (status) {
    case 0: // Draft
      return 'draft';
    case 1: // Published
    case 2: // InProgress
    case 3: // Submitted
      return 'submitted';
    case 4: // Completed
    case 6: // Archived
      return 'graded';
    case 5: // Returned
      return 'returned';
    default:
      return 'submitted';
  }
};

/**
 * Formats an error message for user display based on the error type and context
 */
export const getSubmissionErrorMessage = (error: unknown, context: string = 'submission'): string => {
  // Default error message
  let message = `An error occurred during ${context}. Please try again.`;
  
  if (error instanceof Error) {
    // Check for specific error types or messages
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      message = 'Your session has expired. Please log in again.';
    } else if (error.message.includes('403') || error.message.includes('forbidden')) {
      message = 'You don\'t have permission to perform this action.';
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      message = `The ${context} could not be found.`;
    } else if (error.message.includes('400') || error.message.includes('bad request')) {
      message = `Invalid ${context} data. Please check your inputs.`;
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      message = 'Network error. Please check your connection and try again.';
    } else {
      // Use the actual error message if it's informative
      message = error.message;
    }
  }
  
  return message;
};

/**
 * Validates submission data before sending to the API
 * Returns true if valid, or an error message if invalid
 */
export const validateSubmissionData = (text: string): true | string => {
  if (!text || text.trim() === '') {
    return 'Submission text cannot be empty';
  }
  
  if (text.length > 50000) {
    return 'Submission text is too long (maximum 50,000 characters)';
  }
  
  return true;
};

/**
 * Validates file uploads before sending to the API
 * Returns true if valid, or an error message if invalid
 */
export const validateFileUploads = (files: File[], maxFiles: number = 5, maxSizeMB: number = 10): true | string => {
  if (files.length > maxFiles) {
    return `You can upload a maximum of ${maxFiles} files`;
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  for (const file of files) {
    if (file.size > maxSizeBytes) {
      return `File "${file.name}" exceeds the maximum size of ${maxSizeMB}MB`;
    }
  }
  
  return true;
}; 