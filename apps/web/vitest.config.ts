import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/test/**', '**/*.d.ts', '**/*.config.*'],
    },
    env: {
      WATCHMODE_API_KEY: 'test-api-key',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dizitaq/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
