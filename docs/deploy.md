# Deployment Guide — GitHub Pages (manual)

This document explains how to deploy the current repo to GitHub Pages using the manual workflow `deploy-pages.yml` (Actions → Deploy Pages (manual)). It covers both the GUI (mouse-click) flow and the `gh` CLI flow.

Why this exists
- The repo contains a manual GitHub Actions workflow that builds or uses a CI artifact and pushes the static site to the `gh-pages` branch.
- Deploys are manual to keep production changes explicit and reviewable.

Quick overview
- Workflow file: `.github/workflows/deploy-pages.yml`
- Trigger: Manual (Actions UI → Run workflow) or GitHub CLI (`gh workflow run`)
- Options: choose an artifact (if CI uploaded one) or build from any branch, and optionally force the deploy.
- Build metadata: The workflow exports branch, commit SHA, tag, and UTC build time into both CRA and Vite envs (`REACT_APP_BUILD_*` and `VITE_BUILD_*`). The postbuild script (`scripts/inject-build-info.mjs`) writes `build/build-info.json` and injects `window.__BUILD_INFO__` into `build/index.html`. The workflow now verifies these artifacts instead of reinjecting them.

GUI (Actions UI) — step-by-step
1. Open the repository on GitHub.
2. Click the `Actions` tab in the top menu.
3. In the left sidebar look for the workflow named **Deploy Pages (manual)** (file: `.github/workflows/deploy-pages.yml`).
4. Click the workflow, then click the green **Run workflow** button.
5. Fill the inputs:
   - `source`: artifact name (default: `pages`). If your CI uploaded an artifact with that name, the workflow will use it.
   - `source_branch`: the Git branch to build from when the workflow performs a build (default: `main`). Example: `feature/my-branch`.
   - `use_artifact`: `true` to prefer a downloaded artifact, `false` to always build from source branch.
   - `force`: `false` (default). Set to `true` only if you explicitly want to force-push and overwrite history on `gh-pages`.
6. Click **Run workflow**. The job will start. If your repository `production` environment requires approval, the job will wait for an approver.
7. After the job finishes, inspect the Actions log. The workflow prints a friendly Preview URL (e.g. `https://<OWNER>.github.io/<REPO>/`) so you can open the deployed site directly. If the push was rejected (non-fast-forward), the log provides the exact `gh` CLI command to re-run with `force=true`.

CLI (GitHub CLI) — repeatable and scriptable
- Prerequisite: `gh` CLI installed and authenticated with GitHub (https://cli.github.com/).

Examples

1) Build from a branch (no artifact):

```bash
gh workflow run deploy-pages.yml \
  -f source=pages \
  -f source_branch=feature/my-branch \
  -f use_artifact=false \
  -f force=false
```

2) Use a previously uploaded artifact named `pages` (CI must have uploaded it for the branch):

```bash
gh workflow run deploy-pages.yml \
  -f source=pages \
  -f source_branch=feature/my-branch \
  -f use_artifact=true \
  -f force=false
```

3) Force the deploy (overwrite `gh-pages` history) — use with care:

```bash
gh workflow run deploy-pages.yml \
  -f source=pages \
  -f source_branch=feature/my-branch \
  -f use_artifact=false \
  -f force=true
```

Notes & guidance
- Default behavior is to attempt a non-forced push. If the push is rejected (non-fast-forward), the workflow exits with a clear message and a `gh workflow run` example to re-run with `force=true`.
- Prefer `use_artifact=true` when your CI already builds and uploads artifacts for the branch — this ensures you deploy exactly what CI produced.
- If you need multiple branch previews, we can update the workflow to deploy into branch-specific subfolders (e.g. `/feature/my-branch/`) instead of the site root; tell me if you want that.

Troubleshooting
- No `Deploy Pages (manual)` entry in Actions: confirm `.github/workflows/deploy-pages.yml` exists on the branch you are viewing (workflows live per-branch in GitHub UI).
- Artifact not found: if `use_artifact=true` but no artifact is downloaded, the workflow will fallback to building from `source_branch`. Check earlier CI runs for the artifact upload.
- Push rejected: re-run the workflow with `force=true` after confirming you want to overwrite the `gh-pages` branch.
- Build Info missing on deployed site: ensure the postbuild script ran during the build (`npm run build` triggers `postbuild`). The workflow validates that `index.html` contains `window.__BUILD_INFO__`; if it fails, check the build logs for the injector output and environment variables like `REACT_APP_BUILD_BRANCH`.

Security
- The workflow runs in the `production` environment; you can add required reviewers in repository -> Settings -> Environments to require an approval before the deploy executes.

Hardening (security)
- The workflow checks out a static `main` ref and then performs a sanitized branch switch to the requested `source_branch`. The branch name is validated against a strict pattern and existence is verified via `git ls-remote` before switching. This mitigates GitHub Actions rule githubactions:S8263 (user-controlled `ref`).
- Build metadata (`branch`, `sha`, `tag`, `time`) is exported via env and validated postbuild; no shell interpolation of user inputs is performed.

Want me to add a small Actions badge or a link in the repo README to open the workflow directly? I can add a link to the workflow or a small `docs/deploy.md` reference in the main README if you want one-click discoverability in the UI.

