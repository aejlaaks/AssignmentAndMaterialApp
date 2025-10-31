import { API_BASE_URL } from '../config';
import { handleApiError } from '../utils/errorHandler';
import { FeedbackAttachment } from './feedbackService';

export interface InlineComment {
  id: string;
  submissionId: string;
  teacherId: string;
  teacherName: string;
  text: string;
  startPosition: number;
  endPosition: number;
  referenceId?: string;
  referenceText?: string;
  startLine?: number;
  endLine?: number;
  createdAt: string;
  updatedAt?: string;
  attachment?: FeedbackAttachment;
}

export interface InlineCommentDTO {
  submissionId: string;
  text: string;
  startPosition: number;
  endPosition: number;
  referenceId?: string;
  referenceText?: string;
  startLine?: number;
  endLine?: number;
  attachment?: FeedbackAttachment;
}

class InlineCommentService {
  private baseUrl = `${API_BASE_URL}/inline-comments`;

  async getCommentsBySubmission(submissionId: string): Promise<InlineComment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/submission/${submissionId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error fetching inline comments');
    }
  }

  async getCommentById(id: string): Promise<InlineComment> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error fetching inline comment');
    }
  }

  async addComment(commentData: InlineCommentDTO): Promise<InlineComment> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error creating inline comment');
    }
  }

  async updateComment(id: string, commentData: Partial<InlineCommentDTO>): Promise<InlineComment> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error updating inline comment');
    }
  }

  async deleteComment(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      handleApiError(error, 'Error deleting inline comment');
      return false;
    }
  }

  async addAttachmentToComment(commentId: string, attachment: FeedbackAttachment): Promise<InlineComment> {
    try {
      const response = await fetch(`${this.baseUrl}/${commentId}/attachment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attachment),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error adding attachment to inline comment');
    }
  }

  async removeAttachmentFromComment(commentId: string): Promise<InlineComment> {
    try {
      const response = await fetch(`${this.baseUrl}/${commentId}/attachment`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Error removing attachment from inline comment');
    }
  }
}

export const inlineCommentService = new InlineCommentService(); 