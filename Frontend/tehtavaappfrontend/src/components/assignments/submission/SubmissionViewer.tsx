import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Grade as GradeIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { ISubmission } from '../../../services/assignments/submissionService';
import { formatDate } from '../../../utils/dateUtils';
import { normalizeStatus, getStatusDisplayText, getStatusColor } from '../../../utils/submissionUtils';

interface SubmissionViewerProps {
  submission: ISubmission | null;
  loading?: boolean;
  error?: string | null;
  onEdit?: () => void;
  onDownloadFile?: (fileId: string, fileName: string) => void;
}

const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
  submission,
  loading = false,
  error = null,
  onEdit,
  onDownloadFile
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!submission) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Palautusta ei löytynyt.
      </Alert>
    );
  }

  // Allow editing if:
  // 1. The submission is not graded/returned, OR
  // 2. The submission requires revision (even if graded)
  const canEdit = (submission.status !== 'graded' && submission.status !== 'returned') || submission.requiresRevision;
  const hasFiles = submission.submittedMaterials && submission.submittedMaterials.length > 0;

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Palautus
        </Typography>
        
        {canEdit && onEdit && (
          <Button
            variant={submission.requiresRevision ? "contained" : "outlined"}
            color={submission.requiresRevision ? "warning" : "primary"}
            startIcon={<EditIcon />}
            onClick={onEdit}
          >
            {submission.requiresRevision ? "Tee korjaukset" : "Muokkaa"}
          </Button>
        )}
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              Palautettu: {formatDate(submission.submittedAt)}
            </Typography>
          </Box>
          
          {submission.isLate && (
            <Typography variant="body2" color="error" sx={{ ml: 3 }}>
              Myöhästynyt palautus
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              Opiskelija: {submission.studentName || 'Tuntematon'}
            </Typography>
          </Box>
          
          {submission.attemptNumber > 1 && (
            <Typography variant="body2" sx={{ ml: 3 }}>
              Yritys #{submission.attemptNumber}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip 
              label={getStatusDisplayText(submission.status)}
              color={getStatusColor(submission.status)}
              size="small"
            />
            
            {submission.requiresRevision && (
              <Chip 
                label="Vaatii korjauksia"
                color="warning"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          
          {submission.grade !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GradeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Arvosana: {submission.grade}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
      
      {submission.requiresRevision && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Tämä palautus vaatii korjauksia. {submission.revisionDueDate && 
            `Korjaukset tulee tehdä viimeistään ${formatDate(submission.revisionDueDate)}.`}
        </Alert>
      )}
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Palautuksen sisältö:
      </Typography>
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: 'background.default',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word'
        }}
      >
        <Typography variant="body1">
          {submission.submissionText || 'Ei tekstisisältöä'}
        </Typography>
      </Paper>
      
      {hasFiles && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Liitetiedostot:
          </Typography>
          <List>
            {submission.submittedMaterials && submission.submittedMaterials.map((file: any) => (
              <ListItem key={file.id} divider>
                <ListItemIcon>
                  <FileIcon />
                </ListItemIcon>
                <ListItemText
                  primary={file.fileName}
                  secondary={file.fileType}
                />
                {onDownloadFile && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => onDownloadFile(file.id, file.fileName)}
                  >
                    Lataa
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </>
      )}
      
      {submission.feedbackText && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CommentIcon sx={{ mr: 1 }} />
              Palaute:
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                bgcolor: 'background.default',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word'
              }}
            >
              <Typography variant="body1">
                {submission.feedbackText}
              </Typography>
            </Paper>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SubmissionViewer; 