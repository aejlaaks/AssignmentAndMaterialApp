import React from 'react';
import {
  Box,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Tooltip,
  SelectChangeEvent,
  InputAdornment
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { normalizeStatus, getStatusDisplayText } from '../../../utils/submissionUtils';

interface BatchGradingFiltersProps {
  statusFilter: string;
  searchQuery: string;
  onStatusFilterChange: (event: SelectChangeEvent) => void;
  onSearchQueryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
}

const BatchGradingFilters: React.FC<BatchGradingFiltersProps> = ({
  statusFilter,
  searchQuery,
  onStatusFilterChange,
  onSearchQueryChange,
  onClearFilters,
  onRefresh
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterListIcon sx={{ mr: 1 }} color="primary" />
        <Box sx={{ flexGrow: 1 }}>Suodata palautuksia</Box>
        <Tooltip title="Päivitä">
          <IconButton onClick={onRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tyhjennä suodattimet">
          <IconButton onClick={onClearFilters} size="small">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel id="status-filter-label">Tila</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Tila"
              onChange={onStatusFilterChange}
            >
              <MenuItem value="">Kaikki</MenuItem>
              <MenuItem value="submitted">Palautettu</MenuItem>
              <MenuItem value="graded">Arvioitu</MenuItem>
              <MenuItem value="returned">Palautettu opiskelijalle</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            label="Etsi opiskelijan nimellä"
            value={searchQuery}
            onChange={onSearchQueryChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BatchGradingFilters;

 