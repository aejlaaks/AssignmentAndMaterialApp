import { submissionService, GradeSubmissionData } from '../submissionService';
import { FeedbackAttachment } from '../feedbackService';

// Mock fetch
global.fetch = jest.fn();

describe('submissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('gradeSubmission', () => {
    test('should call the API with correct parameters', async () => {
      // Arrange
      const mockSubmissionId = 'test-submission-id';
      const mockGradeData: GradeSubmissionData = {
        grade: 85,
        feedback: 'Great work!',
        isRichTextFeedback: true
      };

      const mockResponse = {
        id: mockSubmissionId,
        grade: 85,
        feedbackText: 'Great work!',
        isRichTextFeedback: true,
        status: 2, // Graded
        gradedAt: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await submissionService.gradeSubmission(mockSubmissionId, mockGradeData);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/${mockSubmissionId}/grade`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(mockGradeData)
        })
      );

      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors correctly', async () => {
      // Arrange
      const mockSubmissionId = 'test-submission-id';
      const mockGradeData: GradeSubmissionData = {
        grade: 85,
        feedback: 'Great work!',
        isRichTextFeedback: true
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      // Act & Assert
      await expect(submissionService.gradeSubmission(mockSubmissionId, mockGradeData))
        .rejects
        .toThrow('HTTP error! Status: 500');
    });

    test('should handle network errors correctly', async () => {
      // Arrange
      const mockSubmissionId = 'test-submission-id';
      const mockGradeData: GradeSubmissionData = {
        grade: 85,
        feedback: 'Great work!',
        isRichTextFeedback: true
      };

      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      // Act & Assert
      await expect(submissionService.gradeSubmission(mockSubmissionId, mockGradeData))
        .rejects
        .toThrow('Network error');
    });

    test('should handle grading with attachments', async () => {
      // Arrange
      const mockSubmissionId = 'test-submission-id';
      const mockAttachment: FeedbackAttachment = {
        id: 'attachment-1',
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        fileUrl: 'http://example.com/files/test.pdf',
        description: 'Test attachment'
      };
      
      const mockGradeData: GradeSubmissionData = {
        grade: 85,
        feedback: 'Great work!',
        isRichTextFeedback: true,
        attachments: [mockAttachment]
      };

      const mockResponse = {
        id: mockSubmissionId,
        grade: 85,
        feedbackText: 'Great work!',
        isRichTextFeedback: true,
        status: 2, // Graded
        gradedAt: new Date().toISOString(),
        feedbackAttachments: [mockAttachment]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await submissionService.gradeSubmission(mockSubmissionId, mockGradeData);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/${mockSubmissionId}/grade`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockGradeData)
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.feedbackAttachments).toEqual(mockGradeData.attachments);
    });

    test('should handle grading without a grade value', async () => {
      // Arrange
      const mockSubmissionId = 'test-submission-id';
      const mockGradeData: Omit<GradeSubmissionData, 'grade'> & { grade?: number } = {
        feedback: 'Feedback only, no grade',
        isRichTextFeedback: false
      };

      const mockResponse = {
        id: mockSubmissionId,
        grade: null,
        feedbackText: 'Feedback only, no grade',
        isRichTextFeedback: false,
        status: 2, // Graded
        gradedAt: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await submissionService.gradeSubmission(mockSubmissionId, mockGradeData as GradeSubmissionData);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/${mockSubmissionId}/grade`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockGradeData)
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.grade).toBeNull();
    });
  });
}); 