import { type FC, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Paper,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { NotificationType, NotificationPriority } from '../../types';

interface NotificationFiltersProps {
  onApplyFilters: (filters: {
    types: NotificationType[];
    priority: NotificationPriority[];
    read?: boolean;
    archived?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) => void;
  onClearFilters: () => void;
  defaultFilters?: {
    types: NotificationType[];
    priority: NotificationPriority[];
    read?: boolean;
    archived?: boolean;
    startDate?: Date;
    endDate?: Date;
  };
}

export const NotificationFilters: FC<NotificationFiltersProps> = ({
  onApplyFilters,
  onClearFilters,
  defaultFilters = { types: [], priority: [] },
}) => {
  const [types, setTypes] = useState<NotificationType[]>(defaultFilters.types || []);
  const [priorities, setPriorities] = useState<NotificationPriority[]>(defaultFilters.priority || []);
  const [showRead, setShowRead] = useState<boolean | undefined>(defaultFilters.read);
  const [showArchived, setShowArchived] = useState<boolean | undefined>(defaultFilters.archived);
  const [startDate, setStartDate] = useState<Date | null>(defaultFilters.startDate || null);
  const [endDate, setEndDate] = useState<Date | null>(defaultFilters.endDate || null);

  useEffect(() => {
    setTypes(defaultFilters.types || []);
    setPriorities(defaultFilters.priority || []);
    setShowRead(defaultFilters.read);
    setShowArchived(defaultFilters.archived);
    setStartDate(defaultFilters.startDate || null);
    setEndDate(defaultFilters.endDate || null);
  }, [defaultFilters]);

  const handleTypeToggle = (type: NotificationType) => {
    setTypes((prevTypes) =>
      prevTypes.includes(type)
        ? prevTypes.filter((t) => t !== type)
        : [...prevTypes, type]
    );
  };

  const handlePriorityToggle = (priority: NotificationPriority) => {
    setPriorities((prevPriorities) =>
      prevPriorities.includes(priority)
        ? prevPriorities.filter((p) => p !== priority)
        : [...prevPriorities, priority]
    );
  };

  const handleApply = () => {
    onApplyFilters({
      types,
      priority: priorities,
      read: showRead,
      archived: showArchived,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleClear = () => {
    setTypes([]);
    setPriorities([]);
    setShowRead(undefined);
    setShowArchived(undefined);
    setStartDate(null);
    setEndDate(null);
    onClearFilters();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Notification Type
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={types.includes(NotificationType.Info)}
                onChange={() => handleTypeToggle(NotificationType.Info)}
                size="small"
              />
            }
            label="Info"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={types.includes(NotificationType.Success)}
                onChange={() => handleTypeToggle(NotificationType.Success)}
                size="small"
              />
            }
            label="Success"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={types.includes(NotificationType.Warning)}
                onChange={() => handleTypeToggle(NotificationType.Warning)}
                size="small"
              />
            }
            label="Warning"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={types.includes(NotificationType.Error)}
                onChange={() => handleTypeToggle(NotificationType.Error)}
                size="small"
              />
            }
            label="Error"
          />
        </FormGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Priority
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={priorities.includes(NotificationPriority.High)}
                onChange={() => handlePriorityToggle(NotificationPriority.High)}
                size="small"
              />
            }
            label="High"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={priorities.includes(NotificationPriority.Medium)}
                onChange={() => handlePriorityToggle(NotificationPriority.Medium)}
                size="small"
              />
            }
            label="Medium"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={priorities.includes(NotificationPriority.Low)}
                onChange={() => handlePriorityToggle(NotificationPriority.Low)}
                size="small"
              />
            }
            label="Low"
          />
        </FormGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Status
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={showRead === true}
                onChange={() => setShowRead((prev) => (prev === true ? undefined : true))}
                size="small"
              />
            }
            label="Read"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showArchived === true}
                onChange={() => setShowArchived((prev) => (prev === true ? undefined : true))}
                size="small"
              />
            }
            label="Archived"
          />
        </FormGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Date Range
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <DatePicker
              label="From"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label="To"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>
        </LocalizationProvider>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={handleClear} size="small">
          Clear All
        </Button>
        <Button variant="contained" onClick={handleApply} size="small">
          Apply Filters
        </Button>
      </Box>
    </Paper>
  );
};
