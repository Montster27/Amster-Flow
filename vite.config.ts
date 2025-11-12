import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Only use HTTPS in local development if certificates exist
const useHttps = fs.existsSync('./localhost+2-key.pem') && fs.existsSync('./localhost+2.pem')

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    https: useHttps ? {
      key: fs.readFileSync('./localhost+2-key.pem'),
      cert: fs.readFileSync('./localhost+2.pem'),
    } : undefined,
  },
  build: {
    // Enable source maps for production debugging
    sourcemap: true,
    // Raise chunk size warning limit temporarily (will reduce bundle size below)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and initial load performance
        manualChunks: {
          // PDF generation tools - heavy libraries, loaded on-demand
          'pdf-tools': ['jspdf', 'html2canvas'],
          // React core - changes rarely, good for caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase - authentication and database client
          'supabase': ['@supabase/supabase-js', '@supabase/auth-ui-react'],
        },
      },
    },
  },
})
