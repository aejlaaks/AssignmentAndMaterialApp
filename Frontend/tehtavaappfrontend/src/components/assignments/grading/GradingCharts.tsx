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
  BarChart as BarChartIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';

interface GradingChartsProps {
  gradingsByDay: { date: string; count: number }[];
  gradingsByTeacher?: { teacherName: string; count: number }[];
  loading: boolean;
}

export const GradingCharts: React.FC<GradingChartsProps> = ({ 
  gradingsByDay, 
  gradingsByTeacher = [], 
  loading 
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Sort and limit data for the charts
  const sortedGradingsByDay = [...gradingsByDay]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7); // Last 7 days

  const sortedGradingsByTeacher = [...gradingsByTeacher]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 teachers

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BarChartIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Arvostelut päivittäin</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            
            {sortedGradingsByDay.length > 0 ? (
              <Box sx={{ height: 250, mt: 2 }}>
                {/* This is a placeholder for a chart component */}
                {/* In a real implementation, you would use a charting library like Chart.js or Recharts */}
                <Box sx={{ 
                  display: 'flex', 
                  height: '100%', 
                  alignItems: 'flex-end',
                  justifyContent: 'space-between'
                }}>
                  {sortedGradingsByDay.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100 / sortedGradingsByDay.length}%` }}>
                      <Box 
                        sx={{ 
                          width: '80%', 
                          bgcolor: 'primary.main', 
                          height: `${(item.count / Math.max(...sortedGradingsByDay.map(d => d.count), 1)) * 200}px`,
                          minHeight: '10px'
                        }} 
                      />
                      <Typography variant="caption" sx={{ mt: 1 }}>
                        {new Date(item.date).toLocaleDateString('fi-FI', { weekday: 'short' })}
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {item.count}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ my: 4, textAlign: 'center' }}>
                Ei arviointeja viimeisen 7 päivän aikana
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PieChartIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Arvioijat</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            
            {sortedGradingsByTeacher.length > 0 ? (
              <Box sx={{ height: 250, mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* This is a placeholder for a pie chart */}
                {/* In a real implementation, you would use a charting library */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-around',
                  width: '100%'
                }}>
                  {sortedGradingsByTeacher.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '50%', 
                          bgcolor: `hsl(${index * 60}, 70%, 60%)`,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 1
                        }} 
                      >
                        <Typography variant="body2" fontWeight="bold" color="white">
                          {item.count}
                        </Typography>
                      </Box>
                      <Typography variant="caption" noWrap sx={{ maxWidth: 80, textAlign: 'center' }}>
                        {item.teacherName}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ my: 4, textAlign: 'center' }}>
                Ei arvioijatietoja näytettäväksi
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default GradingCharts; 