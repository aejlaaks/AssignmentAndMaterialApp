import axios from 'axios';
import { Submission, SubmissionFile } from '../../types';
import { authService } from '../auth/authService';
import { getAuthHeader } from '../../utils/authUtils';
import { API_URL, API_BASE_URL, logApiCall } from '../../utils/apiConfig';

// Create axios instance with default auth headers
const api = axios.create({
  baseURL: API_BASE_URL,
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

export interface ICreateSubmissionRequest {
  assignmentId: string;
  content: string;
  files?: File[];
}

export interface IUpdateSubmissionRequest {
  id: string;
  content?: string;
  grade?: number;
  feedback?: string;
  status?: 'submitted' | 'graded' | 'returned';
}

export interface ISubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submissionText: string;
  status: 'submitted' | 'graded' | 'returned';
  submittedAt: string;
  gradedAt?: string;
  grade?: number;
  feedbackText?: string;
  gradedById?: string;
  attemptNumber: number;
  requiresRevision: boolean;
  isLate: boolean;
  submittedMaterials?: any[];
  assignmentTitle?: string;
  courseName?: string;
  revisionDueDate?: string;
}

export interface ISubmissionCreate {
  assignmentId: string;
  content: string;
  files?: File[];
}

export interface ISubmissionUpdate {
  id: string;
  content?: string;
  status?: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  requiresRevision?: boolean;
  revisionDueDate?: string;
}

export interface IGradeSubmission {
  grade?: number;
  feedback: string;
  requiresRevision: boolean;
  revisionDueDate?: string;
  notes?: string;
  metadata?: {
    GroupName?: string;
    [key: string]: any;
  };
}

export interface IReturnSubmission {
  feedback: string;
  requiresRevision: boolean;
  metadata?: {
    GroupName?: string;
    [key: string]: any;
  };
}

export const getSubmissionsByAssignment = async (assignmentId: string): Promise<ISubmission[]> => {
  try {
    // Use the dedicated endpoint for assignment submissions
    const endpoint = `/submission/assignment/${assignmentId}`;
    logApiCall('GET', endpoint);
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: getAuthHeader()
    });
    
    // Map the numeric status to text status if needed
    return response.data.map((submission: any) => ({
      ...submission,
      status: typeof submission.status === 'number' ? mapStatusToText(submission.status) : submission.status
    }));
  } catch (error) {
    console.error('Error fetching submissions by assignment:', error);
    
    // If we get a 404 error, it might be because the endpoint doesn't exist yet
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('Endpoint not found, falling back to client-side filtering');
      
      // Fallback to the old method using student submissions
      try {
        const studentEndpoint = `/submission/student`;
        logApiCall('GET', studentEndpoint);
        const response = await axios.get(`${API_URL}${studentEndpoint}`, {
          headers: getAuthHeader()
        });
        
        // Filter submissions by assignment ID
        const allSubmissions = response.data;
        const filteredSubmissions = allSubmissions.filter(
          (submission: ISubmission) => submission.assignmentId === assignmentId
        );
        
        return filteredSubmissions.map((submission: any) => ({
          ...submission,
          status: typeof submission.status === 'number' ? mapStatusToText(submission.status) : submission.status
        }));
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        return [];
      }
    }
    
    // For other errors, return empty array
    return [];
  }
};

export const getSubmissionsByStudent = async (studentId: string): Promise<ISubmission[]> => {
  try {
    if (!studentId) {
      console.error('getSubmissionsByStudent: studentId puuttuu');
      throw new Error('Opiskelijan ID puuttuu');
    }
    
    // Use the correct endpoint for student submissions
    const endpoint = `/submission/student`;
    logApiCall('GET', endpoint);
    console.log(`Lähetetään pyyntö: ${API_URL}${endpoint}`);
    
    const headers = getAuthHeader();
    console.log('Autentikaatio-headerit:', headers);
    
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: headers
    });
    
    console.log('Palvelimen vastaus:', response.status, response.statusText);
    console.log('Vastauksen data:', response.data);
    
    if (!response.data) {
      console.warn('Palvelin palautti tyhjän vastauksen');
      return [];
    }
    
    if (!Array.isArray(response.data)) {
      console.error('Palvelimen vastaus ei ole array:', response.data);
      return [];
    }
    
    // Filter submissions by student ID
    const filteredSubmissions = response.data.filter(
      (submission: ISubmission) => submission.studentId === studentId
    );
    
    // Log the status of each submission before processing
    console.log('Submission statuses before processing:', 
      filteredSubmissions.map(s => ({ 
        id: s.id, 
        status: s.status, 
        statusType: typeof s.status 
      }))
    );
    
    const enrichedSubmissions = await Promise.all(
      filteredSubmissions.map(async (submission: ISubmission) => {
        try {
          // Process each submission's status into a standardized format
          const rawStatus = submission.status;
          submission.status = mapStatusToText(rawStatus);
          
          console.log(`Submission ${submission.id} status: ${rawStatus} -> ${submission.status}`);
          
          if (!submission.assignmentTitle) {
            const assignmentEndpoint = `/assignment/${submission.assignmentId}`;
            logApiCall('GET', assignmentEndpoint);
            const assignmentResponse = await axios.get(`${API_URL}${assignmentEndpoint}`, {
              headers: getAuthHeader()
            });
            submission.assignmentTitle = assignmentResponse.data.title;
            submission.courseName = assignmentResponse.data.courseName;
          }
        } catch (error) {
          console.error('Error processing submission:', error);
          submission.assignmentTitle = `Tehtävä ${submission.assignmentId}`;
          submission.courseName = 'Tuntematon kurssi';
        }
        return submission;
      })
    );
    
    // Log the status of each submission after processing
    console.log('Submission statuses after processing:', 
      enrichedSubmissions.map(s => ({ 
        id: s.id, 
        status: s.status, 
        statusType: typeof s.status 
      }))
    );
    
    return enrichedSubmissions;
  } catch (error) {
    console.error('Error fetching student submissions:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Kirjautuminen on vanhentunut. Kirjaudu sisään uudelleen.');
      } else if (error.response?.status === 403) {
        throw new Error('Sinulla ei ole oikeuksia nähdä näitä palautuksia.');
      } else if (error.response?.status === 404) {
        throw new Error('Palautuksia ei löytynyt. Palvelin vastasi: 404 Not Found');
      }
    }
    throw error;
  }
};

export const getSubmissionById = async (submissionId: string): Promise<ISubmission> => {
  try {
    const endpoint = `/submission/${submissionId}`;
    logApiCall('GET', endpoint);
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: getAuthHeader()
    });
    
    // Map the numeric status to text status
    const submission = response.data;
    submission.status = mapStatusToText(submission.status);
    
    return submission;
  } catch (error) {
    console.error('Error fetching submission by ID:', error);
    
    // If we get a 404 error, return a more user-friendly error
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Palautusta ei löytynyt. Palvelin vastasi: 404 Not Found');
    }
    
    throw error;
  }
};

export const createSubmission = async (submission: ISubmissionCreate): Promise<ISubmission> => {
  // First try the simple submission method as it's more likely to work
  try {
    return await createSubmissionSimple(submission);
  } catch (error) {
    console.log("Simple submission failed, trying complex method:", error);
    
    // If simple submission fails, try the full DTO method
    return await createSubmissionFull(submission);
  }
};

// Original complex submission method renamed
export const createSubmissionFull = async (submission: ISubmissionCreate): Promise<ISubmission> => {
  try {
    // Get current user to access their ID
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Create a properly structured AssignmentSubmissionDTO with all required fields
    // The property names must match exactly what the backend expects (PascalCase)
    const dto = {
      Id: "0", // Temporary ID that will be replaced by the server
      AssignmentId: submission.assignmentId,
      StudentId: currentUser.id,
      SubmissionText: submission.content,
      Status: "Submitted",
      SubmittedAt: new Date().toISOString(),
      AttemptNumber: 1,
      RequiresRevision: false,
      IsLate: false,
      SubmittedMaterials: []
    };
    
    // Wrap the DTO in a dto property as required by the API
    const requestData = { dto };
    
    // Use the new submission controller endpoint 
    const endpoint = `/submission/assignment/${submission.assignmentId}`;
    
    logApiCall('POST', endpoint, requestData);
    console.log('Creating submission with data:', requestData);
    
    // NOTE: The current backend implementation does not support file uploads directly
    // with the submission. Files would need to be handled separately after submission 
    // creation if this feature is needed.
    if (submission.files && submission.files.length > 0) {
      console.warn('File uploads are not currently supported with submission creation.');
    }
    
    // Try using axios for the request
    const token = authService.getToken();
    const url = `${API_URL}${endpoint}`;
    
    try {
      const axiosResponse = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log('Create submission response:', axiosResponse.data);
      return axiosResponse.data;
    } catch (axiosError) {
      if (axios.isAxiosError(axiosError) && axiosError.response) {
        console.error('Axios error response:', axiosError.response.data);
        console.error('Axios error status:', axiosError.response.status);
        console.error('Full error details:', axiosError);
        
        // Check for not found errors (assignment doesn't exist)
        if (axiosError.response.status === 404) {
          throw new Error(`Assignment not found: ${axiosError.response.data.error || 'The requested assignment does not exist'}`);
        }
        
        // Provide more detailed error information from the response
        if (axiosError.response.data && axiosError.response.data.error) {
          throw new Error(`Server error: ${axiosError.response.data.error}`);
        } else if (axiosError.response.data && axiosError.response.data.errors) {
          const errors = Object.values(axiosError.response.data.errors).flat().join(', ');
          throw new Error(`Validation error: ${errors}`);
        } else {
          throw new Error(`Server error: ${axiosError.response.status} ${axiosError.response.statusText}`);
        }
      }
      throw axiosError;
    }
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
};

export const createSubmissionSimple = async (submission: ISubmissionCreate): Promise<ISubmission> => {
  try {
    // Create a simple request with just the submission text
    // Use SubmissionText with capital S to match backend model property name
    const requestData = {
      SubmissionText: submission.content
    };
    
    // Use the simplified submission endpoint
    const endpoint = `/submission/assignment/${submission.assignmentId}/simple`;
    
    logApiCall('POST', endpoint, requestData);
    console.log('Creating submission with data:', requestData);
    
    const token = authService.getToken();
    const url = `${API_URL}${endpoint}`;
    
    try {
      const axiosResponse = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log('Create submission response:', axiosResponse.data);
      return axiosResponse.data;
    } catch (axiosError) {
      if (axios.isAxiosError(axiosError) && axiosError.response) {
        console.error('Axios error response:', axiosError.response.data);
        console.error('Axios error status:', axiosError.response.status);
        console.error('Full error details:', axiosError);
        
        // Check for not found errors (assignment doesn't exist)
        if (axiosError.response.status === 404) {
          throw new Error(`Assignment not found: ${axiosError.response.data.error || 'The requested assignment does not exist'}`);
        }
        
        // Provide more detailed error information from the response
        if (axiosError.response.data && axiosError.response.data.error) {
          throw new Error(`Server error: ${axiosError.response.data.error}`);
        } else if (axiosError.response.data && axiosError.response.data.errors) {
          const errors = Object.values(axiosError.response.data.errors).flat().join(', ');
          throw new Error(`Validation error: ${errors}`);
        } else {
          throw new Error(`Server error: ${axiosError.response.status} ${axiosError.response.statusText}`);
        }
      }
      throw axiosError;
    }
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
};

export const updateSubmission = async (submissionData: ISubmissionUpdate): Promise<ISubmission> => {
  try {
    // Ensure ID is a valid number
    const numericId = parseInt(submissionData.id as string, 10);
    
    if (isNaN(numericId)) {
      throw new Error(`Invalid submission ID: ${submissionData.id}`);
    }
    
    const endpoint = `/assignment/submissions/${numericId}`;
    
    // CRITICAL: The ID in the URL path must exactly match the ID in the request body
    // The backend validates that path ID === body ID and requires Feedback field
    const dataToSend = {
      Id: numericId, // Must be numeric and match the path parameter
      Content: submissionData.content || "",
      // Backend validation requires the Feedback field to be non-null
      Feedback: submissionData.feedback || "", // Required by backend validation
      Grade: null,
      // Convert from lowercase status in TS interface to PascalCase for API
      Status: submissionData.status 
        ? submissionData.status.charAt(0).toUpperCase() + submissionData.status.slice(1) 
        : "Submitted" // Default to Submitted if not provided
    };
    
    logApiCall('PUT', endpoint, dataToSend);
    console.log('Sending update to endpoint:', `${API_URL}${endpoint}`);
    console.log('With data:', JSON.stringify(dataToSend));
    
    try {
      const response = await axios.put(`${API_URL}${endpoint}`, dataToSend, {
        headers: getAuthHeader()
      });
      
      console.log('Update response:', response.data);
      return response.data;
    } catch (axiosError) {
      if (axios.isAxiosError(axiosError) && axiosError.response) {
        console.error('Full error response:', axiosError.response);
        console.error('Error data:', JSON.stringify(axiosError.response.data));
        console.error('Error status:', axiosError.response.status);
        console.error('Error headers:', JSON.stringify(axiosError.response.headers));
      }
      throw axiosError;
    }
  } catch (error) {
    console.error('Error updating submission:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    throw error;
  }
};

export const gradeSubmission = async (submissionId: string, gradeData: IGradeSubmission): Promise<ISubmission> => {
  try {
    // Use the correct endpoint without the /api prefix since API_URL already includes it
    const endpoint = `/submission/${submissionId}/grade`;
    
    // Create the request data with metadata correctly structured
    const requestData = {
      ...gradeData,
      // Pass GroupName at the top level as this might be picked up by model binding
      GroupName: "Default", 
      // Keep metadata object as well for redundancy
      metadata: {
        GroupName: "Default" 
      },
      // Add notificationMetadata explicitly in case the backend looks for this property
      notificationMetadata: {
        GroupName: "Default"
      }
    };
    
    logApiCall('POST', endpoint, requestData);
    const response = await axios.post(
      `${API_URL}${endpoint}`,
      requestData,
      {
        headers: getAuthHeader()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error grading submission:', error);
    throw error;
  }
};

export const returnSubmission = async (submissionId: string, returnData: IReturnSubmission): Promise<ISubmission> => {
  try {
    // Use the correct endpoint without the /api prefix since API_URL already includes it
    const endpoint = `/assignment/${submissionId}/return`;
    
    // Create the request data with metadata correctly structured
    const requestData = {
      ...returnData,
      // Pass GroupName at the top level as this might be picked up by model binding
      GroupName: "Default", 
      // Keep metadata object as well for redundancy
      metadata: {
        GroupName: "Default" 
      },
      // Add notificationMetadata explicitly in case the backend looks for this property
      notificationMetadata: {
        GroupName: "Default"
      }
    };
    
    logApiCall('POST', endpoint, requestData);
    const response = await axios.post(
      `${API_URL}${endpoint}`,
      requestData,
      {
        headers: getAuthHeader()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error returning submission:', error);
    throw error;
  }
};

// Helper function to map status from backend enum to frontend string
export const mapStatusToText = (status: number | string): 'submitted' | 'graded' | 'returned' => {
  // If status is already a string, process it
  if (typeof status === 'string') {
    // Convert to lowercase for case-insensitive comparison
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'submitted' || statusLower === 'palautettu') {
      return 'submitted';
    }
    if (statusLower === 'graded' || statusLower === 'completed' || statusLower === 'arvioitu') {
      return 'graded';
    }
    if (statusLower === 'returned' || statusLower === 'palautettu korjattavaksi') {
      return 'returned';
    }
    
    // Default to submitted for other string values
    return 'submitted';
  }
  
  // Backend AssignmentStatus enum:
  // Draft = 0, Published = 1, InProgress = 2, Submitted = 3, Completed = 4, Returned = 5, Archived = 6
  switch (status) {
    case 0: // Draft
      return 'submitted'; // Luonnos
    case 1: // Published
      return 'submitted'; // Julkaistu
    case 2: // InProgress
      return 'submitted'; // Kesken
    case 3: // Submitted
      return 'submitted'; // Palautettu
    case 4: // Completed
      return 'graded'; // Arvioitu
    case 5: // Returned
      return 'returned'; // Palautettu opiskelijalle
    case 6: // Archived
      return 'graded'; // Arkistoitu - näytetään arvioituna, koska 'archived' ei ole tuettu tila
    default:
      return 'submitted'; // Oletuksena palautettu
  }
};

/**
 * Get the count of pending submissions that need grading
 * @param filters Optional filters to apply (courseId, teacherId, etc.)
 * @returns The number of pending submissions
 */
export const getPendingSubmissionsCount = async (filters?: Record<string, string>): Promise<number> => {
  try {
    const endpoint = `/submission/pending/count`;
    logApiCall('GET', endpoint);
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: getAuthHeader(),
      params: filters
    });
    
    return response.data.count || 0;
  } catch (error) {
    console.error('Error fetching pending submissions count:', error);
    return 0;
  }
};

export const submissionService = {
  getSubmissionsByAssignment,
  getSubmissionsByStudent,
  getSubmissionById,
  createSubmission,
  createSubmissionSimple,
  createSubmissionFull,
  updateSubmission,
  gradeSubmission,
  returnSubmission,
  getPendingSubmissionsCount,
};

export default submissionService; 