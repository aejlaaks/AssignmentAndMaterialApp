import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Divider, Chip, Grid, Button, Collapse } from '@mui/material';
import { IAssignment } from '../../services/assignments/assignmentService';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import SubmissionForm from './SubmissionForm';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { submissionService } from '../../services/assignments/submissionService';
import { UserRole } from '../../types';
import MarkdownEditor from '../common/MarkdownEditor';

interface AssignmentViewProps {
  assignment: IAssignment;
}

const AssignmentView: React.FC<AssignmentViewProps> = ({ assignment }) => {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isStudent = true; // Muutettu testausta varten
  
  useEffect(() => {
    // Debug the assignment and its status
    console.log('Assignment in detail view:', assignment);
    console.log('Status value:', assignment.status);
    
    // Tarkistetaan, onko opiskelija jo palauttanut tehtävän
    const checkSubmission = async () => {
      if (isStudent && currentUser?.id) {
        try {
          setIsLoading(true);
          const submissions = await submissionService.getSubmissionsByStudent(currentUser.id);
          const hasSubmittedAssignment = submissions.some(s => s.assignmentId === assignment.id);
          setHasSubmitted(hasSubmittedAssignment);
        } catch (error) {
          console.error('Virhe palautusten tarkistuksessa:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    checkSubmission();
  }, [assignment.id, currentUser?.id, isStudent]);

  // Add status debugging at the component level
  useEffect(() => {
    if (assignment?.status) {
      console.log('Status in AssignmentView:', assignment.status);
      console.log('Translated status:', getStatusTranslation(assignment.status));
      console.log('Status color:', getStatusColor(assignment.status));
    }
  }, [assignment.status]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP klo HH:mm', { locale: fi });
    } catch (error) {
      return dateString;
    }
  };

  const handleSubmissionComplete = () => {
    setHasSubmitted(true);
    setShowSubmissionForm(false);
  };

  // Function to translate status values
  const getStatusTranslation = (status: string) => {
    if (!status) return 'Julkaistu';
    
    // Convert to lowercase for case-insensitive comparison
    switch(status.toLowerCase()) {
      case 'published': return 'Julkaistu';
      case 'draft': return 'Luonnos';
      case 'completed': return 'Arvioitu';
      case 'submitted': return 'Palautettu';
      case 'returned': return 'Palautettu korjattavaksi';
      case 'inprogress': return 'Kesken';
      case 'archived': return 'Myöhässä';
      default: return status || 'Julkaistu';
    }
  };

  // Function to determine chip color based on status
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (!status) return 'primary';
    
    // Convert to lowercase for case-insensitive comparison
    const statusLower = status.toLowerCase();
    
    switch(statusLower) {
      case 'published': return 'primary';
      case 'draft': return 'default';
      case 'completed': return 'success';
      case 'submitted': return 'info';
      case 'returned': return 'warning';
      case 'inprogress': return 'info';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            overflowWrap: 'break-word'
          }}
        >
          {assignment.title}
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`Palautus: ${formatDate(assignment.dueDate)}`} 
            color="primary" 
            variant="outlined" 
          />
          {assignment.status && (
            <Chip 
              label={getStatusTranslation(assignment.status)} 
              color={getStatusColor(assignment.status)} 
            />
          )}
          {assignment.points && (
            <Chip 
              label={`${assignment.points} pistettä`} 
              color="secondary" 
              variant="outlined" 
            />
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Kuvaus:
        </Typography>
        <Typography variant="body1" paragraph>
          {assignment.description}
        </Typography>
        
        {assignment.contentMarkdown && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tehtävän sisältö:
            </Typography>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <MarkdownEditor 
                value={assignment.contentMarkdown} 
                onChange={() => {}} // Read-only mode
                minHeight={150}
                readOnly={true}
                initialPreviewMode={true}
                label="Tehtävän sisältö"
              />
            </Paper>
          </Box>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: '0.875rem' }}>
          <span>Luotu: {formatDate(assignment.createdAt || '')}</span>
          {assignment.updatedAt && <span>Päivitetty: {formatDate(assignment.updatedAt)}</span>}
        </Box>
        
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
          {hasSubmitted ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Chip 
                label="Olet palauttanut tämän tehtävän" 
                color="success" 
                variant="outlined" 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Voit tarkastella palautuksiasi Omat palautukset -sivulta
              </Typography>
            </Box>
          ) : (
            <>
              {showSubmissionForm ? (
                <Collapse in={showSubmissionForm}>
                  <SubmissionForm 
                    assignmentId={assignment.id} 
                    onSubmissionComplete={handleSubmissionComplete}
                  />
                </Collapse>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => setShowSubmissionForm(true)}
                  >
                    Palauta tehtävä
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </>
  );
};

export default AssignmentView; 