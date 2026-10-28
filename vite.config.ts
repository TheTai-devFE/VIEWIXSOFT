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

function buildTarget() {
  if (process.env.VERCEL !== '1') return { preset: 'cloudflare_module' }
  // sin1 sits next to the Neon database (aws ap-southeast-1).
  return { preset: 'vercel', vercel: { functions: { regions: ['sin1'] } } }
}

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
    // Quick Cloudflare Tunnel URLs change on every run, so allow the whole domain.
    allowedHosts: ['.trycloudflare.com'],
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    // linkedom (server-side HTML parsing for /api/v1/posts) imports a named
    // export from a CommonJS package that the dev dependency optimizer can't
    // see. The optimizer skips it everywhere (route files are scanned for the
    // client too, before server code is split off) and server environments
    // load it straight from Node. Production builds bundle it normally.
    {
      name: 'viewixsoft:linkedom-dev-external',
      apply: 'serve',
      configEnvironment: (name) => ({
        optimizeDeps: { exclude: ['linkedom'] },
        ...(name === 'client' ? {} : { resolve: { external: ['linkedom'] } }),
      }),
    },
    mdxPlugin(),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    // Production builds target Cloudflare Workers, or Vercel when built there
    // (Vercel sets VERCEL=1). `pnpm dev` stays on Node.
    nitro(command === 'build' ? buildTarget() : {}),
  ],
}
})
