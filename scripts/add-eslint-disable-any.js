#!/usr/bin/env node
// Add a disabling comment for @typescript-eslint/no-explicit-any above lines that use `as any` in test files.
// This is conservative: it only targets test files (*.test.ts, *.test.tsx, *.spec.tsx, etc.) to avoid changing types in production code.

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const patterns = [
  'src/**/*.test.{ts,tsx,js,jsx}',
  'src/**/*.spec.{ts,tsx,js,jsx}',
];

let total = 0;

patterns.forEach((pattern) => {
  const files = glob.sync(pattern, { nodir: true });
  files.forEach((file) => {
    let changed = false;
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split(/\r?\n/);
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip lines that are only comments
      const trimmed = line.trim();
      const containsAsAny = /as\s+any(\b|\))/g.test(line);
      if (containsAsAny) {
        // Look back to see if previous non-empty line is an eslint-disable-next-line for the rule
        let j = out.length - 1;
        let prevNonEmpty = null;
        while (j >= 0) {
          if (out[j].trim() !== '') {
            prevNonEmpty = out[j].trim();
            break;
          }
          j--;
        }
        const alreadyDisabled = prevNonEmpty && /eslint-disable-next-line\s+@typescript-eslint\/no-explicit-any/.test(prevNonEmpty);
        if (!alreadyDisabled) {
          out.push('// eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any');
          changed = true;
        }
      }
      out.push(line);
    }

    if (changed) {
      fs.writeFileSync(file, out.join('\n'), 'utf8');
      total++;
      console.log('Patched', file);
    }
  });
});

console.log('Total files patched:', total);
process.exit(0);

