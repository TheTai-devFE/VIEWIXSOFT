import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import path from 'path'
import { mdxPlugin } from './src/lib/mdx/plugin.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Unit tests need only the ~/ alias, not the app's Start/Nitro plugins.
export default defineConfig({
  // Content tests import the blog's .mdx files.
  plugins: [mdxPlugin()],
  resolve: { alias: { '~': path.resolve(__dirname, './src') } },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
