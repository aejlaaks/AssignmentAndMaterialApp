import { type FC, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import {
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { NoData } from './NoData';

interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row?: any) => string | number | JSX.Element;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  defaultSortBy?: string;
  defaultSortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  rowKey?: keyof T;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  sx?: SxProps<Theme>;
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  defaultSortBy,
  defaultSortDirection = 'asc',
  onRowClick,
  rowKey = 'id',
  page = 0,
  rowsPerPage = 10,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  sx,
}: DataTableProps<T>) => {
  const [sortBy, setSortBy] = useState<string | undefined>(defaultSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);

  const handleSort = useCallback((columnId: string) => {
    const isAsc = sortBy === columnId && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(columnId);
  }, [sortBy, sortDirection]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    onPageChange?.(newPage);
  }, [onPageChange]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
    onPageChange?.(0);
  }, [onPageChange, onRowsPerPageChange]);

  const formatCellValue = useCallback((value: any, row: T, format?: Column<T>['format']) => {
    if (format) {
      return format(value, row);
    }
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!data.length) {
    return <NoData message={emptyMessage} />;
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', ...sx }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id.toString()}
                  align={column.align}
                  style={{
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                    cursor: column.sortable ? 'pointer' : 'default',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                  }}
                  onClick={() => column.sortable && handleSort(column.id.toString())}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle2" component="span">
                      {column.label}
                    </Typography>
                    {column.sortable && sortBy === column.id && (
                      <Box component="span" sx={{ display: 'flex', ml: 0.5 }}>
                        {sortDirection === 'desc' ? (
                          <KeyboardArrowDownIcon fontSize="small" />
                        ) : (
                          <KeyboardArrowUpIcon fontSize="small" />
                        )}
                      </Box>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                hover
                key={row[rowKey]}
                onClick={() => onRowClick?.(row)}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((column) => {
                  const value = column.id.toString().split('.').reduce((obj, key) => obj?.[key], row);
                  return (
                    <TableCell 
                      key={column.id.toString()} 
                      align={column.align}
                      style={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word'
                      }}
                    >
                      {formatCellValue(value, row, column.format)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount ?? data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
};
