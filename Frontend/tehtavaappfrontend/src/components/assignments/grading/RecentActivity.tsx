import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Button
} from '@mui/material';
import {
  History as HistoryIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../../utils/dateUtils';

interface ActivityItem {
  id: string;
  submissionId: string;
  studentName?: string;
  assignmentTitle?: string;
  courseName?: string;
  grade: number;
  timestamp: string;
  gradedByName?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  loading: boolean;
  onViewSubmission?: (submissionId: string) => void;
  onBatchGradingClick?: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  loading,
  onViewSubmission,
  onBatchGradingClick
}) => {
  const navigate = useNavigate();

  const handleViewSubmission = (submissionId: string) => {
    if (onViewSubmission) {
      onViewSubmission(submissionId);
    } else {
      navigate(`/submissions/${submissionId}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Viimeisimmät arvioinnit</Typography>
          </Box>
          
          {onBatchGradingClick && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ViewListIcon />}
              onClick={onBatchGradingClick}
            >
              Eräarviointi
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />

        {activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Ei viimeaikaisia arviointeja
          </Typography>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                {index > 0 && <Divider variant="inset" component="li" />}
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewSubmission(activity.submissionId)}
                    >
                      Näytä
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">
                          {activity.studentName || 'Opiskelija'}
                        </Typography>
                        <Chip
                          label={`${activity.grade}/5`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          sx={{ display: 'block' }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {activity.assignmentTitle || 'Tehtävä'}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {activity.courseName || 'Kurssi'} • {formatDate(activity.timestamp)}
                          {activity.gradedByName && ` • Arvioija: ${activity.gradedByName}`}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity; 