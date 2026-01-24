// Minimal compatibility shims for test globals used in the codebase.
// Prefer enabling the `vitest` environment in ESLint and real types in tsconfig.

// Vitest global shim used across tests
declare const vi: any;

// Minimal NodeJS namespace shim for test files that reference NodeJS types
declare namespace NodeJS {
  interface Global {
    [key: string]: any;
  }
}
