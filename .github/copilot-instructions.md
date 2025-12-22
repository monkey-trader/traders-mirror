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
- Für jedes neue Feature oder Modul immer einen eigenen Branch eröffnen:
  - Branch-Muster: `feature/<beschreibung>`

- WICHTIG: Führ Commits nur aus, wenn der Benutzer ausdrücklich dazu auffordert. Keine automatischen Commits ohne Bestätigung.

## Architektur
- Die Anwendung verwendet Onion Architecture und Domain-Driven Design (DDD).
- Strikte Trennung der Schichten: Domain, Application, Infrastructure, Presentation.
- Feature-zentrierte Ordnerstruktur: Jede Domäne (z.B. Trade) hat eigene Unterordner in allen Schichten.
- Ports & Adapters: Schnittstellen (Ports) in Domain/Application, Implementierungen (Adapter) in Infrastructure.
- Keine Business-Logik in UI-Komponenten.

## Coding Standards
- TypeScript: Strikt, keine Verwendung von `any`.
- React: Funktionale Komponenten, Hooks.
- Keine Inline-CSS/Styles im JSX! Verwende ausschließlich CSS Modules oder externe Stylesheets.
- TDD: Tests für Domain- und Application-Layer mit Vitest/Testing Library.
- Keine doppelten oder toten Imports.
- Event-Handler gehören in die jeweilige Komponente, nicht in separate Dateien.

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
