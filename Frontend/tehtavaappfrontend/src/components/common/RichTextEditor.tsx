import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';

// Note: You'll need to install these packages:
// npm install --save @tinymce/tinymce-react tinymce

interface EditorProps {
  apiKey?: string;
  initialValue: string;
  onEditorChange: (content: string, editor: any) => void;
  onInit: (evt: any, editor: any) => void;
  init: {
    height: number;
    menubar: boolean;
    plugins: string[];
    toolbar: string;
    content_style: string;
    placeholder: string;
    branding: boolean;
    promotion: boolean;
    statusbar: boolean;
    resize: boolean;
  };
}

// Create a mock Editor component that will be replaced with the actual TinyMCE editor
// when the dependency is installed
const MockEditor: React.FC<EditorProps> = ({ 
  initialValue, 
  onEditorChange, 
  init 
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="body2" color="error" gutterBottom>
        TinyMCE editor not available. Please install @tinymce/tinymce-react.
      </Typography>
      <textarea
        style={{ 
          width: '100%', 
          minHeight: typeof init.height === 'number' ? `${init.height}px` : init.height,
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
        value={initialValue}
        onChange={(e) => onEditorChange(e.target.value, null)}
        placeholder={init.placeholder}
      />
    </Paper>
  );
};

// Dynamically import the Editor component to avoid build errors
let Editor: React.ComponentType<EditorProps>;
try {
  // This is a workaround for the build process
  // In a real application, you would properly import the module
  Editor = require('@tinymce/tinymce-react').Editor;
} catch (error) {
  console.warn('TinyMCE editor not available, using fallback editor');
  Editor = MockEditor;
}

interface RichTextEditorProps {
  initialValue: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number | string;
  label?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  onChange,
  readOnly = false,
  placeholder = 'Enter text here...',
  minHeight = 300,
  label
}) => {
  const [content, setContent] = useState(initialValue);
  const editorRef = useRef<any>(null);
  
  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  const handleEditorChange = (content: string, editor: any) => {
    setContent(content);
    onChange(content);
  };

  // If in read-only mode, just display the HTML content
  if (readOnly) {
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
          '& img': { maxWidth: '100%' },
          '& table': { borderCollapse: 'collapse', width: '100%' },
          '& td, & th': { border: '1px solid #ddd', padding: '8px' },
          '& ul, & ol': { paddingLeft: '20px' },
          '& blockquote': { borderLeft: '3px solid #ccc', margin: '1.5em 10px', padding: '0.5em 10px' }
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </Paper>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Box sx={{ mb: 1, fontWeight: 'medium', fontSize: '0.875rem' }}>
          {label}
        </Box>
      )}
      <Editor
        apiKey="your-tinymce-api-key" // Replace with your TinyMCE API key
        onInit={(evt: any, editor: any) => editorRef.current = editor}
        initialValue={initialValue}
        onEditorChange={handleEditorChange}
        init={{
          height: typeof minHeight === 'number' ? minHeight : 300,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | formatselect | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          placeholder: placeholder,
          branding: false,
          promotion: false,
          statusbar: false,
          resize: false
        }}
      />
    </Box>
  );
};

export default RichTextEditor; 