import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  LinearProgress,
  CircularProgress,
  Alert,
  Checkbox,
  FormGroup,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { 
  Block, 
  BlockType, 
  BlockDialogProps, 
  TextBlock,
  MarkdownBlock,
  ImageBlock,
  MaterialBlock,
  AssignmentBlock,
  HtmlBlock,
  BlockGroup,
  TestBlock
} from '../../types/blocks';
import { IMaterial } from '../../services/materials/materialTypes';
import { materialService } from '../../services/materials/materialService';
import { assignmentService } from '../../services/assignments/assignmentService';
import { testService } from '../../services/tests';
import { TestDTO } from '../../services/tests';
import ImageUpload from '../common/ImageUpload';
import MaterialUpload from '../materials/MaterialUpload';
import MarkdownEditor from '../common/MarkdownEditor';
import CloudUpload from '@mui/icons-material/CloudUpload';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import Delete from '@mui/icons-material/Delete';
import { fileUploadService } from '../../services/fileUploadService';
import { getFixedImageUrl } from '../../utils/imageUtils';

export const BlockDialog: React.FC<BlockDialogProps> = ({
  open,
  onClose,
  onSave,
  editingBlock,
  courseId,
}) => {
  // Lohkon perustiedot
  const [blockType, setBlockType] = useState<BlockType>('text');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockContent, setBlockContent] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isVisible, setIsVisible] = useState<boolean>(true);
  
  // Kuvalohkon tiedot
  const [imageInputMethod, setImageInputMethod] = useState<'url' | 'upload'>('url');
  const [blockImageUrl, setBlockImageUrl] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  
  // Materiaalilohkon tiedot
  const [availableMaterials, setAvailableMaterials] = useState<IMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  
  // Tehtävälohkon tiedot
  const [availableAssignments, setAvailableAssignments] = useState<any[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Test block details
  const [availableTests, setAvailableTests] = useState<TestDTO[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [loadingTests, setLoadingTests] = useState(false);
  const [isProctored, setIsProctored] = useState(false);
  const [showResults, setShowResults] = useState<'immediately' | 'after_due_date' | 'manual'>('immediately');
  const [testTimeLimit, setTestTimeLimit] = useState<number>(60);
  const [testPassingScore, setTestPassingScore] = useState<number>(60);
  const [testAttempts, setTestAttempts] = useState<number>(1);
  const [testDueDate, setTestDueDate] = useState<string | undefined>(undefined);
  const [allowedResources, setAllowedResources] = useState<string[]>([]);

  // Add state for file uploads
  const [assignmentFiles, setAssignmentFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const assignmentFileInputRef = useRef<HTMLInputElement>(null);

  // Add state for text block image upload
  const [isUploadingTextImage, setIsUploadingTextImage] = useState(false);
  const [textEditorCursorPosition, setTextEditorCursorPosition] = useState<number | undefined>(undefined);

  // Alusta dialogi kun se avataan
  useEffect(() => {
    if (open) {
      if (editingBlock) {
        console.log('Editing existing block:', editingBlock);
        setBlockTitle(editingBlock.title || '');
        setIsVisible(editingBlock.isVisible !== false);
        
        if (editingBlock.type) {
          setBlockType(editingBlock.type);
          
          // Use type assertion to handle the type more safely
          const blockType = editingBlock.type as BlockType;
          
          switch (blockType) {
            case 'text':
            case 'markdown':
            case 'html':
              setBlockContent(editingBlock.content || '');
              break;
            case 'image':
              const imageBlock = editingBlock as ImageBlock;
              if (imageBlock.materialId) {
                setImageInputMethod('upload');
                setSelectedMaterialId(imageBlock.materialId);
              } else if (imageBlock.imageUrl) {
                setImageInputMethod('url');
                setBlockImageUrl(imageBlock.imageUrl);
              }
              break;
            case 'material':
              setSelectedMaterialId((editingBlock as MaterialBlock).materialId || '');
              // Load the material data for the UI
              fetchMaterials();
              break;
            case 'assignment':
              setSelectedAssignmentId((editingBlock as AssignmentBlock).assignmentId || '');
              // Load the assignment data for the UI
              fetchAssignments();
              break;
            case 'group':
              setGroupDescription((editingBlock as BlockGroup).description || '');
              break;
            case 'test':
              const testBlock = editingBlock as TestBlock;
              setSelectedTestId(testBlock.testId || '');
              setIsProctored(testBlock.proctored);
              setShowResults(testBlock.showResults);
              setTestTimeLimit(testBlock.timeLimit);
              setTestPassingScore(testBlock.passingScore);
              setTestAttempts(testBlock.attempts);
              setTestDueDate(testBlock.dueDate);
              setAllowedResources(testBlock.allowedResources || []);
              fetchTests();
              break;
          }
        }
      } else {
        console.log('Creating new block');
        resetForm('text'); // Default to text block type
      }
      
      // Hae materiaalit
      fetchMaterials();
    }
  }, [open, editingBlock]);

  // Fetch assignments when blockType is assignment or courseId changes
  useEffect(() => {
    if (open && (blockType === 'assignment' || (editingBlock && editingBlock.type === 'assignment'))) {
      console.log('Fetching assignments due to blockType change or courseId change');
      fetchAssignments();
    }
  }, [open, blockType, courseId, editingBlock]);

  // Fetch tests when blockType is test or courseId changes
  useEffect(() => {
    if (open && (blockType === 'test' || (editingBlock && editingBlock.type === 'test'))) {
      console.log('Fetching tests due to blockType change or courseId change');
      fetchTests();
    }
  }, [open, blockType, courseId, editingBlock]);

  // Add debug logging for courseId changes
  useEffect(() => {
    if (courseId) {
      console.log(`CourseId changed to: ${courseId}`);
    }
  }, [courseId]);

  // Seurataan blockType:n muutoksia
  useEffect(() => {
    console.log('blockType muuttui:', blockType);
  }, [blockType]);

  // Fetch materials for material and image blocks
  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      // Fix: Remove courseId parameter if not expected
      const materials = await materialService.getAllMaterials();
      // Convert to IMaterial[] format
      const convertedMaterials: IMaterial[] = materials.map(m => ({
        ...m,
        createdAt: m.createdAt || new Date().toISOString()
      }));
      setAvailableMaterials(convertedMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Hae tehtävät
  const fetchAssignments = async () => {
    console.log('fetchAssignments called with courseId:', courseId);
    
    if (!courseId) {
      console.warn('Cannot fetch assignments: No course ID provided');
      // Set some debugging info in the dropdown
      setAvailableAssignments([{
        id: 'no-course',
        title: 'No course ID provided - select a course first',
        description: '',
        dueDate: ''
      }]);
      setLoadingAssignments(false);
      return;
    }
    
    try {
      setLoadingAssignments(true);
      console.log(`Fetching assignments for course ${courseId}`);
      
      // Log the service state for debugging
      console.log('assignmentService available:', !!assignmentService);
      console.log('getAssignmentsByCourse method available:', !!assignmentService.getAssignmentsByCourse);
      console.log('courseId type:', typeof courseId);
      
      // Additional validation
      if (typeof courseId !== 'string' || !courseId.trim()) {
        throw new Error('Invalid courseId format');
      }
      
      // Make the API call with explicit string conversion
      const courseIdStr = String(courseId).trim();
      console.log(`Making API call with courseId: "${courseIdStr}"`);
      const assignments = await assignmentService.getAssignmentsByCourse(courseIdStr);
      
      console.log(`Fetched ${assignments ? assignments.length : 0} assignments:`, assignments);
      
      // Handle empty response
      if (!assignments || assignments.length === 0) {
        console.warn(`No assignments found for course ${courseId}`);
        setAvailableAssignments([{
          id: 'no-assignments',
          title: 'No assignments found in this course',
          description: 'Create assignments in the Assignments tab first',
          dueDate: ''
        }]);
        setLoadingAssignments(false);
        return;
      }
      
      // Sort assignments by title for easier selection
      const sortedAssignments = [...assignments].sort((a, b) => 
        (a.title || '').localeCompare(b.title || '')
      );
      
      // Ensure we have all the required fields
      const validAssignments = sortedAssignments.map(a => ({
        ...a,
        id: a.id || '',
        title: a.title || 'Unnamed Assignment',
        description: a.description || '',
        dueDate: a.dueDate || ''
      }));
      
      console.log('Processed assignments:', validAssignments);
      setAvailableAssignments(validAssignments);
      
      // If we're editing a block and it has an assignmentId, make sure it's in the list
      if (editingBlock && editingBlock.type === 'assignment') {
        const assignmentBlock = editingBlock as AssignmentBlock;
        const assignmentId = assignmentBlock.assignmentId;
        
        if (assignmentId && !validAssignments.some(a => a.id === assignmentId)) {
          console.warn(`Assignment with ID ${assignmentId} not found in the course`);
          // Add this assignment to the list so it can still be edited
          try {
            const missingAssignment = await assignmentService.getAssignmentById(assignmentId);
            if (missingAssignment) {
              console.log('Found missing assignment:', missingAssignment);
              setAvailableAssignments(prev => [...prev, {
                ...missingAssignment,
                id: missingAssignment.id || '',
                title: missingAssignment.title || 'Unnamed Assignment',
                description: missingAssignment.description || '',
                dueDate: missingAssignment.dueDate || ''
              }]);
            }
          } catch (err) {
            console.error('Error fetching missing assignment:', err);
          }
        }
      }

      // Select the first assignment by default if none is selected yet
      if (validAssignments.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(validAssignments[0].id);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      // Add user-friendly error message to dropdown
      setAvailableAssignments([{
        id: 'error',
        title: `Error fetching assignments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        description: 'Check console for details',
        dueDate: ''
      }]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Fetch tests
  const fetchTests = async () => {
    console.log('fetchTests called with courseId:', courseId);
    
    if (!courseId) {
      console.warn('Cannot fetch tests: No course ID provided');
      setAvailableTests([]);
      setLoadingTests(false);
      return;
    }
    
    try {
      setLoadingTests(true);
      // Placeholder - replace with actual API call when implemented
      // const tests = await testService.getTestsByCourse(courseId);
      // setAvailableTests(tests);
      setAvailableTests([]);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setAvailableTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  // Nollaa lomake
  const resetForm = (newBlockType?: BlockType) => {
    setBlockType(newBlockType || 'text');
    setBlockTitle('');
    setBlockContent('');
    setGroupDescription('');
    setBlockImageUrl('');
    setSelectedMaterialId('');
    setSelectedAssignmentId('');
    setImageInputMethod('url');
    setIsVisible(true);
    setAssignmentFiles([]);
    
    // Reset test block state
    setSelectedTestId('');
    setIsProctored(false);
    setShowResults('immediately');
    setTestTimeLimit(60);
    setTestPassingScore(60);
    setTestAttempts(1);
    setTestDueDate(undefined);
    setAllowedResources([]);
  };

  // Käsittele kuvan lataus
  const handleImageUploadSuccess = (response: { id: string; fileUrl: string; title?: string }) => {
    setSelectedMaterialId(response.id);
    setImageInputMethod('upload');
  };

  // Käsittele materiaalin lataus
  const handleMaterialUploadSuccess = (response: { id: string; fileUrl: string; title?: string }) => {
    console.log('Material upload success:', response);
    setSelectedMaterialId(response.id);
    fetchMaterials();
  };

  const handleAssignmentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setAssignmentFiles(prev => [...prev, ...newFiles]);
      
      // Reset the file input
      if (assignmentFileInputRef.current) {
        assignmentFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAssignmentFile = (index: number) => {
    setAssignmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Add a handler for pasting images in text blocks
  const handleTextBlockPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default paste behavior for images
        
        // Get the image file from clipboard
        const file = items[i].getAsFile();
        if (file) {
          try {
            setIsUploadingTextImage(true);
            
            // Create a descriptive filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileExt = file.name && file.name.includes('.') 
              ? file.name.split('.').pop() 
              : file.type.split('/')[1] || 'png';
              
            const renamedFile = new File(
              [file], 
              `pasted-image-${timestamp}.${fileExt}`,
              { type: file.type }
            );
            
            console.log('Uploading pasted image:', renamedFile.name);
            
            // Upload the image using our existing service
            const uploadedFile = await fileUploadService.uploadFile(renamedFile, 'markdown-images');
            
            console.log('Image uploaded successfully, raw URL:', uploadedFile.fileUrl);
            
            // Fix the URL if it's a blob storage URL
            const imageUrl = getFixedImageUrl(uploadedFile.fileUrl);
            
            console.log('Fixed image URL:', imageUrl);
            
            // Insert markdown image syntax at cursor position or at the end
            const imageMarkdown = `![Image](${imageUrl})`;
            
            // Insert at cursor position if available, otherwise append to end
            if (textEditorCursorPosition !== undefined) {
              const newContent = blockContent.substring(0, textEditorCursorPosition) 
                + imageMarkdown 
                + blockContent.substring(textEditorCursorPosition);
              setBlockContent(newContent);
            } else {
              // Append to the end with a newline if content is not empty
              const newContent = blockContent 
                ? `${blockContent}\n\n${imageMarkdown}` 
                : imageMarkdown;
              setBlockContent(newContent);
            }
            
            console.log('Image markdown inserted into text block');
          } catch (error) {
            console.error('Error uploading pasted image:', error);
          } finally {
            setIsUploadingTextImage(false);
          }
        }
        break; // Only process the first image
      }
    }
  };
  
  // Track cursor position in text editor
  const handleTextFieldSelect = (e: React.SyntheticEvent<HTMLDivElement>) => {
    // Access the input element and get selection info
    const input = e.target as HTMLInputElement;
    // Handle null case properly
    setTextEditorCursorPosition(input.selectionStart !== null ? input.selectionStart : undefined);
  };

  // Tallenna lohko
  const handleSaveBlock = async () => {
    if (!blockTitle.trim()) {
      // Display error or alert
      return;
    }
    
    const id = editingBlock?.id || uuidv4();
    const order = editingBlock?.order || 0;
    
    let newBlock: Block;
    
    // Common properties for all block types
    const commonProps = {
      id,
      title: blockTitle,
      order,
      isVisible: isVisible,
    };
    
    switch (blockType) {
      case 'text':
        newBlock = {
          ...commonProps,
          type: 'text',
          content: blockContent,
        } as TextBlock;
        break;
      case 'markdown':
        newBlock = {
          ...commonProps,
          type: 'markdown',
          content: blockContent,
        } as MarkdownBlock;
        break;
      case 'image':
        newBlock = {
          ...commonProps,
          type: 'image',
          url: imageInputMethod === 'url' ? blockImageUrl : '',
          materialId: imageInputMethod === 'upload' ? selectedMaterialId : undefined,
        } as ImageBlock;
        break;
      case 'material':
        newBlock = {
          ...commonProps,
          type: 'material',
          materialId: selectedMaterialId,
        } as MaterialBlock;
        break;
      case 'assignment':
        // Find the selected assignment to get its details
        const selectedAssignment = availableAssignments.find(a => a.id === selectedAssignmentId);
        
        newBlock = {
          ...commonProps,
          type: 'assignment',
          assignmentId: selectedAssignmentId,
          // Store additional metadata to make the block more resilient
          assignmentName: selectedAssignment?.title || blockTitle,
          assignmentDescription: selectedAssignment?.description || '',
          dueDate: selectedAssignment?.dueDate || ''
        } as AssignmentBlock;
        
        if (assignmentFiles.length > 0 && selectedAssignmentId) {
          setUploadingFiles(true);
          try {
            // Upload all files and associate them with the assignment
            const uploadPromises = assignmentFiles.map(async (file) => {
              try {
                // Optional: Rename the file to include the assignment ID for better tracking
                const fileExtension = file.name.split('.').pop();
                const fileNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.'));
                
                // Create a new file with renamed filename including assignment ID
                const renamedFile = new File(
                  [file], 
                  `${fileNameWithoutExtension}_assignment-${selectedAssignmentId}.${fileExtension}`, 
                  { type: file.type }
                );
                
                console.log(`Uploading file for assignment ${selectedAssignmentId}:`, renamedFile.name);
                
                // Use the explicit assignment association method
                return await fileUploadService.uploadFileForAssignment(
                  renamedFile, 
                  Number(selectedAssignmentId)
                );
              } catch (error) {
                console.error(`Error uploading file ${file.name}:`, error);
                return null;
              }
            });
            
            const uploadResults = await Promise.all(uploadPromises);
            const successfulUploads = uploadResults.filter(Boolean).length;
            
            console.log(`Successfully uploaded ${successfulUploads} of ${assignmentFiles.length} files`);
          } catch (error) {
            console.error('Error uploading assignment files:', error);
          } finally {
            setUploadingFiles(false);
          }
        }
        break;
      case 'test':
        // Create a new test block
        newBlock = {
          ...commonProps,
          type: 'test',
          testId: selectedTestId,
          proctored: isProctored,
          showResults,
          timeLimit: testTimeLimit,
          passingScore: testPassingScore,
          attempts: testAttempts,
          dueDate: testDueDate,
          allowedResources
        } as TestBlock;
        break;
      case 'html':
        newBlock = {
          ...commonProps,
          type: 'html',
          content: blockContent,
        } as HtmlBlock;
        break;
      case 'group':
        console.log('Creating group block with description:', groupDescription);
        // Ensure existing blocks array is preserved when editing
        const existingBlocks = editingBlock?.id && editingBlock.type === 'group' 
          ? (editingBlock as BlockGroup).blocks || [] 
          : [];
          
        newBlock = {
          ...commonProps,
          type: 'group',
          description: groupDescription,
          blocks: existingBlocks,
        } as BlockGroup;
        
        console.log('New group block with blocks:', (newBlock as BlockGroup).blocks);
        break;
      default:
        return;
    }
    
    console.log('Saving block:', newBlock);
    onSave(newBlock);
    handleClose();
  };

  // Renderöi lomake lohkon tyypin mukaan
  const renderFormByType = () => {
    console.log('renderFormByType kutsuttu, blockType:', blockType);
    
    switch (blockType) {
      case 'text':
        return (
          <Box sx={{ position: 'relative' }}>
            {/* Loading indicator for image uploads */}
            {isUploadingTextImage && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  padding: '4px 8px',
                  borderRadius: 1,
                  zIndex: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <CircularProgress size={16} />
                <Box sx={{ fontSize: '0.8rem' }}>Uploading image...</Box>
              </Box>
            )}
            
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Text Content"
              value={blockContent}
              onChange={(e) => setBlockContent(e.target.value)}
              variant="outlined"
              margin="normal"
              InputProps={{
                onPaste: handleTextBlockPaste,
                onSelect: handleTextFieldSelect
              }}
              helperText="You can paste images directly from clipboard (Ctrl+V)"
            />
          </Box>
        );
      case 'image':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                variant={imageInputMethod === 'url' ? 'contained' : 'outlined'}
                onClick={() => setImageInputMethod('url')}
                sx={{ mr: 1 }}
              >
                URL
              </Button>
              <Button
                variant={imageInputMethod === 'upload' ? 'contained' : 'outlined'}
                onClick={() => setImageInputMethod('upload')}
              >
                Upload
              </Button>
            </Box>
            
            {imageInputMethod === 'url' ? (
              <TextField
                fullWidth
                label="Image URL"
                value={blockContent}
                onChange={(e) => setBlockContent(e.target.value)}
                variant="outlined"
                margin="normal"
                helperText="Enter the direct URL to an image"
              />
            ) : (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Please use the Material upload feature to upload images
                </Typography>
                
                <MaterialUpload 
                  courseId={courseId || ''} 
                  onUploadSuccess={handleMaterialUploadSuccess}
                />
              </Box>
            )}
          </Box>
        );
      case 'material':
        return (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="material-select-label">Material</InputLabel>
              <Select
                labelId="material-select-label"
                id="material-select"
                value={selectedMaterialId}
                label="Material"
                onChange={(e) => setSelectedMaterialId(e.target.value)}
              >
                {availableMaterials.map((material) => (
                  <MenuItem key={material.id} value={material.id}>
                    {material.title || material.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Or upload a new material:
            </Typography>
            
            <MaterialUpload 
              courseId={courseId || ''} 
              onUploadSuccess={handleMaterialUploadSuccess}
            />
          </>
        );
      case 'assignment':
        return (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="assignment-select-label">Assignment</InputLabel>
              <Select
                labelId="assignment-select-label"
                id="assignment-select"
                value={selectedAssignmentId}
                label="Assignment"
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                disabled={loadingAssignments}
              >
                {loadingAssignments ? (
                  <MenuItem value="" disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading assignments...
                    </Box>
                  </MenuItem>
                ) : availableAssignments.length === 0 ? (
                  <MenuItem value="" disabled>
                    No assignments available
                  </MenuItem>
                ) : (
                  availableAssignments.map((assignment) => (
                    <MenuItem 
                      key={assignment.id} 
                      value={assignment.id}
                      disabled={['no-course', 'no-assignments', 'error'].includes(assignment.id)}
                    >
                      {assignment.title}
                      {assignment.description && ['no-assignments', 'error', 'no-course'].includes(assignment.id) && (
                        <Typography variant="caption" component="div" color="text.secondary">
                          {assignment.description}
                        </Typography>
                      )}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            
            {courseId && !loadingAssignments && availableAssignments.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No assignments found for this course. Please create assignments in the Assignments tab first.
              </Alert>
            )}
            
            {!courseId && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                A course ID is required to load assignments. Please make sure you are editing content for a specific course.
              </Alert>
            )}
            
            {/* Add button to refresh assignments list */}
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => fetchAssignments()}
                disabled={loadingAssignments || !courseId}
                startIcon={loadingAssignments ? <CircularProgress size={20} /> : undefined}
              >
                {loadingAssignments ? 'Loading...' : 'Refresh Assignment List'}
              </Button>
            </Box>
            
            {/* Add this section for assignment description */}
            {selectedAssignmentId && !['no-course', 'no-assignments', 'error'].includes(selectedAssignmentId) && (
              <Box sx={{ position: 'relative', mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add instructions or description (supports images):
                </Typography>
                
                {/* Loading indicator for image uploads */}
                {isUploadingTextImage && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      padding: '4px 8px',
                      borderRadius: 1,
                      zIndex: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <CircularProgress size={16} />
                    <Box sx={{ fontSize: '0.8rem' }}>Uploading image...</Box>
                  </Box>
                )}
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Additional Instructions"
                  value={blockContent}
                  onChange={(e) => setBlockContent(e.target.value)}
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    onPaste: handleTextBlockPaste,
                    onSelect: handleTextFieldSelect
                  }}
                  helperText="You can paste images directly from clipboard (Ctrl+V)"
                />
              </Box>
            )}
            
            {/* Existing file upload section */}
            {selectedAssignmentId && !['no-course', 'no-assignments', 'error'].includes(selectedAssignmentId) && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Attach files to this assignment:
                </Typography>
                
                <input
                  ref={assignmentFileInputRef}
                  type="file"
                  multiple
                  onChange={handleAssignmentFileSelect}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => assignmentFileInputRef.current?.click()}
                  size="small"
                  sx={{ mb: 1 }}
                >
                  Select Files
                </Button>
                
                {assignmentFiles.length > 0 && (
                  <List dense>
                    {assignmentFiles.map((file, index) => (
                      <ListItem key={index} dense>
                        <ListItemIcon>
                          <InsertDriveFile fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={file.name}
                          secondary={`${(file.size / 1024).toFixed(2)} KB`}
                        />
                        <IconButton edge="end" onClick={() => handleRemoveAssignmentFile(index)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
                
                {uploadingFiles && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress />
                  </Box>
                )}
              </Box>
            )}
          </>
        );
      case 'test':
        return (
          <Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="test-select-label">Test</InputLabel>
              <Select
                labelId="test-select-label"
                id="test-select"
                value={selectedTestId}
                label="Test"
                onChange={(e) => setSelectedTestId(e.target.value)}
                disabled={loadingTests}
              >
                {loadingTests ? (
                  <MenuItem value="" disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading tests...
                    </Box>
                  </MenuItem>
                ) : availableTests.length === 0 ? (
                  <MenuItem value="" disabled>
                    No tests available - create one first
                  </MenuItem>
                ) : (
                  availableTests.map((test) => (
                    <MenuItem key={test.Id} value={test.Id}>
                      {test.Title}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={isProctored}
                    onChange={(e) => setIsProctored(e.target.checked)}
                  />
                }
                label="Proctored exam"
              />
            </FormGroup>
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="show-results-label">Show Results</InputLabel>
              <Select
                labelId="show-results-label"
                id="show-results-select"
                value={showResults}
                label="Show Results"
                onChange={(e) => setShowResults(e.target.value as 'immediately' | 'after_due_date' | 'manual')}
              >
                <MenuItem value="immediately">Immediately</MenuItem>
                <MenuItem value="after_due_date">After Due Date</MenuItem>
                <MenuItem value="manual">Manual (Teacher Controlled)</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Time limit (minutes)"
              type="number"
              value={testTimeLimit}
              onChange={(e) => setTestTimeLimit(parseInt(e.target.value) || 60)}
              fullWidth
              margin="normal"
              InputProps={{ inputProps: { min: 1 } }}
              required
            />
            
            <TextField
              label="Passing score"
              type="number"
              value={testPassingScore}
              onChange={(e) => setTestPassingScore(parseInt(e.target.value) || 60)}
              fullWidth
              margin="normal"
              InputProps={{ inputProps: { min: 0, max: 100 } }}
              required
            />
            
            <TextField
              label="Maximum attempts"
              type="number"
              value={testAttempts}
              onChange={(e) => setTestAttempts(parseInt(e.target.value) || 1)}
              fullWidth
              margin="normal"
              InputProps={{ inputProps: { min: 1 } }}
              required
            />
            
            <TextField
              label="Due date (optional)"
              type="datetime-local"
              value={testDueDate || ''}
              onChange={(e) => setTestDueDate(e.target.value || undefined)}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            
            {!courseId && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                A course ID is required to load tests. Please make sure you are editing content for a specific course.
              </Alert>
            )}
          </Box>
        );
      case 'html':
        return (
          <Box sx={{ position: 'relative' }}>
            {/* Loading indicator for image uploads */}
            {isUploadingTextImage && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  padding: '4px 8px',
                  borderRadius: 1,
                  zIndex: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <CircularProgress size={16} />
                <Box sx={{ fontSize: '0.8rem' }}>Uploading image...</Box>
              </Box>
            )}
            
            <TextField
              fullWidth
              multiline
              rows={6}
              label="HTML Content"
              value={blockContent}
              onChange={(e) => setBlockContent(e.target.value)}
              variant="outlined"
              margin="normal"
              InputProps={{
                onPaste: handleTextBlockPaste,
                onSelect: handleTextFieldSelect
              }}
              helperText="You can paste images directly from clipboard (Ctrl+V)"
            />
          </Box>
        );
      case 'group':
        return (
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Group Description"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            variant="outlined"
            margin="normal"
            placeholder="Optional description for this group"
          />
        );
      case 'markdown':
        return (
          <MarkdownEditor
            value={blockContent}
            onChange={setBlockContent}
          />
        );
      default:
        return null;
    }
  };

  // Lisätään debug-logitus blokkityypin muutokselle
  const handleBlockTypeChange = (newType: BlockType) => {
    console.log('handleBlockTypeChange called:', newType, 'previous type:', blockType);
    setBlockType(newType);
    
    // Reset fields but don't call resetForm() which resets the type back to 'text'
    setBlockTitle(editingBlock?.title || '');
    setBlockContent('');
    setGroupDescription('');
    setBlockImageUrl('');
    setSelectedMaterialId('');
    setSelectedAssignmentId('');
    setSelectedTestId('');
    setImageInputMethod('url');
    setIsVisible(editingBlock?.isVisible !== false);
    
    // Fetch materials or assignments if needed
    if (newType === 'material') {
      console.log('Fetching materials...');
      fetchMaterials();
    } else if (newType === 'assignment') {
      console.log('Fetching assignments...');
      fetchAssignments();
    } else if (newType === 'test') {
      console.log('Fetching tests...');
      fetchTests();
    } else if (newType === 'group') {
      console.log('Setting up group block...');
    }
  };

  const handleClose = () => {
    resetForm('text'); // Reset to default state
    setAssignmentFiles([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingBlock?.id 
          ? 'Muokkaa lohkoa' 
          : editingBlock?.type === 'group' 
            ? 'Luo uusi lohkoryhma' 
            : 'Lisää uusi lohko'
        }
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="block-type-label">Lohkon tyyppi</InputLabel>
            <Select
              labelId="block-type-label"
              id="block-type-select"
              value={blockType}
              label="Lohkon tyyppi"
              onChange={(e) => {
                const newType = e.target.value as BlockType;
                console.log('Select onChange triggered for block type:', newType);
                handleBlockTypeChange(newType);
              }}
              disabled={!!editingBlock?.id}
            >
              <MenuItem value="text">Teksti</MenuItem>
              <MenuItem value="markdown">Markdown</MenuItem>
              <MenuItem value="image">Kuva</MenuItem>
              <MenuItem value="material">Materiaali</MenuItem>
              <MenuItem value="assignment">Tehtava</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
              <MenuItem value="group">Lohkoryhma</MenuItem>
              <MenuItem value="test">Test</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Otsikko"
            fullWidth
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
            margin="normal"
            required
          />

          {process.env.NODE_ENV === 'development' && (
            <FormControlLabel
              control={
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsVisible(e.target.checked)}
                />
              }
              label="Visible in course"
            />
          )}

          {renderFormByType()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Peruuta</Button>
        <Button 
          onClick={handleSaveBlock} 
          variant="contained" 
          color="primary"
          disabled={
            !blockTitle || 
            (blockType === 'material' && !selectedMaterialId) || 
            (blockType === 'assignment' && !selectedAssignmentId) ||
            (blockType === 'test' && !selectedTestId) ||
            (blockType === 'group' && !groupDescription)
          }
        >
          Tallenna
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 