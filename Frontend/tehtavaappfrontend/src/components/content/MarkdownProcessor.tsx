import React from 'react';
import ReactMarkdown from 'react-markdown';
import { getFixedImageUrl } from '../../utils/imageUtils';
import rehypeRaw from 'rehype-raw';
import { ProxyImage } from '../common';

interface MarkdownProcessorProps {
  content: string;
  className?: string;
}

/**
 * Component that processes markdown content and fixes blob storage image URLs
 * before rendering them
 */
const MarkdownProcessor: React.FC<MarkdownProcessorProps> = ({ content, className = '' }) => {
  // Pre-process markdown content to fix image URLs before rendering
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    
    console.log('Processing markdown content for image URLs...');
    
    // This regex specifically targets markdown image syntax: ![alt](url)
    const processed = content.replace(
      /!\[(.*?)\]\((https?:\/\/tehtavatblocproduction\.blob\.core\.windows\.net\/[^)]+)\)/g,
      (match, alt, url) => {
        const fixedUrl = getFixedImageUrl(url);
        console.log(`Fixed markdown image URL: ${url} -> ${fixedUrl}`);
        return `![${alt}](${fixedUrl})`;
      }
    );
    
    return processed;
  }, [content]);

  // Custom renderer for images as an additional safety measure
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
    <div className={className}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={customRenderers}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownProcessor; 