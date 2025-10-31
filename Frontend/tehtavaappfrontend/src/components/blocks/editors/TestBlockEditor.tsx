import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  Grid
} from '@mui/material';
import { TestBlock } from '../../../types/blocks';
import { BlockEditorProps } from './BlockEditorProps';
import { testService } from '../../../services/tests';
import { TestDTO } from '../../../services/tests';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * Editor component for test blocks
 */
export const TestBlockEditor: React.FC<BlockEditorProps<TestBlock>> = ({
  block,
  courseId,
  onChange,
  onValidityChange
}) => {
  // State variables
  const [selectedTestId, setSelectedTestId] = useState<string>(block?.testId || '');
  const [isProctored, setIsProctored] = useState<boolean>(block?.proctored || false);
  const [showResults, setShowResults] = useState<'immediately' | 'after_due_date' | 'manual'>(
    block?.showResults || 'immediately'
  );
  const [timeLimit, setTimeLimit] = useState<number>(block?.timeLimit || 60);
  const [passingScore, setPassingScore] = useState<number>(block?.passingScore || 60);
  const [attempts, setAttempts] = useState<number>(block?.attempts || 1);
  const [dueDate, setDueDate] = useState<Date | null>(block?.dueDate ? new Date(block.dueDate) : null);
  const [allowedResources, setAllowedResources] = useState<string[]>(block?.allowedResources || []);
  
  // Loading state
  const [loadingTests, setLoadingTests] = useState<boolean>(false);
  const [availableTests, setAvailableTests] = useState<TestDTO[]>([]);
  const [newResource, setNewResource] = useState<string>('');

  // Update validity when fields change
  useEffect(() => {
    if (onValidityChange) {
      // Test blocks are valid when they have a selected test
      const isValid = !!selectedTestId;
      onValidityChange(isValid);
    }
    
    // Notify parent component about changes
    if (onChange) {
      onChange({
        testId: selectedTestId,
        proctored: isProctored,
        showResults,
        timeLimit,
        passingScore,
        attempts,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        allowedResources
      });
    }
  }, [
    selectedTestId, 
    isProctored, 
    showResults, 
    timeLimit, 
    passingScore, 
    attempts, 
    dueDate, 
    allowedResources, 
    onChange, 
    onValidityChange
  ]);

  // Fetch tests when component mounts
  useEffect(() => {
    if (courseId) {
      fetchTests();
    }
  }, [courseId]);

  // Fetch available tests
  const fetchTests = async () => {
    if (!courseId) {
      return;
    }
    
    try {
      setLoadingTests(true);
      const tests = await testService.getTestsByCourse(courseId);
      setAvailableTests(tests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setAvailableTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  // Add a new allowed resource
  const addAllowedResource = () => {
    if (newResource.trim()) {
      setAllowedResources([...allowedResources, newResource.trim()]);
      setNewResource('');
    }
  };

  // Remove an allowed resource
  const removeAllowedResource = (index: number) => {
    setAllowedResources(allowedResources.filter((_, i) => i !== index));
  };

  // Handle resource key press
  const handleResourceKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAllowedResource();
    }
  };

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="test-select-label">Test</InputLabel>
        <Select
          labelId="test-select-label"
          id="test-select"
          value={selectedTestId}
          label="Test"
          onChange={(e) => setSelectedTestId(e.target.value)}
          disabled={loadingTests}
        >
          {loadingTests ? (
            <MenuItem value="" disabled>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading tests...
              </Box>
            </MenuItem>
          ) : availableTests.length === 0 ? (
            <MenuItem value="" disabled>
              No tests available - create one first
            </MenuItem>
          ) : (
            availableTests.map((test) => (
              <MenuItem key={test.Id} value={test.Id}>
                {test.Title}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox 
            checked={isProctored}
            onChange={(e) => setIsProctored(e.target.checked)}
          />
        }
        label="Proctored Test"
        sx={{ mb: 2, display: 'block' }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="show-results-label">Show Results</InputLabel>
        <Select
          labelId="show-results-label"
          id="show-results-select"
          value={showResults}
          label="Show Results"
          onChange={(e) => setShowResults(e.target.value as 'immediately' | 'after_due_date' | 'manual')}
        >
          <MenuItem value="immediately">Immediately after submission</MenuItem>
          <MenuItem value="after_due_date">After due date</MenuItem>
          <MenuItem value="manual">Manual (teacher releases results)</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Time limit (minutes)"
        type="number"
        value={timeLimit}
        onChange={(e) => {
          const value = parseInt(e.target.value);
          setTimeLimit(isNaN(value) ? 60 : value);
        }}
        fullWidth
        margin="normal"
        InputProps={{ inputProps: { min: 1 } }}
      />

      <TextField
        label="Passing score (%)"
        type="number"
        value={passingScore}
        onChange={(e) => {
          const value = parseInt(e.target.value);
          setPassingScore(isNaN(value) ? 60 : Math.min(100, Math.max(0, value)));
        }}
        fullWidth
        margin="normal"
        InputProps={{ inputProps: { min: 0, max: 100 } }}
      />

      <TextField
        label="Maximum attempts"
        type="number"
        value={attempts}
        onChange={(e) => {
          const value = parseInt(e.target.value);
          setAttempts(isNaN(value) ? 1 : Math.max(1, value));
        }}
        fullWidth
        margin="normal"
        InputProps={{ inputProps: { min: 1 } }}
      />

      <Box sx={{ my: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            label="Due Date (optional)"
            value={dueDate}
            onChange={(newValue) => setDueDate(newValue)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </Box>

      <Box sx={{ my: 2 }}>
        <Typography variant="subtitle1">Allowed Resources</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          List of resources students are allowed to use during the test (optional)
        </Typography>
        
        <TextField
          label="Add Resource"
          value={newResource}
          onChange={(e) => setNewResource(e.target.value)}
          onKeyDown={handleResourceKeyPress}
          fullWidth
          margin="normal"
          placeholder="e.g. Textbook, Internet, Calculator"
          InputProps={{
            endAdornment: (
              <Box 
                component="button" 
                sx={{ 
                  border: 'none', 
                  background: 'none', 
                  color: 'primary.main',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  p: 0
                }}
                onClick={addAllowedResource}
              >
                Add
              </Box>
            )
          }}
        />
        
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {allowedResources.map((resource, index) => (
            <Chip
              key={index}
              label={resource}
              onDelete={() => removeAllowedResource(index)}
            />
          ))}
        </Box>
      </Box>

      {!courseId && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          A course ID is required to load tests. Please make sure you are editing content for a specific course.
        </Alert>
      )}
    </Box>
  );
}; 