/**
 * Plugin Manager
 * 
 * This file provides the plugin management system for the markdown renderer.
 */
import { MarkdownRendererPlugin } from './interfaces';

/**
 * Plugin Manager class for Markdown renderer
 */
export class PluginManager {
  private plugins = new Map<string, MarkdownRendererPlugin>();
  
  /**
   * Register a plugin with the manager
   */
  public registerPlugin(id: string, plugin: MarkdownRendererPlugin): void {
    console.log(`Registering plugin: ${id} (${plugin.name})`);
    this.plugins.set(id, plugin);
  }
  
  /**
   * Get a plugin by ID
   */
  public getPlugin(id: string): MarkdownRendererPlugin | undefined {
    console.log(`Looking up plugin: ${id}`);
    const plugin = this.plugins.get(id);
    if (!plugin) {
      console.warn(`Plugin ${id} not found`);
    }
    return plugin;
  }
  
  /**
   * Get all registered plugins
   */
  public getPlugins(): Map<string, MarkdownRendererPlugin> {
    return this.plugins;
  }
  
  /**
   * Initialize all plugins
   */
  public async initializePlugins(): Promise<void> {
    const initPromises: Promise<void>[] = [];
    
    for (const [id, plugin] of this.plugins) {
      if (plugin.initialize) {
        console.log(`Initializing plugin: ${id}`);
        const result = plugin.initialize();
        if (result instanceof Promise) {
          initPromises.push(result);
        }
      }
    }
    
    // Wait for all promises to resolve
    if (initPromises.length > 0) {
      await Promise.all(initPromises);
    }
  }
  
  /**
   * Clean up resources for all plugins
   */
  public cleanupPlugins(): void {
    for (const [id, plugin] of this.plugins) {
      try {
        if (typeof plugin.cleanup === 'function') {
          console.log(`Cleaning up plugin: ${id}`);
          plugin.cleanup();
        }
      } catch (error) {
        console.error(`Error cleaning up plugin ${id}:`, error);
      }
    }
  }
}

// Create and export a singleton instance
export const pluginManager = new PluginManager(); 