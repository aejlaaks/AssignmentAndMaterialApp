import React, { useState } from 'react';
import { 
  Box, 
  Popover, 
  Typography, 
  IconButton, 
  Paper, 
  Divider,
  TextField,
  Button,
  Avatar,
  Link,
  Tooltip
} from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { formatRelativeTime } from '../../utils/dateUtils';
import { InlineComment } from '../../services/inlineCommentService';

interface InlineCommentMarkerProps {
  comment: InlineComment;
  position: { top: number; left: number };
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

const InlineCommentMarker: React.FC<InlineCommentMarkerProps> = ({
  comment,
  position,
  onEdit,
  onDelete,
  readOnly = false
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsEditing(false);
    setEditText(comment.text);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onEdit && editText.trim()) {
      onEdit(comment.id, editText);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(comment.id);
    }
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? `comment-popover-${comment.id}` : undefined;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000,
      }}
    >
      <Tooltip title="Näytä kommentti">
        <IconButton
          size="small"
          color="primary"
          aria-describedby={id}
          onClick={handleClick}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid',
            borderColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          }}
        >
          <CommentIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ maxWidth: 400, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
              {comment.teacherName.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2">{comment.teacherName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRelativeTime(comment.updatedAt || comment.createdAt)}
                {comment.updatedAt && ' (muokattu)'}
              </Typography>
            </Box>
            {!readOnly && (
              <Box>
                <Tooltip title="Muokkaa">
                  <IconButton size="small" onClick={handleEdit}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Poista">
                  <IconButton size="small" onClick={handleDelete}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
          <Divider sx={{ my: 1 }} />
          {isEditing ? (
            <Box>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button size="small" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                >
                  Save
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2">{comment.text}</Typography>
              {comment.attachment && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                  <Link
                    href={comment.attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                  >
                    {comment.attachment.fileName}
                  </Link>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Popover>
    </Box>
  );
};

export default InlineCommentMarker; 