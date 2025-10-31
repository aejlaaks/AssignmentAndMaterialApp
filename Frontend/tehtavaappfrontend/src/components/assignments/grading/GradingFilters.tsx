import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

interface Course {
  id: string;
  name: string;
}

interface FilterParams {
  startDate?: string;
  endDate?: string;
  courseId?: string;
  teacherId?: string;
}

interface GradingFiltersProps {
  filters?: FilterParams;
  availableCourses: Course[];
  loading: boolean;
  onFilterChange: (filters: FilterParams) => void;
}

export const GradingFilters: React.FC<GradingFiltersProps> = ({
  filters = {},
  availableCourses,
  loading,
  onFilterChange
}) => {
  const [startDate, setStartDate] = useState<Dayjs | null>(
    filters.startDate ? dayjs(filters.startDate) : null
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    filters.endDate ? dayjs(filters.endDate) : null
  );
  const [selectedCourse, setSelectedCourse] = useState<string>(filters.courseId || '');

  const handleCourseChange = (event: SelectChangeEvent) => {
    const courseId = event.target.value;
    setSelectedCourse(courseId);
    onFilterChange({ ...filters, courseId });
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    setStartDate(date);
    onFilterChange({ 
      ...filters, 
      startDate: date ? date.format('YYYY-MM-DD') : undefined 
    });
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setEndDate(date);
    onFilterChange({ 
      ...filters, 
      endDate: date ? date.format('YYYY-MM-DD') : undefined 
    });
  };

  const handleRefresh = () => {
    onFilterChange({ ...filters });
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedCourse('');
    onFilterChange({});
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterIcon sx={{ mr: 1 }} color="primary" />
        <Box sx={{ flexGrow: 1 }}>Suodata arviointeja</Box>
        <Tooltip title="Päivitä">
          <span>
            <IconButton onClick={handleRefresh} size="small" disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Tyhjennä suodattimet">
          <span>
            <IconButton onClick={handleClearFilters} size="small" disabled={loading}>
              <ClearIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="course-filter-label">Kurssi</InputLabel>
            <Select
              labelId="course-filter-label"
              value={selectedCourse}
              label="Kurssi"
              onChange={handleCourseChange}
              disabled={loading}
            >
              <MenuItem value="">Kaikki kurssit</MenuItem>
              {availableCourses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Alkupäivämäärä"
              value={startDate}
              onChange={handleStartDateChange}
              slotProps={{ textField: { size: 'small', fullWidth: true, disabled: loading } }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={4}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Loppupäivämäärä"
              value={endDate}
              onChange={handleEndDateChange}
              slotProps={{ textField: { size: 'small', fullWidth: true, disabled: loading } }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GradingFilters; 