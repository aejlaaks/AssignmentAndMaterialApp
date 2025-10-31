import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Popover,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import { InlineComment } from '../../services/inlineCommentService';

interface InlineCommentMarkerProps {
  comment: InlineComment;
  children: React.ReactNode;
  onEdit?: (comment: InlineComment) => void;
  onDelete?: (commentId: string) => void;
  readOnly?: boolean;
}

const InlineCommentMarker: React.FC<InlineCommentMarkerProps> = ({
  comment,
  children,
  onEdit,
  onDelete,
  readOnly = false
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(comment);
      handleClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(comment.id);
      handleClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <>
      <Box
        component="span"
        onClick={handleClick}
        sx={{
          backgroundColor: 'rgba(255, 235, 59, 0.3)',
          position: 'relative',
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationStyle: 'wavy',
          textDecorationColor: 'primary.main',
          '&:hover': {
            backgroundColor: 'rgba(255, 235, 59, 0.5)',
          }
        }}
      >
        {children}
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Paper sx={{ p: 2, maxWidth: 320 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CommentIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle2">
              {comment.teacherName || 'Teacher'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {formatDate(comment.createdAt)}
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 1.5 }} />
          
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {comment.text}
          </Typography>
          
          {comment.updatedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Muokattu: {formatDate(comment.updatedAt)}
            </Typography>
          )}
          
          {!readOnly && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              {onEdit && (
                <Tooltip title="Muokkaa kommenttia">
                  <IconButton size="small" onClick={handleEdit}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Poista kommentti">
                  <IconButton size="small" onClick={handleDelete} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default InlineCommentMarker; 