import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const copySpaFallback = (): Plugin => ({
  name: 'copy-spa-fallback',
  closeBundle: () => {
    const indexPath = resolve(process.cwd(), 'dist/index.html')
    if (existsSync(indexPath)) {
      copyFileSync(indexPath, resolve(process.cwd(), 'dist/404.html'))
    }
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE || '/',
    plugins: [react(), tailwindcss(), copySpaFallback()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
