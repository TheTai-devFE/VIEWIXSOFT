import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig, loadEnv } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mdxPlugin } from './src/lib/mdx/plugin.ts'
import { nitro } from 'nitro/vite'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ command, mode }) => {
  // A NODE_ENV=development left in .env makes Vite emit dev-only JSX, which
  // crashes the production Worker. Refuse to build like that.
  // loadEnv moves a NODE_ENV found in .env files to VITE_USER_NODE_ENV.
  loadEnv(mode, process.cwd(), '')
  if (command === 'build' && process.env.VITE_USER_NODE_ENV === 'development') {
    throw new Error('NODE_ENV=development is set (check .env). Remove it before building for production.')
  }
  return {
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
}
})
