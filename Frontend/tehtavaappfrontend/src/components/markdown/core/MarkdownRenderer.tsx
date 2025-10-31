/**
 * Markdown Rendering System - Core Renderer
 * 
 * This is the main markdown renderer component that orchestrates the rendering process
 * and manages plugins.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import { Components } from 'react-markdown';

// Import interfaces and plugin system
import { 
  MarkdownRendererProps, 
  MarkdownRendererOptions
} from './interfaces';
import { pluginManager } from './plugins';
import { DEFAULT_FEATURES } from './registry';

// Default styling
import '../../../styles/markdown.css';

/**
 * Main Markdown Renderer Component
 * 
 * This component handles the rendering of markdown content.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps & { options?: MarkdownRendererOptions }> = ({ 
  children, 
  className,
  options 
}) => {
  // Create refs for DOM access
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Derive feature flags
  const features = useMemo(() => {
    return {
      ...DEFAULT_FEATURES,
      ...options?.features
    };
  }, [options?.features]);
  
  // Process content
  const processedContent = useMemo(() => {
    // Just return the content as is
    return children;
  }, [children]);
  
  // Initialize plugins
  useEffect(() => {
    const initPlugins = async () => {
      try {
        await pluginManager.initializePlugins();
      } catch (error: unknown) {
        console.error('Error initializing plugins:', error);
      }
    };
    
    initPlugins();
    
    // Cleanup
    return () => {
      pluginManager.cleanupPlugins();
    };
  }, []);
  
  // Custom components for markdown rendering
  const components: Components = {
    // Add basic styling for paragraphs
    p: (props) => {
      return <p style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }} {...props} />;
    },
    
    // Add styling for headings
    h1: (props) => <h1 style={{ marginTop: '1.5rem', marginBottom: '1rem' }} {...props} />,
    h2: (props) => <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem' }} {...props} />,
    h3: (props) => <h3 style={{ marginTop: '1.2rem', marginBottom: '0.8rem' }} {...props} />,
    h4: (props) => <h4 style={{ marginTop: '1rem', marginBottom: '0.8rem' }} {...props} />,
    h5: (props) => <h5 style={{ marginTop: '0.8rem', marginBottom: '0.6rem' }} {...props} />,
    h6: (props) => <h6 style={{ marginTop: '0.8rem', marginBottom: '0.6rem' }} {...props} />,
    
    // Table styling
    table: (props) => (
      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }} {...props} />
      </div>
    ),
    
    tr: (props) => <tr style={{ borderBottom: '1px solid #ddd' }} {...props} />,
    
    th: (props) => (
      <th 
        style={{ 
          padding: '8px', 
          textAlign: 'left', 
          fontWeight: 'bold',
          borderBottom: '2px solid #ddd' 
        }} 
        {...props} 
      />
    ),
    
    td: (props) => (
      <td 
        style={{ 
          padding: '8px', 
          borderBottom: '1px solid #ddd',
          verticalAlign: 'top' 
        }} 
        {...props} 
      />
    ),
    
    // List styling
    ul: (props) => <ul style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />,
    ol: (props) => <ol style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />,
    li: (props) => <li style={{ marginBottom: '0.5rem' }} {...props} />,
    
    // Code styling
    code: ({ className, children, ...props }) => {
      // Convert children to string safely
      const content = children?.toString() || '';
      const language = className?.replace('language-', '') || '';
      
      // Regular code block
      return (
        <pre 
          style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '1rem', 
            borderRadius: '4px',
            overflow: 'auto',
            maxWidth: '100%',
            marginBottom: '1rem'
          }}
        >
          <code className={className} {...props}>
            {content}
          </code>
        </pre>
      );
    }
  };
  
  // Construct the remark plugins array
  const remarkPlugins = [];
  
  // Add GitHub Flavored Markdown if enabled
  if (features.gfm) {
    remarkPlugins.push(remarkGfm);
  }
  
  // Always add line breaks
  remarkPlugins.push(remarkBreaks);
  
  // Construct the rehype plugins array
  const rehypePlugins = [rehypeRaw];
  
  return (
    <div 
      ref={containerRef}
      className={`markdown-renderer ${className || ''}`}
    >
      <ReactMarkdown
        components={components}
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 