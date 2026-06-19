import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build works from the Cloudflare Pages root (account 0, no basePath).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          genlayer: ['genlayer-js'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion']
        }
      }
    }
  }
})
