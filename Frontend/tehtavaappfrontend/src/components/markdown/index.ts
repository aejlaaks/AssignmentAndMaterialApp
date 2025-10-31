/**
 * Markdown Rendering System - Main Exports
 * 
 * This file exports all components and utilities from the markdown rendering system.
 */

// Register all plugins - this import has side effects
import './core/registry';

// Export main renderer
export { default as MarkdownRenderer } from './core/MarkdownRenderer';

// Export interfaces
export * from './core/interfaces';

// Export plugin manager and features
export { pluginManager } from './core/plugins';
export { DEFAULT_FEATURES } from './core/registry'; 