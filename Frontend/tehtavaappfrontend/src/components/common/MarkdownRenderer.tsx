import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import { Components } from 'react-markdown';
import '../../styles/markdown.css';
import { getFixedImageUrl } from '../../utils/imageUtils';
import { ProxyImage } from './index';

// Define props
interface MarkdownRendererProps {
  children: string;
  className?: string;
}

// Helper for newlines in text
const NewlineText: React.FC<{ text: string }> = ({ text }) => {
  return <>{text.split('\n').map((str, i) => <React.Fragment key={i}>{str}<br /></React.Fragment>)}</>;
};

// Preprocess markdown content
const preprocessMarkdown = (content: string): string => {
  if (!content) return '';
  
  // Fix common markdown issues
  let processedContent = content;
  
  // Fix missing spaces after headings
  processedContent = processedContent.replace(/^(#{1,6})([^#\s])/gm, '$1 $2');
  
  // Fix bullet points
  processedContent = processedContent.replace(/^([*\-+])([^\s])/gm, '$1 $2');
  
  // Fix numbered lists
  processedContent = processedContent.replace(/^(\d+\.)([^\s])/gm, '$1 $2');
  
  // Fix tables
  processedContent = fixTableContent(processedContent);
  
  // Fix image URLs in markdown notation
  processedContent = processedContent.replace(
    /!\[(.*?)\]\((https?:\/\/tehtavatblocproduction\.blob\.core\.windows\.net\/[^)]+)\)/g,
    (match, alt, url) => {
      const fixedUrl = getFixedImageUrl(url);
      console.log(`Fixed markdown image URL in preprocessor: ${url} -> ${fixedUrl}`);
      return `![${alt}](${fixedUrl})`;
    }
  );
  
  return processedContent;
};

// Fix common table formatting issues
const fixTableContent = (content: string): string => {
  // Regex to detect if there might be a table in the content
  const tableRowPattern = /\|.*\|/;
  
  // If no potential table row is found, return content as is
  if (!tableRowPattern.test(content)) {
    return content;
  }
  
  // Fix missing spaces in table cells
  let lines = content.split('\n');
  let fixedLines = lines.map(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      // This looks like a table row, fix spaces between cell content and |
      return line.replace(/\|([^\s|])/g, '| $1').replace(/([^\s|])\|/g, '$1 |');
    }
    return line;
  });
  
  return fixedLines.join('\n');
};

// Table renderer component that adds responsive styling
const TableRenderer = ({ node, ...props }: any) => {
  return (
    <div style={{ 
      overflowX: 'auto', 
      maxWidth: '100%', 
      marginTop: '1em',
      marginBottom: '1em'
    }}>
      <table {...props} style={{
        borderCollapse: 'collapse',
        width: '100%',
        marginBottom: '0',
      }} />
    </div>
  );
};

// Helper to clean up spacing around tables
const cleanupDomSpacingForTables = (container: HTMLElement) => {
  if (!container) return;
  
  // Find all tables
  const tables = container.querySelectorAll('table');
  
  tables.forEach((table) => {
    // Find parent paragraph (if any)
    const parentParagraph = table.closest('p');
    if (parentParagraph) {
      // Replace the paragraph with the table
      parentParagraph.replaceWith(table);
    }
  });
};

// Main markdown renderer component
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const processedContent = preprocessMarkdown(children);
  
  // Generate simple hash for content (for diffing)
  const generateHash = (text: string): number => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };
  
  // Content hash for efficient re-rendering
  const contentHash = generateHash(processedContent);
  
  // Fix unicode characters in markdown
  const fixUnicodeCharacters = (text: string): string => {
    if (!text) return '';
    
    // Replace common problematic unicode chars
    return text
      .replace(/[\u2018\u2019]/g, "'") // Smart quotes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/\u2014/g, '--') // Em dash
      .replace(/\u2013/g, '-') // En dash
      .replace(/\u2026/g, '...'); // Ellipsis
  };
  
  // Clean up HTML after rendering
  useEffect(() => {
    if (containerRef.current) {
      // Clean up table spacing
      cleanupDomSpacingForTables(containerRef.current);
    }
  }, [contentHash]);
  
  // Fix common spacing issues
  const cleanupDomSpacingForTables = (container: HTMLElement) => {
    if (!container) return;
    
    // Fix table spacing
    const tables = container.querySelectorAll('table');
    tables.forEach(table => {
      // If table is inside a paragraph, move it out
      const parent = table.parentElement;
      if (parent?.tagName.toLowerCase() === 'p') {
        parent.parentElement?.insertBefore(table, parent);
        
        // If the paragraph is now empty, remove it
        if (parent.innerHTML.trim() === '') {
          parent.remove();
        }
      }
    });
  };
  
  // Define custom components for markdown
  const components: Components = {
    // Style paragraphs
    p: (props) => <p style={{ marginBottom: '1rem' }} {...props} />,
    
    // Style headings
    h1: (props) => <h1 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }} {...props} />,
    h2: (props) => <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }} {...props} />,
    h3: (props) => <h3 style={{ marginTop: '1.2rem', marginBottom: '0.8rem', fontWeight: 'bold' }} {...props} />,
    h4: (props) => <h4 style={{ marginTop: '1.2rem', marginBottom: '0.8rem', fontWeight: 'bold' }} {...props} />,
    h5: (props) => <h5 style={{ marginTop: '1.2rem', marginBottom: '0.8rem', fontWeight: 'bold' }} {...props} />,
    h6: (props) => <h6 style={{ marginTop: '1.2rem', marginBottom: '0.8rem', fontWeight: 'bold' }} {...props} />,
    
    // Style tables
    table: TableRenderer,
    th: (props) => <th style={{ 
      padding: '10px', 
      textAlign: 'left', 
      borderBottom: '2px solid #ddd',
      fontWeight: 'bold' 
    }} {...props} />,
    td: (props) => <td style={{ 
      padding: '10px', 
      borderBottom: '1px solid #eee',
      verticalAlign: 'top'
    }} {...props} />,
    
    // Style lists
    ul: (props) => <ul style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />,
    ol: (props) => <ol style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />,
    li: (props) => <li style={{ marginBottom: '0.5rem' }} {...props} />,
    
    // Style code blocks
    code: ({ className, children, ...props }) => {
      const language = className ? className.replace(/language-/, '') : '';
      
      if (className) {
        // This is a code block (not inline code)
        return (
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            marginBottom: '1.5rem',
            fontSize: '0.9em',
            lineHeight: 1.4
          }}>
            <code className={className} {...props}>{children}</code>
          </pre>
        );
      }
      
      // Inline code
      return (
        <code
          style={{
            backgroundColor: '#f5f5f5',
            padding: '2px 4px',
            borderRadius: '4px',
            color: '#e83e8c',
            fontSize: '0.9em'
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    
    // Custom image component to use ProxyImage
    img: ({ src, alt, ...props }) => {
      return (
        <ProxyImage
          src={src || ''}
          alt={alt || ''}
          {...props}
          style={{
            maxWidth: '100%',
            height: 'auto',
            ...(props.style as React.CSSProperties || {})
          }}
        />
      );
    }
  };
  
  return (
    <div ref={containerRef} className={`markdown-content ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {fixUnicodeCharacters(processedContent)}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

