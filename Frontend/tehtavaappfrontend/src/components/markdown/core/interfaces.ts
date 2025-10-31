/**
 * Markdown Rendering System - Core Interfaces
 * 
 * This file defines the interfaces used throughout the markdown rendering system.
 * It follows a plugin-based architecture to allow for extensions.
 */

/**
 * Base interface for all markdown renderers
 */
export interface MarkdownRendererProps {
  /** The markdown content to render */
  children: string;
  /** Optional class name to apply to the container */
  className?: string;
}

/**
 * Interface for plugin renderers
 */
export interface MarkdownRendererPlugin {
  /** Unique identifier for the plugin */
  id: string;
  /** Human-readable name */
  name: string;
  /** Plugin initialization */
  initialize?: () => Promise<void> | void;
  /** Plugin cleanup */
  cleanup?: () => void;
}

/**
 * Plugin manager interface
 */
export interface PluginManager {
  /** Register a plugin */
  registerPlugin: (plugin: MarkdownRendererPlugin) => void;
  /** Get plugin by ID */
  getPlugin: (id: string) => MarkdownRendererPlugin | undefined;
  /** Get all plugins */
  getAllPlugins: () => MarkdownRendererPlugin[];
  /** Initialize all plugins */
  initializePlugins: () => Promise<void>;
  /** Clean up all plugins */
  cleanupPlugins: () => void;
}

/**
 * Configuration options for markdown renderer
 */
export interface MarkdownRendererOptions {
  /** Enable or disable specific features */
  features?: {
    /** Enable GitHub Flavored Markdown */
    gfm?: boolean;
    /** Enable syntax highlighting */
    syntaxHighlighting?: boolean;
  };
  /** Plugin instance overrides */
  plugins?: Record<string, MarkdownRendererPlugin>;
} 