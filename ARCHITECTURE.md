# Architekturübersicht — Monkey Trader (Frontend)

Kurz: Empfehlung für eine Onion-Architektur mit Domain-Driven-Design (DDD), feature-zentriert.

## Ziele
- Klare Trennung von Geschäftslogik (Domain) und UI (Presentation)
- Testbare Use-Cases (Application)
- Austauschbare Adapter (Infrastructure)
- Feature-orientierte Organisation

## Schichten (von innen nach außen)
- Domain: Entities, Value Objects, Domain Errors, Interfaces (Ports)
- Application: Use-Cases / Services, DTOs, Validatoren
- Infrastructure: Adapter-Implementierungen (Repositories, HTTP-Clients, ORM-Mapping)
- Presentation: React-Komponenten, Pages, Hooks, CSS Modules

## Empfohlene Ordnerstruktur (src/)

src/
- domain/
  - <feature>/
    - entities/
    - value-objects/
    - interfaces/    # `export type`-Interfaces (Ports)
    - errors/
- application/
  - <feature>/
    - services/      # Use-Cases
    - dtos/
    - validators/
- infrastructure/
  - <feature>/
    - repositories/  # Adapter-Implementierungen (InMemory, HTTP, DB)
    - api/
    - orm/
- presentation/
  - pages/
  - components/
  - hooks/
  - styles/
- shared/
  - di/              # composition root / dependency wiring
  - config/
  - utils/
  - types/

Tests: bevorzugt TDD — Domain & Application zuerst. Tests colocated oder unter `src/**/*.test.ts`.

## Konventionen
- TypeScript strikt: kein `any`; Interfaces als `export type`.
- Typ-Imports: `import type { ... }` wo möglich.
- React: Funktionale Komponenten + Hooks; Styles per CSS Modules (keine Inline-Styles).
- Commit-Nachrichten nach SemVer-Präfixen: `feat:`, `fix:`, `chore:`.
- Test-Framework: `vitest`; UI-Testing: `@testing-library/react`.

## Beispiel: Trade-Feature (Mapping)
- `src/domain/trade/entities/Trade.ts` — validierendes Entity
- `src/domain/trade/interfaces/TradeRepository.ts` — `export type TradeRepository = { save(trade: Trade): Promise<void>; getAll(): Promise<Trade[]> }`
- `src/application/trade/services/TradeService.ts` — Use-Case/Orchestrierung, erhält `TradeRepository` im Konstruktor
- `src/infrastructure/trade/repositories/InMemoryTradeRepository.ts` — einfache Adapter-Implementierung
- `src/presentation/trade/TradeJournal.tsx` — Komponente (Form + Liste) nutzt `TradeService` aus `shared/di`

## Tooling & Scripts (empfohlen)
- `dev`, `build`, `start`, `test`, `lint`, `format` in `package.json`
- `eslint` + `prettier`, `husky` + `lint-staged` optional
- CI: build + test + lint bei PRs

## Composition Root
- `src/shared/di/index.ts` (oder `composition.ts`) erstellt Instanzen (Repositories, Services) und injiziert sie in die Presentation.

## Nächste Schritte (konkret)
1. Entscheiden, welches Feature zuerst: z.B. `trade`.
2. Scaffold: Leere Ordner + Platzhalter-Dateien gemäß Struktur.
3. TDD: Domain-Tests für `Trade` schreiben.
4. Implement: InMemory Adapter, `TradeService`, UI-Komponente.
5. CI + Linting einrichten.

---
Datei erstellt als Orientierung; bei Bedarf scafolde ich die Ordnerstruktur und lege Platzhalter-Dateien an.
