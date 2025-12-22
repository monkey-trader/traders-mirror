module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  rules: {
    'react/prop-types': 'off',
    // temporarily disable unused-vars to avoid false positives for TS constructor shorthand
    'no-unused-vars': 'off',
    // Temporarily disable to avoid build-time ESLint failures from unresolved plugin
    '@typescript-eslint/ban-ts-comment': 'off'
  }
}
