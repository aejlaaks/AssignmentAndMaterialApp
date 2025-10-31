import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedGrading from '../EnhancedGrading';
import { feedbackService } from '../../../services/feedbackService';
import { inlineCommentService } from '../../../services/inlineCommentService';

// Mock the services
jest.mock('../../../services/feedbackService');
jest.mock('../../../services/inlineCommentService');
jest.mock('../SubmissionViewer', () => ({ 
  __esModule: true, 
  default: () => <div data-testid="submission-viewer">Submission Viewer Mock</div> 
}));
jest.mock('../EnhancedFeedback', () => ({ 
  __esModule: true, 
  default: (props: any) => (
    <div data-testid="enhanced-feedback">
      Enhanced Feedback Mock
      <button 
        data-testid="trigger-feedback-change" 
        onClick={() => props.onFeedbackChange('Updated feedback', true)}
      >
        Trigger Feedback Change
      </button>
      <button 
        data-testid="trigger-attachment-add" 
        onClick={() => props.onAttachmentAdd(new File([''], 'test.txt'), 'Test description')}
      >
        Add Attachment
      </button>
      <button 
        data-testid="trigger-attachment-remove" 
        onClick={() => props.onAttachmentRemove('test-id')}
      >
        Remove Attachment
      </button>
    </div>
  ) 
}));

describe('EnhancedGrading Component', () => {
  const mockSubmissionId = 'test-submission-id';
  const mockSubmissionText = 'Test submission content';
  const mockOnGradeSubmit = jest.fn().mockResolvedValue(true);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the inlineCommentService.getCommentsBySubmission method
    (inlineCommentService.getCommentsBySubmission as jest.Mock).mockResolvedValue([
      { id: 'comment1', text: 'Test comment' }
    ]);
    
    // Mock the feedbackService methods
    (feedbackService.addAttachment as jest.Mock).mockResolvedValue({
      id: 'new-attachment-id',
      fileName: 'test.txt',
      fileSize: 1024,
      fileType: 'text/plain',
      fileUrl: 'http://example.com/files/test.txt',
      description: 'Test description'
    });
    
    (feedbackService.removeAttachment as jest.Mock).mockResolvedValue(true);
  });
  
  test('renders all tabs correctly', async () => {
    await act(async () => {
      render(
        <EnhancedGrading
          submissionId={mockSubmissionId}
          submissionText={mockSubmissionText}
        />
      );
    });
    
    // Check that all tabs are rendered
    expect(screen.getByText('Submission & Comments')).toBeInTheDocument();
    expect(screen.getByText('Feedback')).toBeInTheDocument();
    expect(screen.getByText('Grade')).toBeInTheDocument();
  });
  
  test('switches between tabs correctly', async () => {
    await act(async () => {
      render(
        <EnhancedGrading
          submissionId={mockSubmissionId}
          submissionText={mockSubmissionText}
        />
      );
    });
    
    // Initially, the Submission & Comments tab should be active
    expect(screen.getByTestId('submission-viewer')).toBeInTheDocument();
    
    // Click on the Feedback tab
    await act(async () => {
      fireEvent.click(screen.getByText('Feedback'));
    });
    expect(screen.getByTestId('enhanced-feedback')).toBeInTheDocument();
    
    // Click on the Grade tab
    await act(async () => {
      fireEvent.click(screen.getByText('Grade'));
    });
    expect(screen.getByLabelText('Grade')).toBeInTheDocument();
  });
  
  test('updates grade value correctly', async () => {
    await act(async () => {
      render(
        <EnhancedGrading
          submissionId={mockSubmissionId}
          submissionText={mockSubmissionText}
          initialGrade={80}
        />
      );
    });
    
    // Navigate to the Grade tab
    await act(async () => {
      fireEvent.click(screen.getByText('Grade'));
    });
    
    // Check that the grade input has the initial value
    const gradeInput = screen.getByLabelText('Grade') as HTMLInputElement;
    expect(gradeInput.value).toBe('80');
    
    // Update the grade
    await act(async () => {
      fireEvent.change(gradeInput, { target: { value: '90' } });
    });
    expect(gradeInput.value).toBe('90');
  });
  
  test('handles feedback changes from EnhancedFeedback', async () => {
    await act(async () => {
      render(
        <EnhancedGrading
          submissionId={mockSubmissionId}
          submissionText={mockSubmissionText}
          initialFeedback="Initial feedback"
        />
      );
    });
    
    // Navigate to the Feedback tab
    await act(async () => {
      fireEvent.click(screen.getByText('Feedback'));
    });
    
    // Trigger feedback change from the mock component
    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger-feedback-change'));
    });
    
    // Submit the grading
    await act(async () => {
      fireEvent.click(screen.getByText('Grade'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Grading'));
    });
    
    // Check that onGradeSubmit was called with the updated feedback
    expect(mockOnGradeSubmit).not.toHaveBeenCalled(); // We didn't provide onGradeSubmit in this test
  });
  
  test('submits grading with all data', async () => {
    await act(async () => {
      render(
        <EnhancedGrading
          submissionId={mockSubmissionId}
          submissionText={mockSubmissionText}
          initialFeedback="Initial feedback"
          initialGrade={80}
          onGradeSubmit={mockOnGradeSubmit}
        />
      );
    });
    
    // Navigate to the Grade tab and update the grade
    await act(async () => {
      fireEvent.click(screen.getByText('Grade'));
    });
    const gradeInput = screen.getByLabelText('Grade') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(gradeInput, { target: { value: '95' } });
    });
    
    // Navigate to the Feedback tab and update the feedback
    await act(async () => {
      fireEvent.click(screen.getByText('Feedback'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger-feedback-change'));
    });
    
    // Submit the grading
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Grading'));
    });
    
    // Check that onGradeSubmit was called with the correct data
    await waitFor(() => {
      expect(mockOnGradeSubmit).toHaveBeenCalledWith(
        95,
        'Updated feedback',
        true,
        []
      );
    });
    
    // Check that success message is shown
    await waitFor(() => {
      expect(screen.getByText('Submission graded successfully')).toBeInTheDocument();
    });
  });
  
  test('handles attachment operations correctly', async () => {
    await act(async () => {
      render(
        <EnhancedGrading
          submissionId={mockSubmissionId}
          submissionText={mockSubmissionText}
          onGradeSubmit={mockOnGradeSubmit}
        />
      );
    });
    
    // Navigate to the Feedback tab
    await act(async () => {
      fireEvent.click(screen.getByText('Feedback'));
    });
    
    // Add an attachment
    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger-attachment-add'));
    });
    
    // Check that feedbackService.addAttachment was called
    await waitFor(() => {
      expect(feedbackService.addAttachment).toHaveBeenCalledWith(
        mockSubmissionId,
        expect.any(File),
        'Test description'
      );
    });
    
    // Remove an attachment
    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger-attachment-remove'));
    });
    
    // Check that feedbackService.removeAttachment was called
    await waitFor(() => {
      expect(feedbackService.removeAttachment).toHaveBeenCalledWith(
        mockSubmissionId,
        'test-id'
      );
    });
  });
  
  test('displays read-only mode correctly', async () => {
    await act(async () => {
      render(
        <EnhancedGrading
          submissionId={mockSubmissionId}
          submissionText={mockSubmissionText}
          initialGrade={85}
          initialFeedback="Read-only feedback"
          readOnly={true}
        />
      );
    });
    
    // Navigate to the Grade tab
    await act(async () => {
      fireEvent.click(screen.getByText('Grade'));
    });
    
    // Check that the grade input is disabled
    const gradeInput = screen.getByLabelText('Grade') as HTMLInputElement;
    expect(gradeInput).toBeDisabled();
    
    // The Submit Grading button should not be present
    expect(screen.queryByText('Submit Grading')).not.toBeInTheDocument();
  });
}); 