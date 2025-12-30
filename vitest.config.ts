import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    // Use happy-dom for a more complete DOM implementation in tests (includes form submit). This avoids
    // jsdom's intermittent "Not implemented: HTMLFormElement.prototype.submit" errors seen in CI.
    // The repo still includes a defensive shim in `vitest.setup.js`.
    environment: 'happy-dom',
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
