# RepoSyncStatus

A small badge component that displays the repository sync status for offline-first behavior.

- Tokens: uses `--color-border`, `--color-bg-muted`, `--color-success`, `--color-warning` from `src/styles/design-tokens.css`.
- Compact: supports `compactView?: boolean` to reduce padding and font size for narrow headers.
- Behavior: listens to global `repo-sync-status` events and shows one of:
  - `Sync: Local` — local-only repositories active
  - `Sync: Online` — remote available and no queued items
  - `Sync: Queued N` — N items waiting to sync to remote
- Sources: hybrid repositories dispatch events per feature (`trade`, `analysis`). The badge summarizes the overall status.

Testing
- Vitest test co-located verifies default label, queued/online behavior, and compact class.
