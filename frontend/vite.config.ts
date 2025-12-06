import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.DECKBOT_API_URL || 'http://localhost:5555',
        changeOrigin: true,
      },
      '/events': {
        target: process.env.DECKBOT_API_URL || 'http://localhost:5555',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../src/deckbot/static/dist',
    emptyOutDir: true,
  },
})
