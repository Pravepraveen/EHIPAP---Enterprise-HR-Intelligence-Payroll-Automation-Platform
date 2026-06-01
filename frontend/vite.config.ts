import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8880',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    target: 'es2015',
    sourcemap: false,
  }
}))
