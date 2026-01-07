# Copilot Instructions

## Git & SemVer Workflow
- Für jede Änderung am Code wird ein Commit nach SemVer-Prinzip empfohlen:
  - `fix:` für Bugfixes
  - `feat:` für neue Features
  - `chore:` für Wartung, Refactoring, Tests
  - `docs:` für Dokumentationsänderungen
- Versionierung erfolgt nach [SemVer](https://semver.org/lang/de/): MAJOR.MINOR.PATCH
- Commits immer mit sprechender Nachricht und Prefix versehen.
- Nach jedem Commit: `git push` ausführen.
- Für jedes neues Feature oder Modul immer einen eigenen Branch eröffnen:
  - Branch-Muster: `feature/<beschreibung>`

- WICHTIG: Führ Commits nur aus, wenn der Benutzer ausdrücklich dazu auffordert. Keine automatischen Commits ohne Bestätigung.
 - **Package Manager:** Verwende immer `npm` für lokale Entwicklung, Skripte und CI; `pnpm` ist in diesem Projekt nicht erlaubt.
 - **Linter & Tests vor Start/Commit:** Führe vor jedem Commit und vor dem Starten der Anwendung zwingend den Linter und die Tests aus (`npm run lint` und `npm test`) um sicherzustellen, dass keine Fehler eingebracht werden.
 - **Linter & Tests vor Start/Commit:** Führe vor jedem Commit und vor dem Starten der Anwendung zwingend den Linter und die Tests aus (`npm run lint` und `npm test`) um sicherzustellen, dass keine Fehler eingebracht werden.
  - **Neu:** Tests immer zusammen mit dem Linter ausführen — z.B. `npm run lint && npm test` (oder über ein npm-Skript, das beides verbindet), damit Lint-Fehler frühzeitig blockieren.
- NEU: Vor jedem Commit aktualisiere und generiere bitte zuerst alle betroffenen Dokumentationen und PlantUML-Diagramme (`.puml`), z. B. `docs/*` und `docs/diagrams/*`, damit die committeten Artefakte Dokumentation und Diagramme konsistent halten.

- WICHTIG: Führ Commits nur aus, wenn der Benutzer ausdrücklich dazu auffordert. Keine automatischen Commits ohne Bestätigung.

## Architektur
- Die Anwendung verwendet Onion Architecture und Domain-Driven Design (DDD).
- Strikte Trennung der Schichten: Domain, Application, Infrastructure, Presentation.
- Feature-zentrierte Ordnerstruktur: Jede Domäne (z.B. Trade) hat eigene Unterordner in allen Schichten.
- Ports & Adapters: Schnittstellen (Ports) in Domain/Application, Implementierungen (Adapter) in Infrastructure.
- Keine Business-Logik in UI-Komponenten.

## Richtlinie für neue Klassen / Features: Domain-Exceptions, Value Objects & Factories
- Wenn wir neue Klassen oder Features anlegen, sollten sie von Anfang an nach DDD-Prinzipien aufgebaut werden: Domain-Exceptions, Value Objects und eine Factory zur Normalisierung.
- Value Objects
  - Pro semantischem Feld eine eigene VO-Klasse (z.B. `Size`, `Price`, `EntryDate`, `TradeSymbol`).
  - VO-Konstruktoren validieren und normalisieren (z.B. Trim/Uppercase für Symbole, toISOString für Dates).
  - UI-Format-Helper: Wenn ein Value Object eine Präsentations-spezifische Konvertierung benötigt (z.B. HTML <input type="datetime-local"), gehören die Konverter und Parser in das VO (z.B. `EntryDate.toInputValue()` / `EntryDate.fromInputValue()`), nicht in UI-Komponenten. So bleiben Validierung und Normalisierung zentralisiert in der Domain.
    - Vorteil: keine Duplikation von Parsing/Formatting-Logik in Komponenten; Domain-Validierung bleibt single source of truth.
    - Beispiel (EntryDate):
      - `EntryDate.toInputValue(iso?: string): string` — liefert `yyyy-MM-ddTHH:mm` für `datetime-local` inputs.
      - `EntryDate.fromInputValue(input: string): string` — validiert und gibt ISO-String zurück oder wirft `EntryDateInvalidError`.
    - Tests: Für solche Helpers immer Unit-Tests in `src/domain/<feature>/valueObjects/<VO>.test.ts` (happy path + invalid inputs).
- Factories
  - `Factory.create(input)` normalisiert unterschiedliche Input-Formen (primitives, VOs, DTOs) und verwendet VOs zur Validierung.
  - Factory gibt stabile primitive API-Objekte/Entities zurück (z. B. `Trade` mit primitiven Feldern), damit die Application/Presentation-Schicht nicht von VOs abhängig ist.
- Keine Verwendung von `any`
  - `any` unterdrückt Typprüfungen und ist verboten. Verwende unions, `unknown` + Narrowing oder konkrete Typen.
  - Beispiel: Statt `(input as any).size` verwende `input: TradeInput` mit korrekten Union-Typen und greife direkt auf `input.size` zu oder führe einen Type-Guard durch.
  - WICHTIG: Beim Schreiben von neuem Code verwenden wir KEIN `any`. (We do not want ANY usage of `any` when we write new code.)
- Typed Domain Errors
  - Domain-Validierungen werfen spezifische Fehlerklassen (z. B. `SizeMustBePositiveError`, `EntryDateInvalidError`).
  - Presentation-Layer verwendet `instanceof` um Fehler zu erkennen und in Feld- oder globale Fehlermeldungen zu übersetzen (i18n-ready).
- Bei neuen Feature-Klassen: ErrorMapper & Validation
  - NEU: Für jede neue Feature-Domäne / Feature-Klasse muss neben der Domain-Implementation auch eine Presentation-spezifische Error-Mapper- und eine Validation-Klasse angelegt werden.
  - Konvention:
    - `src/presentation/<feature>/errorMapper.ts` — mappt Domain-Error-Codes/Instanzen zu Field-Errors bzw. globalen Messages.
    - `src/presentation/<feature>/validation.ts` — UI-Form-Validation (types + validateAll) für die entsprechenden Forms/Inputs.
    - Tests: `src/presentation/<feature>/errorMapper.test.ts` und `src/presentation/<feature>/validation.test.ts` (Vitest).
  - Ziel: Präsentationslogik (Mapping + UI-Validation) soll klar getrennt und testbar sein; Komponenten bleiben schlank.
- `import type`
  - Exportiere Schnittstellen als `export type` (z. B. `TradeRepository`) und importiere sie in Services/Adapter mit `import type { ... }`.
  - Klassen/VOs/Fehlerklassen bleiben normale `import`-Statements (Runtime benötigt sie).
- Tests
  - TDD: Für jede VO/Factory/Service Tests anlegen. Tests sollten sowohl Happy-Path als auch Validierungs-Fehler (`instanceof` Domain-Errors) prüfen.

## Coding Standards
- TypeScript: Strikt, keine Verwendung von `any`.
 - Keine `any`-Implementierungen: Verwende konkrete Klassen und strikt typisierte Interfaces statt `any`. Der Linter/CI überprüft dies und lehnt `any`-Nutzung in neuen Implementationen ab.
- React: Funktionale Komponenten, Hooks.
- Keine Inline-CSS/Styles im JSX! Verwende ausschließlich CSS Modules oder externe Stylesheets.
- TDD: Tests für Domain- und Application-Layer mit Vitest/Testing Library.
- Keine doppelten oder toten Imports.
- Event-Handler gehören in die jeweilige Komponente, nicht in separate Dateien.

### Mobile / Responsive Requirement
- Alle neuen Präsentations-Komponenten müssen von Anfang an mobile-first und responsive gestaltet werden. Praktische Vorgaben:
  - Nutze die Projekt-Design-Tokens (`src/styles/design-tokens.css`) für Abstände, Typografie und Breakpoints.
  - Implementiere eine kompakte Ansicht (z.B. `compactView?: boolean` prop) oder passende Modulklassen, so dass Komponenten auf schmalen Bildschirmen als stacked/cards gerendert werden können.
  - Schreibe kleine responsive Unit-/Integrationstests (Vitest + Testing Library) die das kompakte Verhalten oder die CSS-Klassen auf engen Viewports überprüfen (oder die Komponente über Prop-Injektion testen).
  - Dokumentiere neue Komponenten kurz in `docs/*` mit Hinweisen auf das responsive Verhalten und welche Token verwendet wurden.
  - Diese Richtlinie sorgt dafür, dass neue UI-Elemente sofort mobil-tauglich sind und die Codebasis konsistent bleibt.
  - NEU: Bei jedem neuen Präsentations-Component füge eine kurze Notiz in `docs/responsiveness.md` oder `docs/<component>.md` hinzu, die angibt, welche Tokens verwendet wurden und welche `compactView`-Konventionen gelten.

## TypeScript-Interface-Importe
- Interfaces (z.B. Repository-Interfaces) immer als TypeScript-Typ exportieren:
  ```ts
  export type TradeRepository = { ... }
  ```
- In allen Services und Adaptern mit `import type` importieren:
  ```ts
  import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository'
  ```
- So werden Vite/ESM-Fehler vermieden und die Typen sind nur für TypeScript sichtbar.

## TDD-Vorgaben
- Für jede neue Domain-Entity und jeden Service/Use-Case immer einen Vitest-Test anlegen.
- Testdateien benennen nach dem Muster:
  - `src/domain/<feature>/entities/<Entity>.test.ts`
  - `src/application/<feature>/services/<Service>.test.ts`
- Tests müssen alle Validierungs- und Fehlerfälle abdecken.

Zusätzliche Praxis: Tests neben der Implementation (co-located)
- Tests sollen nach TDD-Prinzip erstellt werden und **neben den Implementierungsdateien** liegen (co-located), nicht in separaten `__tests__`-Ordnern. Das erleichtert Refactoring, Modulentwicklung und hält Implementation und Tests zusammen.


## Vite-Import-Alias
- Für alle Importe aus dem src-Ordner ist der Vite-Alias `@` zu verwenden, z.B.:
  `import { Trade } from '@/domain/trade/entities/Trade'`
- Der Alias ist in der vite.config.ts konfiguriert:
  ```ts
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  }
  ```

## Beispiel: Trade-Modul

**Domain:**
- `src/domain/trade/entities/Trade.ts`: Entity mit Validierung.
- `src/domain/trade/interfaces/TradeRepository.ts`: Interface für das Repository.

**Application:**
- `src/application/trade/services/TradeService.ts`: Use-Case/Service für Trades.

**Infrastructure:**
- `src/infrastructure/trade/repositories/InMemoryTradeRepository.ts`: Adapter für das Repository.

**Presentation:**
- `src/presentation/trade/TradeJournal.tsx`: React-Komponente für das Trading-Journal.
- `src/presentation/trade/TradeJournal.module.css`: CSS Module für die Komponente.

**Test:**
- `src/domain/trade/entities/Trade.test.ts`: TDD-Test für die Entity.
- `src/application/trade/services/TradeService.test.ts`: TDD-Test für den Use-Case.

## Beispiel-Implementierung

```typescript
// src/domain/trade/entities/Trade.ts
export class Trade {
  constructor(
    public symbol: string,
    public entryDate: string,
    public size: number,
    public price: number,
    public notes?: string
  ) {
    if (!symbol) throw new Error('Symbol required')
    if (!entryDate) throw new Error('Entry date required')
    if (size <= 0) throw new Error('Size must be positive')
    if (price <= 0) throw new Error('Price must be positive')
  }
}
```

```typescript
// src/application/trade/services/TradeService.ts
import { Trade } from '@/domain/trade/entities/Trade'
import { TradeRepository } from '@/domain/trade/interfaces/TradeRepository'

export class TradeService {
  constructor(private repo: TradeRepository) {}

  async addTrade(symbol: string, entryDate: string, size: number, price: number, notes?: string) {
    const trade = new Trade(symbol, entryDate, size, price, notes)
    await this.repo.save(trade)
  }

  async listTrades(): Promise<Trade[]> {
    return this.repo.getAll()
  }
}
```

```typescript
// src/infrastructure/trade/repositories/InMemoryTradeRepository.ts
import { Trade } from '@/domain/trade/entities/Trade'
import { TradeRepository } from '@/domain/trade/interfaces/TradeRepository'

export class InMemoryTradeRepository implements TradeRepository {
  private trades: Trade[] = []

  async save(trade: Trade) {
    this.trades.push(trade)
  }

  async getAll(): Promise<Trade[]> {
    return [...this.trades]
  }
}
```

```tsx
// src/presentation/trade/TradeJournal.tsx
import React, { useState, useEffect } from 'react'
import { Trade } from '@/domain/trade/entities/Trade'
import { TradeService } from '@/application/trade/services/TradeService'
import { InMemoryTradeRepository } from '@/infrastructure/trade/repositories/InMemoryTradeRepository'
import styles from './TradeJournal.module.css'

const tradeRepository = new InMemoryTradeRepository()
const tradeService = new TradeService(tradeRepository)

export function TradeJournal() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [form, setForm] = useState({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })

  useEffect(() => {
    tradeService.listTrades().then(setTrades)
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await tradeService.addTrade(form.symbol, form.entryDate, Number(form.size), Number(form.price), form.notes)
    setForm({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })
    setTrades(await tradeService.listTrades())
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Trading Journal</h2>
      <form onSubmit={handleAdd} className={styles.form}>
        <input className={styles.input} placeholder="Symbol" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} required />
        <input className={styles.input} type="datetime-local" value={form.entryDate} onChange={e => setForm({ ...form, entryDate: e.target.value })} required />
        <input className={styles.input} type="number" placeholder="Size" value={form.size} onChange={e => setForm({ ...form, size: Number(e.target.value) })} required />
        <input className={styles.input} type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} required />
        <input className={styles.input} placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button type="submit" className={styles.button}>Add Trade</button>
      </form>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Symbol</th>
            <th className={styles.th}>Entry Date</th>
            <th className={styles.th}>Size</th>
            <th className={styles.th}>Price</th>
            <th className={styles.th}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t: Trade, i) => (
            <tr key={i}>
              <td className={styles.td}>{t.symbol}</td>
              <td className={styles.td}>{t.entryDate}</td>
              <td className={styles.td}>{t.size}</td>
              <td className={styles.td}>{t.price}</td>
              <td className={styles.td}>{t.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

// Use Value Objects to validate and normalize but re-expose primitives to keep API stable
// IMPORTANT: do not use short variable names like `s` or `p`. Use explicit, descriptive names.
// Good:
//     const tradeSymbol = new TradeSymbol(symbol)
//     const entityDate = new EntryDate(entryDate)
//     const size = new Size(Number(size))
//     const price = new Price(Number(price))
// Bad (avoid):
//     const s = new TradeSymbol(symbol)
//     const d = new EntryDate(entryDate)
//     const p = new Price(Number(price))

// Factory example that returns primitives to keep the Application/Presentation API stable:
// const tradeDTO = {
//   symbol: tradeSymbol.value, // primitive string
//   entryDate: entityDate.toISOString(), // primitive string
//   size: size.value, // primitive number
//   price: price.value, // primitive number
// }
