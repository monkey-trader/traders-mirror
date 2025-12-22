# Contributing — Monkey Trader (Deutsch)

Danke, dass du zum Projekt beitragen möchtest! Dieses Dokument erklärt kurz und praxisnah, wie Beiträge organisiert, entwickelt und geprüft werden sollen.

Kurzer Plan / Checkliste
- [ ] Issue anlegen oder ein vorhandenes Issue auswählen
- [ ] Neues Branch erstellen: `feature/...` / `fix/...` / `chore/...`
- [ ] Implementieren, Tests schreiben/aktualisieren
- [ ] Lint & Format ausführen
- [ ] Lokale Tests laufen lassen
- [ ] PR öffnen mit klarer Beschreibung und Verknüpfung zum Issue

Grundsätze
- Folge der Onion-Architektur / DDD-Pattern im Repo (Domain, Application, Infrastructure, Presentation).
- Schreibe Tests (TDD empfohlen) für Domain- und Application-Layer.
- TypeScript strikt: kein `any`.
- Interfaces als Typen exportieren: `export type ...`.
- Verwende `import type` für Typs-only Imports.
- React: funktionale Komponenten + Hooks; Styles per CSS Modules (keine Inline-Styles).
- Verwende den Vite-Alias `@` für Importe aus `src/` (z. B. `import { Trade } from '@/domain/trade/entities/Trade'`).

Branch- und Commit-Workflow
- Eröffne für jede Änderung einen eigenen Branch.
  - Feature: `feature/<kurze-beschreibung>`
  - Bugfix: `fix/<kurze-beschreibung>`
  - Chore/Refactor: `chore/<kurze-beschreibung>`
- Commit-Nachrichten nach SemVer-Präfixen:
  - `feat: Beschreibung` für neue Features
  - `fix: Beschreibung` für Bugfixes
  - `chore: Beschreibung` für Wartung/Refactor
  - `docs: Beschreibung` für Dokumentation
- Schreibe prägnante Commit-Nachrichten (Kurzbeschreibung + bei Bedarf längere Body).

Beispiele
- Branch: `feature/trade-service-add-validation`
- Commit: `feat(trade): add validation to Trade entity`

Lokale Entwicklung (wichtige Befehle)
- Dev-Server starten:

```bash
npm run dev
# oder
npm start
```

- Build erstellen:

```bash
npm run build
```

- Unit-Tests (Vitest) lokal ausführen:

```bash
npm run test:unit
```

- Projekt-Tests (react-scripts):

```bash
npm test
```

- Lint ausführen:

```bash
npm run lint
```

- Formatieren mit Prettier:

```bash
npm run format
```

Anforderungen an Beiträge / PR-Checkliste
- [ ] Verknüpfe deinen PR mit einem Issue (falls vorhanden).
- [ ] Branch-Name und Commit-Prefix stimmen mit den Konventionen überein.
- [ ] Alle Unit-Tests laufen lokal (mindestens die betroffenen Tests).
- [ ] Linting-Fehler wurden behoben (oder dokumentiert, falls bewusst ausgelassen).
- [ ] Code formatiert (Prettier).
- [ ] Keine temporären Debug-Ausgaben (z. B. `console.log`) oder Geheimnisse im Code.
- [ ] Bei UI-Änderungen: Screenshots oder kurze GIFs im PR-Description.
- [ ] Neue Features: Implementiere Tests (happy path + relevante Fehlerfälle).
- [ ] Export- und Importkonventionen beachtet (`export type` / `import type`).

Testing- und TDD-Hinweise
- Tests für Domain-Entities und Application-Services sind Pflicht.
- Benenne Tests wie im Projektstandard:
  - `src/domain/<feature>/entities/<Entity>.test.ts`
  - `src/application/<feature>/services/<Service>.test.ts`
- Nutze `vitest` für schnelle Unit-Tests; UI-Tests können `@testing-library/react` nutzen.

Projekt-spezifische Hinweise
- Node / npm Version: `node >= 18.0.0`, `npm >= 9.0.0` (siehe `package.json`).
- Scripts findest du in `package.json` (z. B. `dev`, `test:unit`, `lint`, `format`).
- Architektur: Achte auf die Trennung Domain / Application / Infrastructure / Presentation.
- CSS: Verwende CSS Modules (`*.module.css`) für Komponentenstyles.

Pull Request Prozess
1. Fork (optional) und branch erstellen
2. Implementieren & Tests hinzufügen
3. Sicherstellen: `npm run test:unit`, `npm run lint`, `npm run format`
4. Push auf deinen Branch und PR eröffnen gegen `main` (oder den Projekt-Default-Branch)
5. Beschreibe im PR:
   - Was wurde geändert und warum
   - Welche Tests wurden hinzugefügt/aktualisiert
   - Schritte zur manuellen Prüfung (falls erforderlich)

Code Review
- Reviewer prüfen: Tests, Architektur/Schichten, Typsicherheit, Lesbarkeit, Performance- und Sicherheitsaspekte.
- Kleinere Änderungen können per Squash-and-merge gemerged werden, größere Features sollten eine saubere Historie (oder Rebase) behalten.

Weitere Empfehlungen
- Führe kleinere, fokussierte PRs ein — das erleichtert Reviews.
- Schreibe klare Commit-Nachrichten.
- Wenn du dir unsicher bist: öffne ein Issue oder schreibe einen Kommentar im Issue/PR.

Kontakt
- Öffne ein Issue für Diskussionen zu größeren Änderungen oder Designentscheidungen.

Danke für deinen Beitrag! 🙌

