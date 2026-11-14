import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Runs the Vercel functions in /api during `npm run dev`, so comments work
 * locally. Without a Brevo key, emails (and codes) print in this terminal.
 */
function apiInDev(env) {
  return {
    name: 'api-in-dev',
    configureServer(server) {
      Object.assign(process.env, env, { DEV_EMAIL_LOG: '1' })

      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next()
        const route = req.url.split('?')[0].replace(/\/$/, '')
        const file = [`${route}.js`, `${route}/index.js`]
          .map((p) => path.join(server.config.root, p))
          .find((p) => fs.existsSync(p) && !p.includes(`${path.sep}_`))
        if (!file) return next()

        let raw = ''
        for await (const chunk of req) raw += chunk
        try {
          req.body = raw ? JSON.parse(raw) : {}
        } catch {
          req.body = {}
        }
        res.status = (code) => ((res.statusCode = code), res)
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }

        const { default: handler } = await server.ssrLoadModule(file)
        await handler(req, res)
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), apiInDev(loadEnv(mode, process.cwd(), ''))],
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
}))
