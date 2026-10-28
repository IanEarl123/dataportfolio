import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Split big libraries into their own cacheable chunks.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
})
