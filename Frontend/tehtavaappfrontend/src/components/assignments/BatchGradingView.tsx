import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { ISubmission as ServiceSubmission, submissionService, IGradeSubmission } from '../../services/assignments/submissionService';
import {
  BatchGradingFilters,
  BatchGradingForm,
  BatchGradingConfirmDialog,
  SubmissionTable
} from './grading';

// Define the interface expected by the SubmissionTable component
interface TableSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  content: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
}

interface BatchGradingViewProps {
  assignmentId: string;
  onGradingComplete?: () => void;
}

interface SortConfig {
  key: keyof TableSubmission;
  direction: 'asc' | 'desc';
}

// Adapter function to convert from service model to table model
const adaptSubmission = (submission: ServiceSubmission): TableSubmission => ({
  id: submission.id,
  assignmentId: submission.assignmentId,
  studentId: submission.studentId,
  studentName: submission.studentName,
  content: submission.submissionText || '', // Map submissionText to content
  submittedAt: submission.submittedAt,
  status: submission.status,
  grade: submission.grade,
  feedback: submission.feedbackText
});

const BatchGradingView: React.FC<BatchGradingViewProps> = ({
  assignmentId,
  onGradingComplete
}) => {
  // Submissions state
  const [submissions, setSubmissions] = useState<ServiceSubmission[]>([]);
  const [adaptedSubmissions, setAdaptedSubmissions] = useState<TableSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<TableSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  
  // Batch grading state
  const [batchGrade, setBatchGrade] = useState('');
  const [batchFeedback, setBatchFeedback] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [gradingInProgress, setGradingInProgress] = useState(false);
  
  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting and pagination
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'submittedAt', direction: 'desc' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Fetch submissions on component mount
  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  // Adapt submissions when they change
  useEffect(() => {
    const adapted = submissions.map(adaptSubmission);
    setAdaptedSubmissions(adapted);
  }, [submissions]);

  // Apply filters and sorting when dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [adaptedSubmissions, statusFilter, searchQuery, sortConfig]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await submissionService.getSubmissionsByAssignment(assignmentId);
      setSubmissions(data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Palautusten hakeminen epäonnistui. Yritä uudelleen.');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...adaptedSubmissions];
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(submission => submission.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(submission => 
        submission.studentName?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredSubmissions(result);
    
    // Reset page when filters change
    setPage(0);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredSubmissions.map(submission => submission.id);
      setSelectedSubmissions(newSelected);
    } else {
      setSelectedSubmissions([]);
    }
  };

  const handleSelectSubmission = (submissionId: string) => {
    const selectedIndex = selectedSubmissions.indexOf(submissionId);
    let newSelected: string[] = [];
    
    if (selectedIndex === -1) {
      newSelected = [...selectedSubmissions, submissionId];
    } else {
      newSelected = selectedSubmissions.filter(id => id !== submissionId);
    }
    
    setSelectedSubmissions(newSelected);
  };

  const handleBatchGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatchGrade(e.target.value);
  };

  const handleBatchFeedbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatchFeedback(e.target.value);
  };

  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleBatchGrading = async () => {
    if (selectedSubmissions.length === 0 || !batchGrade) return;
    
    try {
      setGradingInProgress(true);
      
      const gradeValue = parseFloat(batchGrade);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
        throw new Error('Arvosanan on oltava välillä 0-5');
      }
      
      const gradeData: IGradeSubmission = {
        grade: gradeValue,
        feedback: batchFeedback,
        requiresRevision: false
      };
      
      const results = await Promise.allSettled(
        selectedSubmissions.map(submissionId => 
          submissionService.gradeSubmission(submissionId, gradeData)
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      // Update local state
      setSubmissions(prev => 
        prev.map(submission => {
          if (selectedSubmissions.includes(submission.id)) {
            return {
              ...submission,
              grade: gradeValue,
              feedbackText: batchFeedback,
              status: 'graded'
            };
          }
          return submission;
        })
      );
      
      // Show success message
      setSnackbarMessage(`${successful} palautusta arvioitu onnistuneesti${failed > 0 ? `, ${failed} epäonnistui` : ''}`);
      setSnackbarSeverity(failed > 0 ? 'error' : 'success');
      setSnackbarOpen(true);
      
      // Reset selection and batch grading form
      setSelectedSubmissions([]);
      setBatchGrade('');
      setBatchFeedback('');
      
      // Notify parent component
      if (onGradingComplete) {
        onGradingComplete();
      }
    } catch (err) {
      console.error('Error during batch grading:', err);
      setSnackbarMessage('Arviointi epäonnistui. Yritä uudelleen.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setGradingInProgress(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleRequestSort = (property: keyof TableSubmission) => {
    const isAsc = sortConfig.key === property && sortConfig.direction === 'asc';
    setSortConfig({ key: property, direction: isAsc ? 'desc' : 'asc' });
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    fetchSubmissions();
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleViewSubmission = (submissionId: string) => {
    window.open(`/submissions/${submissionId}`, '_blank');
  };

  if (loading && submissions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && submissions.length === 0) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Eräarviointi - {filteredSubmissions.length} palautusta
      </Typography>

      <BatchGradingFilters
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onStatusFilterChange={handleStatusFilterChange}
        onSearchQueryChange={handleSearchQueryChange}
        onClearFilters={handleClearFilters}
        onRefresh={handleRefresh}
      />

      <BatchGradingForm
        selectedCount={selectedSubmissions.length}
        batchGrade={batchGrade}
        batchFeedback={batchFeedback}
        loading={gradingInProgress}
        onBatchGradeChange={handleBatchGradeChange}
        onBatchFeedbackChange={handleBatchFeedbackChange}
        onOpenConfirmDialog={handleOpenConfirmDialog}
      />

      <SubmissionTable
        submissions={filteredSubmissions}
        selectedSubmissions={selectedSubmissions}
        sortConfig={sortConfig}
        page={page}
        rowsPerPage={rowsPerPage}
        onSelectAll={handleSelectAll}
        onSelectSubmission={handleSelectSubmission}
        onRequestSort={handleRequestSort}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
        onViewSubmission={handleViewSubmission}
      />

      <BatchGradingConfirmDialog
        open={confirmDialogOpen}
        selectedCount={selectedSubmissions.length}
        batchGrade={batchGrade}
        loading={gradingInProgress}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleBatchGrading}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BatchGradingView;