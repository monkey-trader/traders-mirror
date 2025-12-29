# Lint Report (generated)

This file summarizes the ESLint findings from running `npx eslint -f json "src/**/*.{ts,tsx,js,jsx}"` and storing the machine-readable output in `artifacts/lint-report.json`.

Summary (from the run):

- Total problems reported by ESLint: 117
- Errors: 84
- Warnings: 33
- Fixable problems (auto-fixable by `--fix`): 1

Top rule violations (by frequency / impact):

1. `@typescript-eslint/no-explicit-any` — many occurrences across tests and presentation components. This project prefers `unknown` + narrowing or proper types instead of `any`.
2. `no-console` — many `console.*` calls in repositories and presentation code flagged as warnings.
3. `@typescript-eslint/no-unused-vars` — unused params/variables (for example `_e`, `e`, `container` in tests/components).
4. `@typescript-eslint/ban-ts-comment` — requires description after `@ts-expect-error` / `@ts-ignore` directives.
5. `@typescript-eslint/no-unused-expressions` — a couple of occurrences in small UI helpers.

Top files with notable errors (non-exhaustive):

- `src/presentation/trade/TradeJournal.tsx` — the largest set of issues (14 errors, many warnings). Many `any` usages and `no-console` logs.
- `src/presentation/trade/components/NewTradeForm/NewTradeForm.test.tsx` — multiple `any` uses in tests.
- `src/infrastructure/trade/repositories/LocalStorageTradeRepository.test.ts` — test uses `any` and missing descriptions for `@ts-expect-error`.
- `src/infrastructure/trade/repositories/LocalStorageTradeRepository.ts` — `no-console` warnings and some `any` usage.
- Several `src/presentation/*/*.test.tsx` files use `any` in test scaffolding.

Notes and suggested remediation steps

1. Replace `any` in tests with `unknown` (or with actual types) and add narrow/typed assertions. For quick wins, replace `as any` in tests with explicit test helper types or `unknown` and update assertions accordingly.
2. For `no-console` warnings: remove or replace with a logger that's disabled in production, or suppress with a short inline comment if intentional (but prefer removing for CI cleanliness).
3. Fix `@ts-expect-error`/`@ts-ignore` usage: when using `@ts-expect-error`, add a short comment describing why it's required.
4. Remove unused variables (or prefix with `_` if intentionally unused; project lint config currently flags `_e` as unused — prefer to name `_: unknown` or omit param).
5. Consider running ESLint with custom autofix (`eslint --fix`) for fixable problems, then run Prettier.

Commands

Generate the machine-readable JSON report (what was run to create `artifacts/lint-report.json`):

```bash
npx eslint -f json "src/**/*.{ts,tsx,js,jsx}" > artifacts/lint-report.json || true
```

Create a short summary (locally) using `jq` (if available):

```bash
jq 'map(.messages) | flatten | length as $total | { total: $total, errors: (map(select(.severity==2)) | length), warnings: (map(select(.severity==1)) | length) }' artifacts/lint-report.json
```

CI integration suggestions

- Recommended: Run lint (strict) in CI and fail the build on errors. This enforces quality and avoids regressions in PRs.
  - Use `npm ci` then `npm run lint:full` (or a strict `npm run lint` without `|| true`) as a dedicated CI step.
  - Optionally run `npm run format` in CI as a pre-step to ensure formatting; however many teams prefer to run formatting in pre-commit hooks or developer machines instead of CI.

- Example GitHub Actions step (conceptual):

```yaml
- name: Install
  run: npm ci

- name: Format check
  run: npm run format -- --check

- name: Lint (strict)
  run: npm run lint:full
```

Notes about committing changes from CI

- By default CI (e.g., GitHub Actions) does not commit or push changes to the repository. CI runs are ephemeral and isolated, and they should not modify the main repository state unless explicitly configured.

- If you want CI to automatically fix and commit linting/formatting changes, you must explicitly add steps that:
  1. Run `eslint --fix` and/or `prettier --write`.
  2. Configure Git in the runner and use a token with write permissions (e.g., a GitHub personal access token stored as a secret) to commit and push. Many teams prefer to open a PR from a bot branch instead of pushing to main.

- Security & policy caveats:
  - Automatically committing from CI requires storing a write-capable token in CI secrets and allowing the workflow to push — this increases risk and should be carefully controlled.
  - Common pattern: CI creates a fix branch (e.g., `fix/lint-autofix`) and opens a Pull Request for the maintainers to review. This is safer than silent pushes.

Recommended CI policy for this project

1. Make CI fail on lint errors for PRs. That ensures code entering the repo is lint-clean.
2. Keep a developer-friendly pre-commit hook (husky) that runs `prettier --check` and `eslint --max-warnings=0` for faster feedback.
3. Avoid committing from CI automatically. If desired, implement an optional job that tries `eslint --fix` + `prettier --write` and opens a PR with the fixes for maintainers to review.

Do you want me to:

- Run `eslint --fix` where possible and produce a patch (I will not commit); OR
- Create a prioritized list of the top 20 lint errors with file/line snippets to guide manual fixes; OR
- Set up a GitHub Actions workflow file in `.github/workflows/lint.yml` that enforces strict linting in CI (I will create it but not commit without your permission).

If you want a quick OPEX improvement, I can run `npx eslint --fix "src/**/*.{ts,tsx,js,jsx}"` and then generate a patch file with `git diff` for your review.


Generated artifacts

- Machine-readable report: `artifacts/lint-report.json` (created)
- This human summary: `docs/lint-report.md` (created)



