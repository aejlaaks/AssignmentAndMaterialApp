import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Popover,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import AddCommentIcon from '@mui/icons-material/AddComment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { inlineCommentService, InlineComment, InlineCommentDTO } from '../../services/inlineCommentService';
import InlineCommentMarker from './InlineCommentMarker';

interface SubmissionViewerProps {
  submissionId: string;
  submissionText: string;
  readOnly?: boolean;
  onCommentAdded?: () => void;
  onCommentUpdated?: () => void;
  onCommentDeleted?: () => void;
}

const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
  submissionId,
  submissionText,
  readOnly = false,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted
}) => {
  const [comments, setComments] = useState<InlineComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number, end: number } | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<InlineComment | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
  }, [submissionId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await inlineCommentService.getCommentsBySubmission(submissionId);
      setComments(fetchedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    
    if (text && contentRef.current) {
      // Calculate the start and end positions relative to the content
      const contentElement = contentRef.current;
      const contentRange = document.createRange();
      contentRange.selectNodeContents(contentElement);
      
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;
      
      setSelectedText(text);
      setSelectionRange({ start: startOffset, end: endOffset });
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedText('');
    setSelectionRange(null);
    setCommentText('');
    setEditingComment(null);
  };

  const handleAddComment = async () => {
    if (!selectionRange || !commentText.trim()) return;
    
    try {
      setLoading(true);
      const commentData: InlineCommentDTO = {
        submissionId,
        text: commentText,
        startPosition: selectionRange.start,
        endPosition: selectionRange.end,
        referenceText: selectedText
      };
      
      const newComment = await inlineCommentService.addComment(commentData);
      
      setComments([...comments, newComment]);
      handleClosePopover();
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async () => {
    if (!editingComment || !commentText.trim()) return;
    
    try {
      setLoading(true);
      const updatedComment = await inlineCommentService.updateComment(
        editingComment.id,
        { 
          submissionId: editingComment.submissionId,
          text: commentText 
        }
      );
      
      if (updatedComment) {
        setComments(comments.map(c => c.id === updatedComment.id ? updatedComment : c));
      }
      
      handleClosePopover();
      
      if (onCommentUpdated) {
        onCommentUpdated();
      }
    } catch (err) {
      console.error('Error updating comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setLoading(true);
      await inlineCommentService.deleteComment(commentId);
      
      setComments(comments.filter(c => c.id !== commentId));
      
      if (onCommentDeleted) {
        onCommentDeleted();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentClick = (comment: InlineComment) => {
    setEditingComment(comment);
    setCommentText(comment.text);
    setAnchorEl(contentRef.current);
  };

  // Function to highlight text with comments
  const renderTextWithComments = () => {
    if (!submissionText) return <Typography>No submission text available.</Typography>;
    
    // Sort comments by position to ensure proper rendering
    const sortedComments = [...comments].sort((a, b) => a.startPosition - b.startPosition);
    
    let lastIndex = 0;
    const segments = [];
    
    sortedComments.forEach((comment, index) => {
      // Add text before the comment
      if (comment.startPosition > lastIndex) {
        segments.push(
          <span key={`text-${index}`}>
            {submissionText.substring(lastIndex, comment.startPosition)}
          </span>
        );
      }
      
      // Add the commented text with highlighting
      segments.push(
        <InlineCommentMarker
          key={`comment-${comment.id}`}
          comment={comment}
          onEdit={() => handleCommentClick(comment)}
          onDelete={() => handleDeleteComment(comment.id)}
          readOnly={readOnly}
        >
          {submissionText.substring(comment.startPosition, comment.endPosition)}
        </InlineCommentMarker>
      );
      
      lastIndex = comment.endPosition;
    });
    
    // Add any remaining text
    if (lastIndex < submissionText.length) {
      segments.push(
        <span key="text-end">
          {submissionText.substring(lastIndex)}
        </span>
      );
    }
    
    return segments;
  };

  return (
    <Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3, 
          position: 'relative',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          minHeight: '200px'
        }}
      >
        {!readOnly && (
          <Tooltip title="Valitse teksti lisätäksesi kommentin">
            <Chip
              icon={<AddCommentIcon />}
              label="Add Comment"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
          </Tooltip>
        )}
        
        <Box 
          ref={contentRef}
          onMouseUp={handleTextSelection}
          sx={{ mt: 2 }}
        >
          {renderTextWithComments()}
        </Box>
      </Paper>
      
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            {editingComment ? 'Edit Comment' : 'Add Comment'}
          </Typography>
          
          {selectedText && !editingComment && (
            <>
              <Typography variant="caption" color="text.secondary" component="div" gutterBottom>
                Selected text:
              </Typography>
              <Paper variant="outlined" sx={{ p: 1, mb: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="body2">
                  {selectedText.length > 100 ? `${selectedText.substring(0, 100)}...` : selectedText}
                </Typography>
              </Paper>
            </>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter your comment here..."
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleClosePopover}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              color="primary"
              onClick={editingComment ? handleEditComment : handleAddComment}
              disabled={!commentText.trim() || loading}
            >
              {loading ? <CircularProgress size={20} /> : (editingComment ? 'Update' : 'Add')}
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default SubmissionViewer; 