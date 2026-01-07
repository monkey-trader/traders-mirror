const path = require('path')

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  // Ensure Jest (used by CRA) can resolve our alias and Vitest imports in tests
  jest: {
    configure: {
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^vitest$': '<rootDir>/src/test/vitest-shim.js'
      }
    }
  }
}

