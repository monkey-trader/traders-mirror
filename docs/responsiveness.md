# Responsiveness Guidelines

## Update 27.12.2025
- Die Felder **Margin** und **Leverage** sind in allen responsiven Komponenten (z.B. TradeDetailEditor) editierbar und werden im Compact-View korrekt angezeigt.
- Design-Tokens für Abstände und Layout werden weiterhin verwendet.
- Tests für Compact-View und mobile Darstellung sind vorhanden.

---

(Weitere Details siehe Hauptdokumentation und Komponenten-Diagramme)

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


Auth-Komponenten (LoginButton, LogoutButton, ProtectedRoute)
- Nutzen das zentrale `Button`-Shared-Component für konsistentes Look & Feel und Responsiveness.
- Die Buttons sind touch-optimiert, verwenden Design-Tokens für Abstände/Farben und passen sich per CSS-Module an schmale Viewports an.
- Kein separates `compactView`-Prop nötig, da das Button-Component und die Styles bereits mobile-first gestaltet sind.
- Getestet mit Vitest/Testing Library auf Interaktion und Ladezustände.

Beispiel:
- `LoginButton` und `LogoutButton` verwenden `<Button variant="primary"|"danger">` und sind auf allen Devices konsistent.

Auth-Komponente: UserBadge
- Zeigt Avatar (oder Initialen) und den Namen oben rechts in der Header-Leiste.
- Verwendet Design-Tokens für Abstände/Typografie; Name wird auf kleinen Viewports automatisch ausgeblendet (Platzsparend).
- Prop `compactView?: boolean` unterstützt kompakte Darstellung, blendet z.B. den Namen aus.
- Logout-Action ist als sekundärer Button eingebunden und bleibt touch-optimiert.

Docs
- For each new component add a short `docs/<component>.md` entry describing the compact behavior and which tokens it uses.

Update 12.01.2026
- `RepoSyncStatus` (presentation/shared): Small header badge that summarizes sync state (Local/Online/Queued). Uses color tokens and supports `compactView` to reduce padding/font-size for narrow headers. Tested with Vitest for compact styles and event-driven label changes.

Update 09.01.2026
- `LoginRequired` (presentation/auth): Centered card that uses spacing tokens (`--space-4/5/6`) and adapts paddings on small screens via media query. No `compactView` prop needed as it is inherently minimal and mobile-friendly.

Maintenance
- Keep this document updated as new tokens or breakpoints are introduced.
