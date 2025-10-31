import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Button, Alert, List, ListItem, ListItemIcon, ListItemText, Link } from '@mui/material';
import { AssignmentBlock } from '../../../types/blocks';
import { assignmentService } from '../../../services/assignments/assignmentService';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import { fileUploadService } from '../../../services/fileUploadService';
import { useAuth } from '../../../hooks/useAuth';
import DoneIcon from '@mui/icons-material/Done';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import NoteAddIcon from '@mui/icons-material/NoteAdd';

// Define the uploaded file interface
interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  assignmentId?: string;
  uploadedAt: string;
  originalFileName?: string;
}

// Define the display assignment interface
interface DisplayAssignment {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  deadline?: string; // Support for legacy property
  points?: number;
  courseId: string;
}

// Props interface
interface AssignmentBlockContentProps {
  block: AssignmentBlock;
  courseId?: string; // Make courseId optional to maintain backward compatibility
  showTitle?: boolean;
}

// Add this component for file icons
const FileIcon = ({ fileType }: { fileType?: string }) => {
  if (!fileType) return <InsertDriveFileIcon fontSize="small" color="action" />;
  
  if (fileType.toLowerCase().includes('pdf')) {
    return <PictureAsPdfIcon fontSize="small" color="error" />;
  } else if (fileType.toLowerCase().match(/jpg|jpeg|png|gif|bmp|svg/)) {
    return <ImageIcon fontSize="small" color="primary" />;
  } else if (fileType.toLowerCase().match(/doc|docx|txt|rtf/)) {
    return <DescriptionIcon fontSize="small" color="info" />;
  } else {
    return <InsertDriveFileIcon fontSize="small" color="action" />;
  }
};

export const AssignmentBlockContent: React.FC<AssignmentBlockContentProps> = ({ 
  block, 
  courseId,
  showTitle = false
}) => {
  const [assignment, setAssignment] = useState<DisplayAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentFiles, setAssignmentFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const { user } = useAuth();
  const isTeacher = user && (user.role === 'Teacher' || user.role === 'Admin');

  useEffect(() => {
    const fetchAssignment = async () => {
      console.log('AssignmentBlockContent - Block info:', JSON.stringify(block, null, 2));
      console.log('AssignmentBlockContent - Course ID:', courseId);
      
      setLoading(true);
      setError(null);

      // First check if the assignment data exists in the block itself
      if (block.assignmentName && block.assignmentDescription) {
        console.log('Using assignment data from block:', block);
        // Create a basic assignment object from block data
        const localAssignment: DisplayAssignment = {
          id: block.assignmentId || 'unknown',
          title: block.assignmentName,
          description: block.assignmentDescription || '', // Ensure description is not undefined
          dueDate: block.dueDate || '',
          courseId: courseId || ''
        };
        setAssignment(localAssignment);
        setLoading(false);
        return;
      }

      // If there's no assignmentId, try alternative ways to get the data
      if (!block.assignmentId) {
        console.warn('Assignment block is missing assignmentId:', block);
        
        // Try to extract assignmentId from existing fields
        let potentialId = null;
        
        // If we have an ID in the title (sometimes it's formatted as "AssignmentName [ID]")
        const idMatch = block.title.match(/\[([^\]]+)\]$/);
        if (idMatch && idMatch[1]) {
          potentialId = idMatch[1];
          console.log('Found potential assignment ID in title:', potentialId);
        }
        
        // Check if the ID might be embedded in content
        if (!potentialId && block.content) {
          const contentMatch = block.content.match(/assignment-id[=:]"?([^"]+)"?/i);
          if (contentMatch && contentMatch[1]) {
            potentialId = contentMatch[1];
            console.log('Found potential assignment ID in content:', potentialId);
          }
        }
        
        if (potentialId) {
          try {
            console.log(`Trying to fetch assignment with extracted ID: ${potentialId}`);
            const data = await assignmentService.getAssignmentById(potentialId);
            if (data) {
              // Safely access properties with optional chaining
              const typedAssignment: DisplayAssignment = {
                id: data.id,
                title: data.title || '',
                description: data.description || '', 
                dueDate: data.dueDate || (data as any)?.deadline || '',
                courseId: data.courseId || courseId || '',
                points: data.points
              };
              setAssignment(typedAssignment);
            }
            setLoading(false);
            return;
          } catch (err) {
            console.error('Error fetching assignment from extracted ID:', err);
            // Continue to error handling below
          }
        }
        
        // If no assignmentId was found and a courseId is available, try to load by title match
        if (courseId && block.title) {
          try {
            console.log(`Trying to find assignment by title match in course ${courseId}`);
            const courseAssignments = await assignmentService.getAssignmentsByCourse(courseId);
            console.log(`Found ${courseAssignments.length} assignments in course`);
            
            // Try to find a matching assignment by title
            const matchingAssignment = courseAssignments.find(a => 
              a.title.toLowerCase().includes(block.title.toLowerCase()) ||
              block.title.toLowerCase().includes(a.title.toLowerCase())
            );
            
            if (matchingAssignment) {
              console.log('Found matching assignment by title:', matchingAssignment);
              const typedAssignment: DisplayAssignment = {
                id: matchingAssignment.id,
                title: matchingAssignment.title || '',
                description: matchingAssignment.description || '', 
                dueDate: matchingAssignment.dueDate || (matchingAssignment as any)?.deadline || '',
                courseId: matchingAssignment.courseId || courseId || '',
                points: matchingAssignment.points
              };
              setAssignment(typedAssignment);
              setLoading(false);
              return;
            } else {
              // If we didn't find a match by title but have assignments, show the error with more context
              console.log('Could not find a matching assignment by title');
              setError(`Tehtävää ei löydy: "${block.title}". Käytä kurssisivun Muokkaa näkymää korjataksesi tämän lohkon.`);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error trying to match assignment by title:', err);
            // Continue to error handling
          }
        }
        
        setError('Assignment ID is missing');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching assignment with ID:', block.assignmentId);
        const data = await assignmentService.getAssignmentById(block.assignmentId);
        
        if (data) {
          console.log('Assignment fetched successfully:', data);
          // Safely access properties with optional chaining and type casting
          const apiData = data as any; // Cast to any to access potential properties
          const typedAssignment: DisplayAssignment = {
            id: data.id,
            title: data.title || '',
            description: data.description || '', 
            dueDate: data.dueDate || apiData?.deadline || '',
            courseId: data.courseId || courseId || '',
            points: data.points,
            deadline: apiData?.deadline // Keep the original deadline property if it exists
          };
          setAssignment(typedAssignment);
        } else {
          console.warn('Assignment not found:', block.assignmentId);
          
          // Try to find among course assignments with the ID
          if (courseId) {
            try {
              const courseAssignments = await assignmentService.getAssignmentsByCourse(courseId);
              const matchingAssignment = courseAssignments.find(a => a.id === block.assignmentId);
              
              if (matchingAssignment) {
                console.log('Found assignment by ID in course assignments:', matchingAssignment);
                const typedAssignment: DisplayAssignment = {
                  id: matchingAssignment.id,
                  title: matchingAssignment.title || '',
                  description: matchingAssignment.description || '',
                  dueDate: matchingAssignment.dueDate || (matchingAssignment as any)?.deadline || '',
                  courseId: matchingAssignment.courseId || courseId || '',
                  points: matchingAssignment.points
                };
                setAssignment(typedAssignment);
                setLoading(false);
                return;
              }
            } catch (err) {
              console.error('Error fetching course assignments:', err);
            }
          }
          
          setError(`Tehtävää ID:llä ${block.assignmentId} ei löydy. Se on saatettu poistaa.`);
        }
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError('Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [block, courseId]);

  // Add new useEffect to fetch assignment files
  useEffect(() => {
    const fetchAssignmentFiles = async () => {
      if (!assignment?.id || assignment.id === 'unknown') {
        console.log('No valid assignment ID, skipping file fetch');
        return;
      }
      
      setLoadingFiles(true);
      try {
        const assignmentId = String(assignment.id).trim();
        console.log(`Fetching files for assignment ID: ${assignmentId} (Title: "${assignment.title}")`);
        
        // Try direct API call first - this should work with the new backend implementation
        try {
          const files = await fileUploadService.getFilesByAssignmentId(assignmentId);
          console.log(`API returned ${files.length} files for assignment ${assignmentId}:`, files);
          
          if (files.length > 0) {
            setAssignmentFiles(files);
            setLoadingFiles(false);
            return;
          } else {
            console.log('No files found through direct API, will try fallback methods');
          }
        } catch (apiError) {
          console.error('Error calling getFilesByAssignmentId API:', apiError);
          // Continue to fallback methods
        }
        
        // Fallback: Look through all files in the folder
        console.log('Trying fallback: looking through all assignment folder files');
        const folderFiles = await fileUploadService.getFilesByFolder('assignments');
        console.log(`Found ${folderFiles.length} total files in assignments folder`);
        
        // First check: direct ID match in filename using multiple patterns
        const directMatches = folderFiles.filter(file => {
          const fileName = file.fileName.toLowerCase();
          const patterns = [
            `assignment-${assignmentId}`,
            `assignment_${assignmentId}`,
            `tehtava-${assignmentId}`,
            `tehtava_${assignmentId}`,
            `-${assignmentId}.`,
            `_${assignmentId}.`
          ];
          
          return patterns.some(pattern => fileName.includes(pattern));
        });
        
        if (directMatches.length > 0) {
          console.log(`Found ${directMatches.length} files with direct ID match for assignment ${assignmentId}`);
          setAssignmentFiles(directMatches);
        } else {
          // Last resort: Look for title matches if we have a title
          if (assignment.title) {
            console.log('No direct ID matches, trying title-based matching');
            const titleWords = assignment.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            
            if (titleWords.length > 0) {
              const titleMatches = folderFiles.filter(file => {
                const fileName = file.fileName.toLowerCase();
                // For title matches, require at least 2 significant words to match
                return titleWords.filter(word => fileName.includes(word)).length >= Math.min(2, titleWords.length);
              });
              
              if (titleMatches.length > 0) {
                console.log(`Found ${titleMatches.length} files with title matches for "${assignment.title}"`);
                setAssignmentFiles(titleMatches);
              } else {
                console.log('No title matches found either');
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching assignment files:', err);
      } finally {
        setLoadingFiles(false);
      }
    };
    
    fetchAssignmentFiles();
  }, [assignment]);

  const handleViewAssignment = () => {
    if (assignment && assignment.id) {
      window.location.href = `/assignment/${assignment.id}`;
    }
  };

  const getFileIcon = (file: UploadedFile) => {
    const fileType = file.fileType?.toLowerCase() || '';
    if (fileType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (fileType.includes('image') || fileType.match(/\.(jpg|jpeg|png|gif)$/)) return <ImageIcon color="primary" />;
    if (fileType.includes('word') || fileType.includes('document') || fileType.match(/\.(doc|docx|txt)$/)) return <InsertDriveFileIcon color="info" />;
    return <InsertDriveFileIcon />;
  };

  // Get file type label for display
  const getFileTypeLabel = (file: UploadedFile) => {
    const fileType = file.fileType?.toLowerCase() || '';
    if (fileType.includes('pdf')) return "PDF";
    if (fileType.includes('image') || fileType.match(/\.(jpg|jpeg|png|gif)$/)) return "Image";
    if (fileType.includes('word') || fileType.match(/\.(doc|docx)$/)) return "Word";
    if (fileType.includes('text') || fileType.match(/\.(txt)$/)) return "Text";
    if (file.fileType) return file.fileType.toUpperCase();
    return "File";
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMaterials = () => {
    if (loadingFiles) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Loading assignment files...</Typography>
        </Box>
      );
    }

    if (assignmentFiles.length === 0) {
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
            No assignment files found. Files uploaded with assignments will appear here.
          </Typography>
          {isTeacher && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                color="primary"
                onClick={runFileDiagnostics}
                sx={{ textTransform: 'none' }}
              >
                Run File Diagnostics
              </Button>
              {user?.role === 'Admin' && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="warning"
                  onClick={runFileMigration}
                  sx={{ textTransform: 'none' }}
                >
                  Migrate Assignment Files
                </Button>
              )}
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Assignment Materials:
        </Typography>
        <List dense disablePadding>
          {assignmentFiles.map((file) => (
            <ListItem key={file.id} disablePadding sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <FileIcon fileType={file.fileType} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Link 
                    href={file.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ color: 'text.primary' }}
                  >
                    {file.fileName}
                  </Link>
                }
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
        {isTeacher && (
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small" 
              color="primary"
              onClick={runFileDiagnostics}
              sx={{ textTransform: 'none' }}
            >
              Run File Diagnostics
            </Button>
            {user?.role === 'Admin' && (
              <Button 
                variant="outlined" 
                size="small" 
                color="warning"
                onClick={runFileMigration}
                sx={{ textTransform: 'none' }}
              >
                Migrate Assignment Files
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Add this function for the diagnostic button
  const runFileDiagnostics = async () => {
    if (!assignment?.id) return;
    
    try {
      setLoadingFiles(true);
      const result = await fileUploadService.checkAssignmentFileStatus(assignment.id);
      
      if (result.success) {
        // Display diagnostic info in a formatted way
        console.log('Diagnostics result:', result.data);
        alert(
          `Assignment ${assignment.id} File Diagnostics:\n` +
          `- Direct database matches: ${result.data.directAssignmentFiles.count}\n` + 
          `- Pattern matches: ${Object.values(result.data.patternMatches)
            .reduce((sum: any, val: any) => sum + val.count, 0)}\n` +
          `- Total files in assignments folder: ${result.data.databaseStats.totalAssignmentFolderFiles}\n` +
          `- Total files linked to assignments: ${result.data.databaseStats.totalWithAssignmentId}\n\n` +
          `See console for complete details.`
        );
      } else {
        console.error('Diagnostics failed:', result.error);
        alert(`Diagnostics failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
      alert('Error running diagnostics. See console for details.');
    } finally {
      setLoadingFiles(false);
    }
  };

  // Add this function for the migration button
  const runFileMigration = async () => {
    if (window.confirm('This will attempt to associate assignment files with assignments based on file naming patterns. Continue?')) {
      try {
        setLoadingFiles(true);
        const result = await fileUploadService.migrateAssignmentFiles();
        
        if (result.success) {
          console.log('Migration result:', result.data);
          alert(
            `Assignment Files Migration Results:\n\n` +
            `${result.data.message}\n\n` +
            `Please refresh the page to see the changes.`
          );
          
          // Refresh assignment files
          if (assignment?.id) {
            const freshFiles = await fileUploadService.getFilesByAssignmentId(assignment.id);
            setAssignmentFiles(freshFiles);
          }
        } else {
          console.error('Migration failed:', result.error);
          alert(`Migration failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Error running migration:', error);
        alert('Error running migration. See console for details.');
      } finally {
        setLoadingFiles(false);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If there's an error but we have a title, show a minimal version
  if (error && block.title) {
    return (
      <Paper elevation={2} sx={{ p: 2, my: 2 }}>
        <Box>
          <Typography variant="h6">{block.title}</Typography>
          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
            {error}. Contact your instructor for assistance.
          </Alert>
          {block.description && (
            <Typography variant="body2" color="text.secondary">
              {block.description}
            </Typography>
          )}
        </Box>
      </Paper>
    );
  }

  if (error || !assignment) {
    return (
      <Paper elevation={2} sx={{ p: 2, my: 2 }}>
        <Typography color="error">
          {error || 'Assignment could not be loaded'}
        </Typography>
      </Paper>
    );
  }

  // Get the due date from either property
  const displayDueDate = assignment.dueDate || assignment.deadline;

  return (
    <Paper elevation={2} sx={{ p: 2, my: 2 }}>
      <Box>
        {showTitle && assignment.title && (
          <Typography variant="h6" gutterBottom>
            {assignment.title}
          </Typography>
        )}
        
        {assignment.description && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              {assignment.description}
            </Typography>
          </Box>
        )}

        {assignment.points !== undefined && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Pisteet: {assignment.points}
          </Typography>
        )}

        {displayDueDate && (
          <Typography variant="body2" color="text.secondary">
            Deadline: {new Date(displayDueDate).toLocaleDateString('fi-FI')}
          </Typography>
        )}
        
        {renderMaterials()}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          {assignment.id && assignment.id !== 'unknown' && (
            <Button
              variant="outlined"
              size="small"
              color="primary"
              onClick={handleViewAssignment}
              sx={{ mr: 1 }}
              startIcon={<DescriptionIcon />}
            >
              View Assignment
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}; 