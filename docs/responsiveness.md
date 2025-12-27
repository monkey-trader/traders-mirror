# Responsiveness Guidelines

This document summarizes the project's mobile-first and responsive conventions. It's a short reference for component authors and reviewers.

Principles
- Mobile-first: design for small screens first, then add progressive enhancements for larger viewports.
- Single source of truth: formatting/parsing helpers belong in domain value objects (VOs) if they are domain-relevant.
- Test the compact variants: add at least one unit/integration test that verifies `compactView` behaviour (prop-driven) or CSS classes at narrow viewports.

Compact API
- All new presentational components must accept an optional `compactView?: boolean` prop.
  - Usage: `<MyComponent compactView />` or `<MyComponent compactView={isCompact} />`
  - `compactView` signals the component to render a condensed layout (stacked cards, smaller paddings, touch-friendly controls).

Design tokens
- Use the design tokens provided in `src/styles/design-tokens.css` for spacing and typography:
  - Spacing: `--space-1`, `--space-2`, `--space-3` etc.
  - Breakpoints: use CSS media queries that align with project tokens (e.g., `@media (max-width: 768px)` for mobile)

CSS Modules
- Prefer CSS Modules for component-scoped styles. Add helper classes like `.compactSummary`, `.compactControls` where relevant.

Testing
- Add a Vitest test that mounts the component with `compactView={true}` and asserts the compact classnames or expected compact DOM (e.g. stacked cards instead of table rows).
- Integration tests may pass `forceCompact` props to parent components (e.g., `TradeJournal`) to simulate narrow viewports without mocking ResizeObserver.

Examples
- `TradeList` supports `compactView` and renders `PositionCard`s in compact mode.
- `TradeDetailEditor` supports `compactView` to adapt form controls and button styles.

Docs
- For each new component add a short `docs/<component>.md` entry describing the compact behavior and which tokens it uses.

Maintenance
- Keep this document updated as new tokens or breakpoints are introduced.


