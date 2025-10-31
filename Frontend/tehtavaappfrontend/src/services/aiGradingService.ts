import axios from 'axios';
import { AIGradingResult, AIGradingSettings } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class AIGradingService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Generates an AI grading suggestion for a submission
   * @param submissionId The ID of the submission to grade
   * @returns AI grading result
   */
  async generateAIGrading(submissionId: string): Promise<AIGradingResult> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${this.baseURL}/submission/${submissionId}/ai-grade`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating AI grading:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to generate AI grading');
      }
      throw new Error('Failed to generate AI grading');
    }
  }

  /**
   * Applies an AI grading result to a submission
   * @param submissionId The ID of the submission
   * @param aiResult The AI grading result to apply
   * @returns Updated submission
   */
  async applyAIGrading(submissionId: string, aiResult: AIGradingResult): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${this.baseURL}/submission/${submissionId}/apply-ai-grade`,
        aiResult,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error applying AI grading:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to apply AI grading');
      }
      throw new Error('Failed to apply AI grading');
    }
  }

  /**
   * Gets the current AI grading settings
   * @returns AI grading settings
   */
  async getAIGradingSettings(): Promise<AIGradingSettings> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${this.baseURL}/admin/ai-grading-settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting AI grading settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data || 'Failed to get AI grading settings');
      }
      throw new Error('Failed to get AI grading settings');
    }
  }

  /**
   * Updates AI grading settings
   * @param settings The new AI grading settings
   * @returns Success status
   */
  async updateAIGradingSettings(settings: AIGradingSettings): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${this.baseURL}/admin/ai-grading-settings`,
        settings,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating AI grading settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data || 'Failed to update AI grading settings');
      }
      throw new Error('Failed to update AI grading settings');
    }
  }

  /**
   * Tests the AI grading service connection
   * @returns Connection test result
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${this.baseURL}/admin/ai-grading-settings/test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error testing AI grading connection:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data.message || 'Connection test failed',
        };
      }
      return {
        success: false,
        message: 'Connection test failed',
      };
    }
  }
}

// Export a singleton instance
const aiGradingService = new AIGradingService();
export default aiGradingService;

