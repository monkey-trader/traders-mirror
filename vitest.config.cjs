// CommonJS Vitest config to avoid ESM require() problems in CI
const { resolve } = require('path')

module.exports = {
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    reporters: [
      'default',
      ['junit', { outputFile: './vitest-report.xml' }]
    ],
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'lcov', 'lcovonly'],
      directory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/test/**', '**/tests/**', '**/mocks/**', '**/*.d.ts']
    }
  }
}
