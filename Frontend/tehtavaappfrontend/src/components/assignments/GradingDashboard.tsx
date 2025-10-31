import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Container
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { gradingHistoryService } from '../../services/assignments/gradingHistoryService';
import { submissionService } from '../../services/assignments/submissionService';
import { formatDate, formatShortDate } from '../../utils/dateUtils';
import {
  GradingStats,
  GradingCharts,
  GradingFilters,
  RecentActivity
} from './grading';

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface GradingDashboardProps {
  teacherId?: string; // If not provided, use current user
}

interface GradingStatsData {
  totalGraded: number;
  averageGrade: number;
  pendingSubmissions: number;
  gradingsByDay: { date: string; count: number }[];
  gradingsByTeacher: { teacherName: string; count: number }[];
  recentActivity?: { 
    id: string; 
    submissionId: string; 
    gradedById: string; 
    gradedByName: string; 
    grade: number; 
    timestamp: string;
    assignmentName?: string;
    studentName?: string;
  }[];
}

interface FilterParams {
  startDate?: string;
  endDate?: string;
  courseId?: string;
  teacherId?: string;
}

const GradingDashboard: React.FC<GradingDashboardProps> = ({ teacherId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GradingStatsData>({
    totalGraded: 0,
    averageGrade: 0,
    pendingSubmissions: 0,
    gradingsByDay: [],
    gradingsByTeacher: []
  });
  const [tabValue, setTabValue] = useState(0);
  const [courseFilter, setCourseFilter] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<FilterParams>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, [teacherId, courseFilter, startDate, endDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare filter parameters
      const params: Record<string, string> = {};
      if (teacherId) {
        params.teacherId = teacherId;
      }
      if (courseFilter) {
        params.courseId = courseFilter;
      }
      if (startDate) {
        params.startDate = startDate.format('YYYY-MM-DD');
      }
      if (endDate) {
        params.endDate = endDate.format('YYYY-MM-DD');
      }

      // Fetch grading statistics
      const data = await gradingHistoryService.getGradingStatistics(params);
      
      // Fetch recent activity
      const activity = await gradingHistoryService.getRecentActivity();
      setRecentActivity(activity);
      
      // Fetch available courses (mock data for now)
      const availableCourses = [
        { id: 'course1', name: 'Ohjelmoinnin perusteet' },
        { id: 'course2', name: 'Tietorakenteet ja algoritmit' },
        { id: 'course3', name: 'Web-ohjelmointi' }
      ];

      setStats({
        totalGraded: data.totalGraded || 0,
        averageGrade: data.averageGrade || 0,
        pendingSubmissions: data.pendingSubmissions || 0,
        gradingsByDay: data.gradingsByDay || [],
        gradingsByTeacher: data.gradingsByTeacher || [],
        recentActivity
      });

      setCourses(availableCourses);
    } catch (err) {
      console.error('Error fetching grading stats:', err);
      setError('Virhe haettaessa arviointitilastoja. Yritä uudelleen.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCourseFilterChange = (event: SelectChangeEvent) => {
    setCourseFilter(event.target.value);
  };

  const handleRefresh = () => {
    fetchStats();
  };

  const handleClearFilters = () => {
    setCourseFilter('');
    setStartDate(dayjs().subtract(30, 'day'));
    setEndDate(dayjs());
  };

  const handleViewSubmission = (submissionId: string) => {
    navigate(`/submissions/${submissionId}`);
  };

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleBatchGradingClick = () => {
    navigate('/grading/batch');
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Grading Dashboard
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <GradingFilters 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          availableCourses={courses}
          loading={loading}
        />
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <GradingStats 
          stats={stats} 
          loading={loading} 
        />
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Grading Activity
        </Typography>
        <GradingCharts 
          gradingsByDay={stats.gradingsByDay} 
          gradingsByTeacher={stats.gradingsByTeacher}
          loading={loading}
        />
      </Paper>
      
      <RecentActivity 
        activities={recentActivity} 
        loading={loading}
        onViewSubmission={handleViewSubmission}
        onBatchGradingClick={handleBatchGradingClick}
      />
    </Container>
  );
};

export default GradingDashboard; 