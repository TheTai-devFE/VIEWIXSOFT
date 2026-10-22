import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Unit tests need only the ~/ alias, not the app's Start/Nitro plugins.
export default defineConfig({
  resolve: { alias: { '~': path.resolve(__dirname, './src') } },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
