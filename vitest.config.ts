import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    // Use jsdom (default). We add a safe shim for HTMLFormElement.submit in vitest.setup.js to avoid the
    // jsdom "Not implemented" error while preserving previously passing tests.
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
      // write coverage artifacts into the standard coverage/ folder
      directory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/test/**', '**/tests/**', '**/mocks/**', '**/*.d.ts']
    }
  }
})
