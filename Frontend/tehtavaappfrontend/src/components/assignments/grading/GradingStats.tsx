import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

interface GradingStatsData {
  totalGraded: number;
  averageGrade: number;
  pendingSubmissions?: number;
  gradingsByDay?: { date: string; count: number }[];
  gradingsByTeacher?: { teacherName: string; count: number }[];
}

interface GradingStatsProps {
  stats: GradingStatsData;
  loading: boolean;
}

export const GradingStats: React.FC<GradingStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssessmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Arvostelut yhteensä</Typography>
            </Box>
            <Typography variant="h3" align="center" sx={{ my: 2 }}>
              {stats.totalGraded}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Olet arvostellut yhteensä {stats.totalGraded} palautusta
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SchoolIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Keskiarvo</Typography>
            </Box>
            <Typography variant="h3" align="center" sx={{ my: 2 }}>
              {stats.averageGrade.toFixed(1)}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Antamiesi arvosanojen keskiarvo
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Odottavat palautukset</Typography>
            </Box>
            <Typography variant="h3" align="center" sx={{ my: 2 }}>
              {stats.pendingSubmissions || 0}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Arviointia odottavien palautusten määrä
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default GradingStats; 