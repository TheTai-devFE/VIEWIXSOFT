import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mdxPlugin } from './src/lib/mdx/plugin.ts'
import { nitro } from 'nitro/vite'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ command }) => ({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    mdxPlugin(),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    // Production builds target Cloudflare Workers; `pnpm dev` stays on Node.
    nitro(command === 'build' ? { preset: 'cloudflare_module' } : {}),
  ],
}))
