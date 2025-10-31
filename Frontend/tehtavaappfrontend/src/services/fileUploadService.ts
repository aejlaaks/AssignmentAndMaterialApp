import { API_BASE_URL } from '../config';
import { authService } from './auth/authService';

export interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  assignmentId?: number;
  materialId?: number;
  folder?: string;
  submissionId?: string;
}

class FileUploadService {
  private baseUrl = `${API_BASE_URL}/api/files`;

  async uploadFile(file: File, folder: string = 'feedback', courseId?: string): Promise<UploadedFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      // Store the courseId in metadata instead of as a direct form field
      // With our new relationship model, we'll use the folder structure to indirectly associate with courses
      const metadata: any = {};
      
      if (courseId) {
        metadata.courseId = courseId;
        console.log(`Uploading file for course ${courseId}:`, file.name);
        
        // Instead of setting courseId directly, we'll use a folder structure that includes the course
        if (!folder.includes(`courses/${courseId}`)) {
          folder = `courses/${courseId}/${folder}`;
          formData.append('folder', folder);
        }
      }
      
      // Add metadata
      formData.append('metadata', JSON.stringify(metadata));

      // Get the JWT token
      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upload failed with status ${response.status}: ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Method to upload file with materialId
  async uploadFileForMaterial(file: File, materialId: number, folder: string = 'materials', courseId?: string): Promise<UploadedFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('materialId', materialId.toString());
      
      // Set folder with course structure if courseId is provided
      if (courseId) {
        folder = `courses/${courseId}/${folder}`;
      }
      
      formData.append('folder', folder);
      
      // Add metadata to help with file association
      formData.append('metadata', JSON.stringify({ 
        materialId: materialId,
        courseId: courseId, // Include in metadata for context
        uploadType: 'material-attachment'
      }));

      // Get the JWT token
      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Uploading file for material ${materialId}:`, file.name);
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upload failed with status ${response.status}: ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error uploading file for material ${materialId}:`, error);
      throw error;
    }
  }

  // Update method to upload file with assignmentId
  async uploadFileForAssignment(file: File, assignmentId: number, folder: string = 'assignments', courseId?: string): Promise<UploadedFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignmentId', assignmentId.toString());
      
      // Set folder with course structure if courseId is provided
      if (courseId) {
        folder = `courses/${courseId}/${folder}`;
      }
      
      formData.append('folder', folder);
      
      // Add metadata to help with file association
      formData.append('metadata', JSON.stringify({ 
        assignmentId: assignmentId,
        courseId: courseId, // Include in metadata for context
        uploadType: 'assignment-attachment'
      }));

      // Get the JWT token
      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Uploading file for assignment ${assignmentId}:`, file.name);
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upload failed with status ${response.status}: ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error uploading file for assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Get the JWT token
      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/${fileId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async getFilesBySubmission(submissionId: string): Promise<UploadedFile[]> {
    try {
      // Get the JWT token
      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/submission/${submissionId}`, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching files:', error);
      return [];
    }
  }

  async getFilesByFolder(folder: string): Promise<UploadedFile[]> {
    try {
      // Get the JWT token
      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Fetching files from folder: ${folder}`);
      const response = await fetch(`${this.baseUrl}/folder/${folder}`, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch files from folder ${folder}. Status: ${response.status}`, errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText || 'Unknown error'}`);
      }

      const files = await response.json();
      console.log(`Successfully fetched ${files.length} files from folder: ${folder}`);
      return files;
    } catch (error) {
      console.error(`Error fetching files from folder ${folder}:`, error);
      // Return empty array instead of throwing to prevent component crashes
      return [];
    }
  }

  // New method to get files by assignmentId
  async getFilesByAssignmentId(assignmentId: number): Promise<UploadedFile[]> {
    try {
      // Ensure assignmentId is a string for the API call
      const idString = assignmentId.toString().trim();
      
      // Get the JWT token
      const token = authService.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Fetching files for assignment ID: ${idString}`);
      
      // First try the direct endpoint - this should work with proper backend implementation
      try {
        const response = await fetch(`${this.baseUrl}/assignment/${idString}`, {
          headers,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch files for assignment ${idString}. Status: ${response.status}`, errorText);
          throw new Error(`API request failed: ${response.status}, Message: ${errorText || 'Unknown error'}`);
        }
        
        const files = await response.json();
        console.log(`Successfully fetched ${files.length} files for assignment ID ${idString} from API`);
        return files;
      } catch (directApiError) {
        console.error('Direct assignment files API error:', directApiError);
        // Return empty array on error
        return [];
      }
    } catch (error) {
      console.error(`Error fetching files for assignment ${assignmentId}:`, error);
      return [];
    }
  }

  // Add a function to upload bulk files with courseId
  async uploadBulkFiles(courseId: string, formData: FormData): Promise<UploadedFile[]> {
    try {
      console.log(`Processing ${formData.getAll('files').length} files for bulk upload. CourseId: ${courseId}`);
      
      // Extract files from formData to process them individually with courseId
      const files = formData.getAll('files') as File[];
      const uploadedFiles: UploadedFile[] = [];
      
      // Create a folder specific to this course for better organization
      const folder = `courses/${courseId}/materials`;
      
      // Upload each file individually
      for (const file of files) {
        try {
          console.log(`Uploading file ${file.name} to course ${courseId}`);
          
          // Use the regular uploadFile method - we're no longer directly setting CourseId
          // but instead using folder structure to associate with the course
          const response = await this.uploadFile(file, folder);
          uploadedFiles.push(response);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }
      
      if (uploadedFiles.length === 0) {
        throw new Error('No files were successfully uploaded');
      }
      
      return uploadedFiles;
    } catch (error) {
      console.error('Error during bulk upload:', error);
      throw error;
    }
  }
}

export const fileUploadService = new FileUploadService();