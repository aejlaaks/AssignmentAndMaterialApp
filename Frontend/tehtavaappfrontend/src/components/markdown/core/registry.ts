/**
 * Markdown Rendering System - Plugin Registry
 * 
 * This file registers all available plugins with the plugin manager.
 */
import { pluginManager } from './plugins';

// Default features configuration
export const DEFAULT_FEATURES = {
  gfm: true,
  syntaxHighlighting: true
};

/**
 * Register all default plugins
 */
export function registerPlugins(): void {
  console.log('Registering markdown renderer plugins...');
  
  console.log('All markdown renderer plugins registered');
  
  // Initialize plugins
  console.log('Initializing plugins...');
  pluginManager.getPlugins().forEach((plugin, id) => {
    if (plugin.initialize) {
      console.log(`Initializing plugin: ${id}`);
      const result = plugin.initialize();
      
      // Handle promise result if available
      if (result instanceof Promise) {
        result
          .then(() => console.log(`Plugin ${id} initialized successfully`))
          .catch((error: Error) => console.error(`Error initializing plugin ${id}:`, error));
      } else {
        console.log(`Plugin ${id} initialization completed`);
      }
    }
  });
}

// Register plugins when this module is imported
registerPlugins(); 