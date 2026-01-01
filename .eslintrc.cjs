module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: ['./tsconfig.eslint.json', './tsconfig.json'],
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // keep defaults; project enforces rules separately
    'no-console': 'warn'
  }
}

// Ensure test files are parsed against the workspace tsconfig so parserOptions.project
// includes them. Some CI/IDE runners resolve test files differently; this override
// forces the parser to use `tsconfig.json` for tests.
module.exports.overrides = [
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    parserOptions: {
      project: './tsconfig.json',
      createDefaultProgram: true,
    },
  },
];
