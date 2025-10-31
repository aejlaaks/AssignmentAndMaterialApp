import { API_BASE_URL } from '../config';
import { fileUploadService } from './fileUploadService';

export interface FeedbackAttachment {
  id?: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  description?: string;
}

class FeedbackService {
  private baseUrl = `${API_BASE_URL}/submissions`;

  async addAttachment(submissionId: string, file: File, description: string = ''): Promise<FeedbackAttachment> {
    try {
      // First, upload the file
      const uploadedFile = await fileUploadService.uploadFile(file, 'feedback');
      
      // Then, associate it with the submission
      const attachment = {
        fileName: uploadedFile.fileName,
        fileType: uploadedFile.fileType,
        fileUrl: uploadedFile.fileUrl,
        fileSize: uploadedFile.fileSize,
        description
      };
      
      // Call the API to add the attachment to the submission
      const response = await fetch(`${this.baseUrl}/${submissionId}/feedback-attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(attachment)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add attachment: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding feedback attachment:', error);
      throw error;
    }
  }
  
  async removeAttachment(submissionId: string, attachmentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${submissionId}/feedback-attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove attachment: ${response.status} ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing feedback attachment:', error);
      throw error;
    }
  }
  
  async getAttachments(submissionId: string): Promise<FeedbackAttachment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submission: ${response.status} ${response.statusText}`);
      }
      
      const submission = await response.json();
      return submission.feedbackAttachments || [];
    } catch (error) {
      console.error('Error fetching feedback attachments:', error);
      throw error;
    }
  }
}

export const feedbackService = new FeedbackService(); 