// Lohkokomponenttien vienti
export * from './BlockDialog';
export * from './BlockList';
export * from './BlockRenderer';
export * from './StudentBlockList';
export * from './BlockDebugger';
export * from './StudentBlockRenderer';

// New block components with specific exports to avoid name conflicts
export { BlockListNew } from './BlockListNew';
// Export the new unified renderer as BlockRendererNew for backward compatibility
export { BlockRenderer as BlockRendererNew } from './renderer';
export { StudentBlockListNew } from './StudentBlockListNew';
export { StudentBlockRendererNew } from './StudentBlockRendererNew';
export { NativeNestedBlockList } from './NativeNestedBlockList';
export { BlockDialogNew } from './BlockDialogNew';

// Export specific components from the renderer directory
export { BlockContainer, BlockActions, BlockContentRenderer } from './renderer';
// Export the props interface for reuse
export type { BlockRendererProps } from './renderer';

// Export block editors
export { 
  BlockEditor,
  TextBlockEditor,
  MarkdownBlockEditor,
  ImageBlockEditor,
  MaterialBlockEditor,
  AssignmentBlockEditor,
  HtmlBlockEditor,
  GroupBlockEditor,
  TestBlockEditor,
  BlockCommonFields
} from './editors';
export type { BlockEditorProps } from './editors';

// Export hooks and context for managing blocks
export * from './hooks';
export * from './context';

// Export common utilities and components
export * from './common'; 