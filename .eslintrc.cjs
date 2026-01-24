module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: ['./tsconfig.eslint.json', './tsconfig.json', './tsconfig.test.json'],
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  globals: {
    // vitest global used across unit tests
    vi: 'readonly',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // keep defaults; project enforces rules separately
    'no-console': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-unused-vars': 'warn',
    'no-debugger': 'off',
    'no-empty': 'warn',
    'no-undef': 'warn',
    'no-irregular-whitespace': 'warn',
    'no-mixed-spaces-and-tabs': 'warn',
    'no-unreachable': 'warn',
    'no-case-declarations': 'warn',
    'no-fallthrough': 'warn',
    'no-redeclare': 'warn',
    'no-dupe-keys': 'warn',
    'no-duplicate-case': 'warn',
    'no-empty-pattern': 'warn',
    'no-extra-boolean-cast': 'warn',
    'no-extra-semi': 'warn',
    'no-func-assign': 'warn',
    'no-inner-declarations': 'warn',
    'no-unexpected-multiline': 'warn',
    'no-unsafe-finally': 'warn',
    'no-unsafe-negation': 'warn',
    'valid-typeof': 'warn'
  }
}

// Ensure test files are parsed against the workspace tsconfig so parserOptions.project
// includes them. Some CI/IDE runners resolve test files differently; this override
// forces the parser to use `tsconfig.json` for tests.
module.exports.overrides = [
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    parserOptions: {
      project: './tsconfig.test.json',
      createDefaultProgram: true,
    },
    rules: {
      // Test files use the test runner globals and TypeScript types; avoid false-positive
      // `no-undef` warnings coming from type-only symbols like `NodeJS` or `vi`.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    },
  },
  // Disable `no-require-imports` for the shared id generator because it
  // intentionally avoids bundler-specific imports and may contain legacy
  // patterns that are safe for the browser build.
  {
    files: ['src/domain/shared/generateId.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
