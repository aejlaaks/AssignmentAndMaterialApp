import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Use esbuild for minification (faster and more reliable than terser)
    minify: 'esbuild',
    // Increase the chunk size warning limit
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
    // Use a simpler chunking strategy
    rollupOptions: {
      output: {
        // Function-based manual chunks to properly handle all node_modules
        manualChunks: (id) => {
          // Only separate node_modules into a single vendor bundle
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  // Optimized dependency settings
  optimizeDeps: {
    // Explicitly include dependencies that need to be pre-bundled
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'react-redux',
      '@reduxjs/toolkit'
    ]
  },
  server: {
    port: 5173,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 1000,
    }
  }
})
