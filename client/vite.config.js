import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Increase warning threshold (chart.js alone is ~200KB minified)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split the bundle into smaller cacheable chunks
        manualChunks: {
          // React core — changes rarely, stays cached between deploys
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Chart.js — large library, isolate it so app code changes don't bust its cache
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          // Icon library — large but static
          'vendor-icons': ['react-icons'],
          // Small utilities
          'vendor-utils': ['axios', 'react-hot-toast'],
        },
      },
    },
  },
})
