import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { fixContentImageUrls } from '../../utils/imageUtils';
import ProxyImage from '../common/ProxyImage';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * A component that renders markdown content with proper image proxying
 * for private blob storage URLs
 */
const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const [processedContent, setProcessedContent] = useState<string>('');
  
  useEffect(() => {
    if (content) {
      // Apply URL fixing to all blob storage URLs in the content
      const fixed = fixContentImageUrls(content);
      setProcessedContent(fixed);
    } else {
      setProcessedContent('');
    }
  }, [content]);
  
  // Fix the type issue with the custom renderer
  const customRenderers = {
    img: (props: React.ComponentPropsWithoutRef<'img'>) => (
      <ProxyImage 
        src={props.src || ''} 
        alt={props.alt || ''} 
        width={props.width}
        height={props.height}
        className={props.className}
      />
    ),
  };
  
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={customRenderers}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent; 