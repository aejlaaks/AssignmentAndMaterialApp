import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { testService } from '../services/tests';
import {
  TestDTO,
  CreateTestDTO,
  UpdateTestDTO,
  QuestionDTO,
  CreateQuestionDTO,
  UpdateQuestionDTO
} from '../services/tests/testTypes';
import { useAuth } from '../hooks/useAuth';

interface TestManagementProps {
  create?: boolean;
  edit?: boolean;
}

const TestManagement = ({ create = false, edit = false }: TestManagementProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState<TestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestDTO | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  // For the test form
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    timeLimit: string;
    passingScore: string;
    attempts: string;
    isVisible: boolean;
    dueDate: string;
    proctored: boolean;
    showResults: string;
    allowedResources: string[];
  }>({
    title: '',
    description: '',
    timeLimit: '',
    passingScore: '',
    attempts: '',
    isVisible: true,
    dueDate: '',
    proctored: false,
    showResults: 'AfterSubmission',
    allowedResources: [],
  });

  // For questions
  const [questions, setQuestions] = useState<CreateQuestionDTO[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CreateQuestionDTO>({
    Text: '',
    Type: 'MultipleChoice',
    Points: 0,
    Order: 0,
  });
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);

  useEffect(() => {
    if (!create && !edit) {
      fetchTests();
    } else if (edit && id) {
      fetchTest(id);
    }
  }, [create, edit, id]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      // Use mock data for now until the API is implemented
      setTests([]);
      setError(null);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Failed to load tests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTest = async (testId: string) => {
    try {
      setLoading(true);
      const testData = await testService.getTest(testId) as unknown as TestDTO;
      setSelectedTest(testData as TestDTO);
      setFormData({
        title: testData.Title,
        description: testData.Description || '',
        timeLimit: testData.TimeLimit?.toString() || '',
        passingScore: testData.PassingScore?.toString() || '',
        attempts: testData.Attempts?.toString() || '',
        isVisible: testData.IsVisible,
        dueDate: testData.DueDate ? new Date(testData.DueDate).toISOString().slice(0, 16) : '',
        proctored: testData.Proctored,
        showResults: testData.ShowResults,
        allowedResources: testData.AllowedResources || [],
      });
      
      // Transform API question format to form format
      const formattedQuestions = testData.Questions.map(q => ({
        Text: q.Text,
        Type: q.Type,
        Points: q.Points,
        Order: q.Order,
        Explanation: q.Explanation || '',
        Options: q.Options?.map(o => ({
          Text: o.Text,
          IsCorrect: o.IsCorrect,
        })) || [],
        TestCases: q.TestCases?.map(t => ({
          Input: t.Input,
          ExpectedOutput: t.ExpectedOutput,
          IsHidden: t.IsHidden,
        })) || [],
        CodeTemplate: q.CodeTemplate || '',
        CodeLanguage: q.CodeLanguage || '',
      }));
      setQuestions(formattedQuestions);
      setError(null);
    } catch (err) {
      console.error('Error fetching test:', err);
      setError('Failed to load test. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleEditTest = (test: TestDTO) => {
    navigate(`/tests/${test.Id}/edit`);
  };

  const handleDeleteClick = (testId: string) => {
    setTestToDelete(testId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTest = async () => {
    if (!testToDelete) return;

    try {
      await testService.deleteTest(testToDelete);
      fetchTests();
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    } catch (err) {
      console.error('Error deleting test:', err);
      setError('Failed to delete test. Please try again later.');
    }
  };

  // Add a utility function to prepare questions with all required fields
  const prepareQuestionsForSubmission = (questions: CreateQuestionDTO[]): UpdateQuestionDTO[] => {
    return questions.map((question, qIndex) => {
      // Set a unique ID for each question if creating new ones
      const questionId = (question as any).Id || `temp-question-id-${qIndex}`;
      
      // Prepare options with IDs
      const optionsWithIds = (question.Options || []).map((option: any, oIndex) => {
        return {
          ...option,
          Id: option.Id || `temp-option-id-${qIndex}-${oIndex}`, // Create temporary ID if not exists
          Text: option.Text || `Option ${oIndex + 1}`, // Ensure Text is not empty
          IsCorrect: typeof option.IsCorrect === 'boolean' ? option.IsCorrect : false, // Ensure IsCorrect is set
          QuestionId: questionId // Ensure QuestionId is set for foreign key constraint
        };
      });
      
      // Ensure we have at least one option for multiple choice questions
      if ((question.Type === 'MultipleChoice' || question.Type === 'SingleChoice') && 
          (!optionsWithIds || optionsWithIds.length === 0)) {
        optionsWithIds.push(
          { Id: `temp-option-${qIndex}-default-1`, Text: 'Option 1', IsCorrect: false, QuestionId: questionId },
          { Id: `temp-option-${qIndex}-default-2`, Text: 'Option 2', IsCorrect: false, QuestionId: questionId }
        );
      }
      
      return {
        ...question,
        Id: questionId,
        Text: question.Text || `Question ${qIndex + 1}`, // Ensure Text is not empty
        Type: question.Type || 'MultipleChoice', // Ensure Type is set
        Points: question.Points || 1, // Ensure Points is set
        Order: question.Order || (qIndex + 1), // Ensure Order is set
        Explanation: question.Explanation || "", // Default to empty string if missing
        CodeLanguage: question.CodeLanguage || "none", // Default value
        CodeTemplate: question.CodeTemplate || "", // Default empty template
        Options: optionsWithIds,
        // Add any other required fields here
        QuestionType: question.Type || 'MultipleChoice' // For compatibility with the backend model
      } as UpdateQuestionDTO;
    });
  };

  // Update handleAddQuestion to include all required fields
  const handleAddQuestion = () => {
    setCurrentQuestion({
      Text: '',
      Type: 'MultipleChoice', // Always set a default question type
      Points: 1,
      Order: questions.length + 1,
      Explanation: '', 
      CodeLanguage: 'none', // Ensure CodeLanguage is not null
      CodeTemplate: '',
      Options: [
        { Text: 'Option 1', IsCorrect: false },
        { Text: 'Option 2', IsCorrect: false },
        { Text: 'Option 3', IsCorrect: false },
        { Text: 'Option 4', IsCorrect: false }
      ],
    } as CreateQuestionDTO);
    setQuestionDialogOpen(true);
  };

  // Update handleSaveTest to handle AllowedResources and CodeLanguage correctly
  const handleSaveTest = async () => {
    try {
      // Prepare questions with all required fields
      const completeQuestions = prepareQuestionsForSubmission(questions);
      
      // Create temporary IDs for questions if they don't have one
      const questionsWithIds = completeQuestions.map((question, index) => ({
        ...question,
        // Use temporary ID for reference within this request
        _tempId: question.Id || `temp-question-${index}`
      }));
      
      const testData = {
        Title: formData.title,
        Description: formData.description,
        Proctored: formData.proctored,
        ShowResults: formData.showResults || 'AfterSubmission', // Ensure ShowResults is set
        TimeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : 0,
        PassingScore: formData.passingScore ? parseInt(formData.passingScore) : 0,
        Attempts: formData.attempts ? parseInt(formData.attempts) : 1,
        DueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        // Ensure AllowedResources is formatted correctly for the backend
        AllowedResources: formData.allowedResources || [],
        IsVisible: formData.isVisible,
        Questions: questionsWithIds.map(question => {
          // Ensure all question properties are set
          return {
            ...question,
            // Make sure Options all have QuestionId set to new temporary ID
            Options: (question.Options || []).map(option => ({
              ...option,
              QuestionId: question._tempId // Make sure the foreign key is properly set
            })),
            // Ensure CodeLanguage is never null/undefined
            CodeLanguage: question.CodeLanguage || 'none',
            // Ensure Explanation is never null/undefined
            Explanation: question.Explanation || '',
            // Ensure CodeTemplate is never null/undefined
            CodeTemplate: question.CodeTemplate || '',
          };
        })
      };

      console.log('Saving test data:', JSON.stringify(testData));

      if (edit && id) {
        // Use any to bypass type checking
        await testService.updateTest(id, testData as any);
      } else {
        // Use any to bypass type checking
        await testService.createTest(testData as any);
      }

      navigate('/tests');
    } catch (err) {
      console.error('Error saving test:', err);
      setError('Failed to save test. Please try again later.');
    }
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion) return;

    // Validate question before saving
    const validationError = validateQuestion(currentQuestion);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Ensure all required fields are set
    const completeQuestion = {
      ...currentQuestion,
      Explanation: currentQuestion.Explanation || '', // Ensure Explanation exists
      CodeLanguage: currentQuestion.CodeLanguage || 'none', // Ensure CodeLanguage exists
      CodeTemplate: currentQuestion.CodeTemplate || '', // Ensure CodeTemplate exists
    };

    // Add IDs to options if needed
    if (completeQuestion.Options && completeQuestion.Options.length > 0) {
      completeQuestion.Options = completeQuestion.Options.map((option, index) => ({
        ...option,
        Id: (option as any).Id || `temp-option-${Date.now()}-${index}`,
      }));
    }

    // Add new question or update existing one
    const currentQuestionAny = completeQuestion as any;
    if (currentQuestionAny.Id) {
      // Edit existing question
      setQuestions(questions.map(q => {
        const qAny = q as any;
        return qAny.Id === currentQuestionAny.Id ? completeQuestion : q;
      }));
    } else {
      // Add new question with a temporary ID
      currentQuestionAny.Id = `temp-question-${Date.now()}`;
      setQuestions([...questions, completeQuestion]);
    }
    
    setQuestionDialogOpen(false);
    setCurrentQuestion({
      Text: '',
      Type: 'MultipleChoice', // Set default type
      Points: 1,
      Order: questions.length + 2, // Next in sequence
      Explanation: '',
      CodeLanguage: 'none',
      CodeTemplate: '',
      Options: [
        { Text: 'Option 1', IsCorrect: false },
        { Text: 'Option 2', IsCorrect: false },
      ],
    });
    setError(null);
  };

  // Validate question based on type
  const validateQuestion = (question: CreateQuestionDTO): string | null => {
    if (!question.Text.trim()) {
      return "Question text is required";
    }

    switch (question.Type) {
      case 'MultipleChoice':
      case 'MultipleSelect':
        if (!question.Options || question.Options.length < 2) {
          return "At least 2 options are required";
        }
        if (!question.Options.some(opt => opt.IsCorrect)) {
          return "At least one correct option is required";
        }
        if (question.Type === 'MultipleChoice' && 
            question.Options.filter(opt => opt.IsCorrect).length > 1) {
          return "Multiple choice questions can only have one correct answer";
        }
        break;
      case 'TrueFalse':
        if (!question.Options || question.Options.length !== 2) {
          return "True/False questions must have exactly 2 options";
        }
        break;
    }

    return null; // No validation errors
  };

  const handleQuestionTypeChange = (type: string): void => {
    // Create a typed updated question to avoid type errors
    const updatedQuestion: CreateQuestionDTO = {
      ...currentQuestion,
      Type: type,
      CodeLanguage: currentQuestion.CodeLanguage || 'none', // Ensure CodeLanguage is not null
      Explanation: currentQuestion.Explanation || '', // Ensure Explanation is not null
      CodeTemplate: currentQuestion.CodeTemplate || '', // Ensure CodeTemplate is not null
      Options: [...(currentQuestion.Options || [])] // Clone options array to avoid mutation
    };
    
    // Reset or initialize type-specific fields
    switch(type) {
      case 'MultipleChoice':
        if (!updatedQuestion.Options || updatedQuestion.Options.length === 0) {
          updatedQuestion.Options = [
            { Text: 'Option 1', IsCorrect: true },
            { Text: 'Option 2', IsCorrect: false }
          ];
        } else {
          // Ensure only one option is marked as correct
          const hasCorrect = updatedQuestion.Options.some(opt => opt.IsCorrect);
          updatedQuestion.Options = updatedQuestion.Options.map((opt, index) => ({
            ...opt,
            IsCorrect: !hasCorrect && index === 0 ? true : opt.IsCorrect
          }));
          
          // If multiple correct options, keep only the first one
          let foundCorrect = false;
          updatedQuestion.Options = updatedQuestion.Options.map(opt => {
            if (opt.IsCorrect) {
              if (foundCorrect) {
                return { ...opt, IsCorrect: false };
              }
              foundCorrect = true;
            }
            return opt;
          });
        }
        break;
      case 'MultipleSelect':
        if (!updatedQuestion.Options || updatedQuestion.Options.length === 0) {
          updatedQuestion.Options = [
            { Text: 'Option 1', IsCorrect: true },
            { Text: 'Option 2', IsCorrect: false }
          ];
        }
        break;
      case 'TrueFalse':
        updatedQuestion.Options = [
          { Text: 'True', IsCorrect: true },
          { Text: 'False', IsCorrect: false }
        ];
        break;
      case 'ShortAnswer':
      case 'Essay':
        // Clear options as they're not needed
        updatedQuestion.Options = [];
        break;
    }
    
    setCurrentQuestion(updatedQuestion);
  };

  const handleAddOption = () => {
    if (!currentQuestion.Options) return;
    
    setCurrentQuestion({
      ...currentQuestion,
      Options: [
        ...currentQuestion.Options,
        { Text: `Option ${currentQuestion.Options.length + 1}`, IsCorrect: false }
      ]
    });
  };

  const handleRemoveOption = (index: number) => {
    if (!currentQuestion.Options) return;
    
    const newOptions = [...currentQuestion.Options];
    newOptions.splice(index, 1);
    
    setCurrentQuestion({
      ...currentQuestion,
      Options: newOptions
    });
  };

  const handleOptionTextChange = (index: number, text: string) => {
    if (!currentQuestion.Options) return;
    
    const newOptions = [...currentQuestion.Options];
    newOptions[index] = { ...newOptions[index], Text: text };
    
    setCurrentQuestion({
      ...currentQuestion,
      Options: newOptions
    });
  };

  const handleOptionCorrectChange = (index: number, isCorrect: boolean) => {
    if (!currentQuestion.Options) return;
    
    const newOptions = [...currentQuestion.Options];
    
    // For multiple choice, only one option can be correct
    if (currentQuestion.Type === 'MultipleChoice' && isCorrect) {
      newOptions.forEach((opt, i) => {
        newOptions[i] = { ...opt, IsCorrect: i === index };
      });
    } else {
      newOptions[index] = { ...newOptions[index], IsCorrect: isCorrect };
    }
    
    setCurrentQuestion({
      ...currentQuestion,
      Options: newOptions
    });
  };

  const handleEditQuestion = (question: CreateQuestionDTO, index: number) => {
    setCurrentQuestion({
      ...question,
      Id: selectedTest?.Questions[index]?.Id,
    } as CreateQuestionDTO & { Id?: string });
    setQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  if (loading && !create) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (create || edit) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton
            onClick={() => navigate('/tests')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {edit ? 'Edit Test' : 'Create New Test'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Test Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dueDate"
                label="Due Date"
                type="datetime-local"
                value={formData.dueDate}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="timeLimit"
                label="Time Limit (minutes)"
                type="number"
                value={formData.timeLimit}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="passingScore"
                label="Passing Score (%)"
                type="number"
                value={formData.passingScore}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="attempts"
                label="Allowed Attempts"
                type="number"
                value={formData.attempts}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Show Results</InputLabel>
                <Select
                  name="showResults"
                  value={formData.showResults}
                  onChange={handleSelectChange}
                  label="Show Results"
                >
                  <MenuItem value="AfterSubmission">After Submission</MenuItem>
                  <MenuItem value="AfterDueDate">After Due Date</MenuItem>
                  <MenuItem value="Never">Never</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="proctored"
                    checked={formData.proctored}
                    onChange={handleCheckboxChange}
                  />
                }
                label="Proctored Exam"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isVisible"
                    checked={formData.isVisible}
                    onChange={handleCheckboxChange}
                  />
                }
                label="Visible to students"
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Questions ({questions.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
            >
              Add Question
            </Button>
          </Box>

          {questions.length === 0 ? (
            <Alert severity="info">
              No questions added yet. Click the "Add Question" button to create questions.
            </Alert>
          ) : (
            <List>
              {questions.map((question, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        onClick={() => handleEditQuestion(question, index)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteQuestion(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                  divider
                >
                  <ListItemText
                    primary={`Q${index + 1}: ${question.Text || 'Untitled Question'}`}
                    secondary={`Type: ${question.Type} - Points: ${question.Points}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="outlined"
            onClick={() => navigate('/tests')}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTest}
            disabled={!formData.title || questions.length === 0}
          >
            Save Test
          </Button>
        </Box>

        {/* Question Dialog */}
        <Dialog
          open={questionDialogOpen}
          onClose={() => setQuestionDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {(currentQuestion as any).Id ? 'Edit Question' : 'Add Question'}
          </DialogTitle>
          <DialogContent>
            {currentQuestion && (
              <Box sx={{ mt: 2 }}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
              
                <TextField
                  label="Question Text"
                  value={currentQuestion.Text}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    Text: e.target.value,
                  })}
                  fullWidth
                  required
                  margin="normal"
                />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Question Type</InputLabel>
                  <Select
                    value={currentQuestion.Type}
                    onChange={(e) => handleQuestionTypeChange(e.target.value as string)}
                    label="Question Type"
                  >
                    <MenuItem value="MultipleChoice">Multiple Choice</MenuItem>
                    <MenuItem value="MultipleSelect">Multiple Select</MenuItem>
                    <MenuItem value="TrueFalse">True/False</MenuItem>
                    <MenuItem value="ShortAnswer">Short Answer</MenuItem>
                    <MenuItem value="Essay">Essay</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label="Points"
                  type="number"
                  value={currentQuestion.Points}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    Points: parseInt(e.target.value) || 1,
                  })}
                  fullWidth
                  margin="normal"
                  InputProps={{ inputProps: { min: 1 } }}
                />
                
                {/* Options for Multiple Choice, Multiple Select, and True/False */}
                {['MultipleChoice', 'MultipleSelect', 'TrueFalse'].includes(currentQuestion.Type) && (
                  <Box sx={{ mt: 3, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1">
                        {currentQuestion.Type === 'TrueFalse' ? 'Options' : 
                         currentQuestion.Type === 'MultipleChoice' ? 'Options (select one correct answer)' : 
                         'Options (select all correct answers)'}
                      </Typography>
                      
                      {currentQuestion.Type !== 'TrueFalse' && (
                        <Button 
                          size="small" 
                          startIcon={<AddIcon />} 
                          onClick={handleAddOption}
                          disabled={currentQuestion.Options && currentQuestion.Options.length >= 10}
                        >
                          Add Option
                        </Button>
                      )}
                    </Box>
                    
                    {currentQuestion.Options?.map((option, index) => (
                      <Box key={index} display="flex" alignItems="center" mb={1}>
                        <Checkbox
                          checked={option.IsCorrect}
                          onChange={(e) => handleOptionCorrectChange(index, e.target.checked)}
                          disabled={currentQuestion.Type === 'TrueFalse' && index === 0 && option.IsCorrect}
                          sx={{ mr: 1 }}
                        />
                        <TextField
                          value={option.Text}
                          onChange={(e) => handleOptionTextChange(index, e.target.value)}
                          fullWidth
                          size="small"
                          disabled={currentQuestion.Type === 'TrueFalse'}
                        />
                        {currentQuestion.Type !== 'TrueFalse' && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveOption(index)}
                            disabled={!currentQuestion.Options || currentQuestion.Options.length <= 2}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveQuestion}
              color="primary"
              variant="contained"
            >
              Save Question
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Test Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tests/create')}
        >
          Create New Test
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {tests.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No tests found
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Create your first test to get started.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/tests/create')}
            >
              Create New Test
            </Button>
          </Box>
        ) : (
          <List>
            {tests.map((test) => (
              <ListItem
                key={test.Id}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditTest(test)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteClick(test.Id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
                divider
              >
                <ListItemText
                  primary={test.Title}
                  secondary={
                    <Typography variant="body2" component="div">
                      {test.Description}
                      <Box mt={1}>
                        <Typography variant="caption" component="span" sx={{ mr: 2 }}>
                          Questions: {test.Questions.length}
                        </Typography>
                        {test.TimeLimit && (
                          <Typography variant="caption" component="span" sx={{ mr: 2 }}>
                            Time Limit: {test.TimeLimit} min
                          </Typography>
                        )}
                        {test.DueDate && (
                          <Typography variant="caption" component="span">
                            Due: {new Date(test.DueDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Test</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this test? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTest} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestManagement; 