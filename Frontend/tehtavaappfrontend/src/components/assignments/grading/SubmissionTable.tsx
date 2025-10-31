import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  TablePagination,
  TableSortLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { formatDate } from '../../../utils/dateUtils';
import { getStatusDisplayText, getStatusColor } from '../../../utils/submissionUtils';

interface ISubmission {
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

interface SortConfig {
  key: keyof ISubmission | '';
  direction: 'asc' | 'desc';
}

interface SubmissionTableProps {
  submissions: ISubmission[];
  selectedSubmissions: string[];
  sortConfig: SortConfig;
  page: number;
  rowsPerPage: number;
  onSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectSubmission: (submissionId: string) => void;
  onRequestSort: (property: keyof ISubmission) => void;
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onViewSubmission: (submissionId: string) => void;
}

const SubmissionTable: React.FC<SubmissionTableProps> = ({
  submissions,
  selectedSubmissions,
  sortConfig,
  page,
  rowsPerPage,
  onSelectAll,
  onSelectSubmission,
  onRequestSort,
  onChangePage,
  onChangeRowsPerPage,
  onViewSubmission
}) => {
  const getStatusChip = (status: any) => {
    if (!status) return <Chip label="Ei tietoa" color="default" size="small" />;
    
    // Convert to lowercase for case-insensitive comparison
    const statusLower = String(status).toLowerCase();
    
    let label = '';
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    switch (statusLower) {
      case 'submitted':
        label = 'Palautettu';
        color = 'primary';
        break;
      case 'graded':
      case 'completed':
        label = 'Arvioitu';
        color = 'success';
        break;
      case 'returned':
        label = 'Palautettu korjattavaksi';
        color = 'warning';
        break;
      case 'published':
        label = 'Julkaistu';
        color = 'info';
        break;
      case 'draft':
        label = 'Luonnos';
        color = 'default';
        break;
      case 'inprogress':
        label = 'Kesken';
        color = 'info';
        break;
      case 'archived':
        label = 'Myöhässä';
        color = 'error';
        break;
      default:
        label = String(status);
        color = 'default';
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedSubmissions.length > 0 && selectedSubmissions.length < submissions.length
                  }
                  checked={submissions.length > 0 && selectedSubmissions.length === submissions.length}
                  onChange={onSelectAll}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'studentName'}
                  direction={sortConfig.key === 'studentName' ? sortConfig.direction : 'asc'}
                  onClick={() => onRequestSort('studentName')}
                >
                  Opiskelija
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'submittedAt'}
                  direction={sortConfig.key === 'submittedAt' ? sortConfig.direction : 'asc'}
                  onClick={() => onRequestSort('submittedAt')}
                >
                  Palautettu
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'status'}
                  direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                  onClick={() => onRequestSort('status')}
                >
                  Tila
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'grade'}
                  direction={sortConfig.key === 'grade' ? sortConfig.direction : 'asc'}
                  onClick={() => onRequestSort('grade')}
                >
                  Arvosana
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Toiminnot</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((submission) => (
                <TableRow
                  key={submission.id}
                  hover
                  selected={selectedSubmissions.includes(submission.id)}
                  onClick={() => onSelectSubmission(submission.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedSubmissions.includes(submission.id)} />
                  </TableCell>
                  <TableCell>{submission.studentName}</TableCell>
                  <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                  <TableCell>{getStatusChip(submission.status)}</TableCell>
                  <TableCell>{submission.grade !== undefined ? submission.grade : '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Näytä palautus">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewSubmission(submission.id);
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={submissions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onChangePage}
        onRowsPerPageChange={onChangeRowsPerPage}
        labelRowsPerPage="Rivejä sivulla:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />
    </Paper>
  );
};

export default SubmissionTable; 