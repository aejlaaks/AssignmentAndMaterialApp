import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  School as TestIcon,
  Timer as TimerIcon,
  Loop as LoopIcon,
  Score as ScoreIcon,
  EventAvailable as DateIcon,
  VisibilityOff as ProctoredIcon,
} from '@mui/icons-material';
import { TestBlock } from '../../../types/blocks';
import { testService } from '../../../services/tests';
import { useAuth } from '../../../hooks/useAuth';

interface TestBlockContentProps {
  block: TestBlock;
  showTitle?: boolean;
}

export const TestBlockContent: React.FC<TestBlockContentProps> = ({
  block,
  showTitle = true,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testInfo, setTestInfo] = useState<{
    title: string;
    description: string;
    questionCount: number;
  } | null>(null);
  const [userAttempts, setUserAttempts] = useState<number>(0);
  const [hasAvailableAttempts, setHasAvailableAttempts] = useState<boolean>(true);
  const [isTestAvailable, setIsTestAvailable] = useState<boolean>(true);

  useEffect(() => {
    const fetchTestInfo = async () => {
      if (!block.testId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get test information
        const test = await testService.getTest(block.testId);
        setTestInfo({
          title: test.Title,
          description: test.Description || '',
          questionCount: test.Questions.length,
        });
        
        // Check if the test is available based on start/end times
        if (test.StartTime || test.EndTime) {
          const now = new Date();
          
          if (test.StartTime && new Date(test.StartTime) > now) {
            setIsTestAvailable(false);
          }
          
          if (test.EndTime && new Date(test.EndTime) < now) {
            setIsTestAvailable(false);
          }
        }
        
        // Get user's attempts if a user is logged in
        if (user?.id) {
          const attempts = await testService.getTestAttempts(block.testId);
          setUserAttempts(attempts.length);
          
          // Check if user has available attempts
          if (block.attempts && attempts.length >= block.attempts) {
            setHasAvailableAttempts(false);
          }
        }
      } catch (err) {
        console.error('Error fetching test info:', err);
        setError('Failed to load test information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestInfo();
  }, [block.testId, user?.id, block.attempts]);

  const handleStartTest = async () => {
    if (!block.testId) return;
    
    try {
      setLoading(true);
      const attempt = await testService.startTestAttempt(block.testId);
      // Redirect to test taking page (would be implemented in a real app)
      console.log('Started test attempt:', attempt);
      // window.location.href = `/test/${block.testId}/attempt/${attempt.Id}`;
    } catch (err) {
      console.error('Error starting test:', err);
      setError('Failed to start test. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0'
      }}
    >
      {showTitle && (
        <Typography variant="h5" sx={{ mb: 1 }}>
          {block.title}
        </Typography>
      )}

      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TestIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            {testInfo?.title || 'Test'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {testInfo?.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {testInfo.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {testInfo?.questionCount && (
            <Chip 
              label={`${testInfo.questionCount} Questions`}
              size="small"
              color="primary"
            />
          )}
          
          {block.timeLimit && (
            <Chip 
              icon={<TimerIcon />}
              label={`${block.timeLimit} min`}
              size="small"
              color="default"
            />
          )}
          
          {block.attempts && (
            <Chip 
              icon={<LoopIcon />}
              label={`${block.attempts} attempts allowed`}
              size="small"
              color="default"
            />
          )}
          
          {block.passingScore && (
            <Chip 
              icon={<ScoreIcon />}
              label={`Passing: ${block.passingScore}%`}
              size="small"
              color="default"
            />
          )}
          
          {block.dueDate && (
            <Chip 
              icon={<DateIcon />}
              label={`Due: ${new Date(block.dueDate).toLocaleDateString()}`}
              size="small"
              color="default"
            />
          )}
          
          {block.proctored && (
            <Chip 
              icon={<ProctoredIcon />}
              label="Proctored"
              size="small"
              color="warning"
            />
          )}
        </Box>

        {user?.id && userAttempts > 0 && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            You have taken this test {userAttempts} {userAttempts === 1 ? 'time' : 'times'}
            {block.attempts && ` (${block.attempts - userAttempts} attempts remaining)`}.
          </Typography>
        )}

        {!isTestAvailable && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This test is not available yet or has expired.
          </Alert>
        )}

        {!hasAvailableAttempts && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You have used all available attempts for this test.
          </Alert>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleStartTest}
          disabled={loading || !hasAvailableAttempts || !isTestAvailable}
        >
          {loading ? <CircularProgress size={24} /> : 'Start Test'}
        </Button>
      </CardActions>
    </Card>
  );
}; 