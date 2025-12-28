import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'], // global mocks für ResizeObserver und localStorage
    reporters: [
      'default',
      ['junit', { outputFile: './vitest-report.xml' }]
    ],
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'lcov', 'lcovonly'],
      // write coverage artifacts into a hidden folder ./.coverage per request
      directory: './.coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/test/**', '**/tests/**', '**/mocks/**', '**/*.d.ts']
    }
  }
})
