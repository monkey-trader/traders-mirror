# Analysis Feature — Konzept & Umsetzung (Grundkonzept)

Dieses Dokument beschreibt das Grundkonzept für das "Analysis"-Feature der Anwendung. Ziel ist, eine Top-Down-Markt-Analyse (FOREX, CRYPTO) bereitzustellen, die Timeframes von Monthly bis 15min abdeckt, Notizen und TradingView-Links pro Timeframe erlaubt und nahtlos mit dem Trade-Flow verknüpft werden kann (Trade aus Analyse eröffnen, Trade kann zur Analyse zurückverlinken, QuickTrade ohne Analyse möglich). Das Dokument enthält DDD-/Onion-Architektur-Vorschläge, erforderliche Artefakte, TDD-Plan, Akzeptanzkriterien, Edge-Cases und nächste Schritte.

Kurzüberblick (User Storys)

- Als Trader möchte ich eine strukturierte Markt-Analyse pro Symbol erstellen (TOP-DOWN: Monthly, Weekly, Daily, 4h, 2h, 1h, 15min), damit ich meine Entscheidungsfindung dokumentiere.
- Für jeden Timeframe kann ich:
  - Einen TradingView-Link hinterlegen (Referenzchart)
  - Eine freie Note / Analyse-Text speichern
- Aus einer Analyse heraus kann ich direkt einen Trade eröffnen. Der Trade enthält einen Link zurück zur Analyse (Referenz).
- Ich kann Trades auch schnell ohne Analyse (QuickTrade) erstellen.
- Nach Abschluss eines Trades kann ich eine "Learning"-Note hinzufügen und optional einen zweiten TradingView-Link (z. B. für Ergebnis/Exit) speichern.

Ziele

- DDD-konforme Architektur (Domain, Application, Infrastructure, Presentation)
- TDD: Tests für Value Objects, Factories, Services, ErrorMapper, Validation, Komponenten
- Mobile-first Präsentation mit `compactView?: boolean` und Verwendung der Design-Tokens
- Rückverfolgbarkeit: Bidirektionale Links Analyse <-> Trade

Wesentliche Entitäten (hochlevel)

- Analysis (Entity)
  - id: string (UUID)
  - symbol: string (TradeSymbol VO)
  - createdAt: string (ISO, EntryDate VO)
  - updatedAt?: string
  - timeframes: Record<Timeframe, TimeframeAnalysis>
  - notes?: string (globale Notiz)

- TimeframeAnalysis (Value-Container innerhalb Analysis)
  - timeframe: 'monthly'|'weekly'|'daily'|'4h'|'2h'|'1h'|'15min' (enum VO)
  - tradingViewLink?: string (validated URL VO)
  - note?: string

- Trade (bestehende Entity erweitern)
  - analysisId?: string (Referenz auf Analysis.id)
  - analysisBacklink?: string (URL zur Analysis-View, optional)
  - exitTradingViewLink?: string (optional, zweiten Link)
  - learningNote?: string

Value Objects (VOs) — pro Richtlinie je semantisches Feld

- TradeSymbol
  - Normalisiert (trim, uppercase), validiert (non-empty, allowed chars)
- EntryDate / IsoDate
  - Normalisiert zu ISO; Helper: toInputValue()/fromInputValue() für `datetime-local`
- Timeframe (enum VO)
  - Allowed values: monthly, weekly, daily, 4h, 2h, 1h, 15min
- TradingViewLink
  - Validates URL + optionally hostname contains `tradingview.com` (configurable)
- Note/Text VO
  - Optional length limits, trimming

Domain Errors (typed)

- AnalysisInvalidSymbolError
- AnalysisTimeframeInvalidError
- TradingViewLinkInvalidError
- EntryDateInvalidError
- NoteTooLongError

Factory

- AnalysisFactory.create(input)
  - Akzeptiert primitives, DTOs oder VOs
  - Normalisiert und validiert via VOs
  - Liefert ein primitives DTO/Entity mit primitiven Feldern (keine VOs) für Application/Presentation

Repository Interfaces (export type)

- export type AnalysisRepository = {
  save(analysis: Analysis): Promise<void>
  getById(id: string): Promise<Analysis | null>
  listBySymbol(symbol: string): Promise<Analysis[]>
}

- TradeRepository (existierend) ergänzt um optionale Felder `analysisId`, `analysisBacklink`, `exitTradingViewLink`, `learningNote`

Application Layer (Use-Cases / Services)

- AnalysisService
  - createAnalysis(input)
  - updateAnalysis(id, input)
  - getAnalysis(id)
  - listAnalysesBySymbol(symbol)
  - linkTradeToAnalysis(analysisId, tradeId) — erzeugt backlink/url

- TradeService (erweitern)
  - createQuickTrade(input)
  - createTradeFromAnalysis(analysisId, tradeInput)
  - closeTrade(tradeId, closeInfo) — erlaubt learningNote + exitTradingViewLink

Infrastructure

- InMemoryAnalysisRepository (dev/tests)
- Persistence Adapter (later): localStorage / REST API Adapter

Presentation

- Pages / Components
  - AnalysisListPage (mobile-first)
  - AnalysisDetailPage (zeigt symbol, timeframes, links, notes, Aktionen: 'Create Trade from Analysis')
  - AnalysisEditor (Form für creating/updating Analysis; responsive; uses validation.ts)
  - TradeQuickCreate (QuickTrade UI)
  - TradeDetail enhancements: show linked Analysis and manage learning note + second TradingView link

- Files & Conventions (Beispielpfade)
  - src/domain/analysis/entities/Analysis.ts
  - src/domain/analysis/valueObjects/TradeSymbol.ts
  - src/domain/analysis/valueObjects/EntryDate.ts
  - src/domain/analysis/valueObjects/TradingViewLink.ts
  - src/domain/analysis/errors/*.ts
  - src/domain/analysis/factories/AnalysisFactory.ts
  - src/application/analysis/services/AnalysisService.ts
  - src/infrastructure/analysis/repositories/InMemoryAnalysisRepository.ts
  - src/presentation/analysis/AnalysisList.tsx
  - src/presentation/analysis/AnalysisDetail.tsx
  - src/presentation/analysis/AnalysisEditor.module.css
  - src/presentation/analysis/errorMapper.ts
  - src/presentation/analysis/validation.ts
  - src/presentation/analysis/validation.test.ts
  - docs/analysis.md (dieses Dokument)

TDD-Plan (Testspezifikationen)

- Domain / VO Tests
  - TradeSymbol.test.ts (trim, uppercase, invalid inputs)
  - EntryDate.test.ts (toInputValue/fromInputValue, invalids)
  - TradingViewLink.test.ts (valid/invalid URL)

- Factory Tests
  - AnalysisFactory.test.ts (various input shapes -> normalized primitive DTO)

- Application Tests
  - AnalysisService.test.ts (create, update, linkTradeToAnalysis)

- Presentation Tests
  - errorMapper.test.ts
  - validation.test.ts
  - AnalysisEditor.integration.test.tsx (render, validation messages, compactView behaviour)

Akzeptanzkriterien (Beispiel)

- A1: Benutzer kann eine neue Analysis für ein Symbol anlegen mit mindestens einem Timeframe-Eintrag.
- A2: Jede Timeframe-Zeile erlaubt einen TradingView-Link und eine Note; Links werden validiert.
- A3: Aus einer Analysis heraus kann ein Trade geöffnet werden; der Trade speichert die Analysis-Referenz.
- A4: QuickTrade funktioniert unabhängig von Analysis.
- A5: Nach Trade-Close kann eine Learning-Note und ein zweiter TradingView-Link gespeichert werden.
- A6: UI ist mobile-first, nutzt Design-Tokens und bietet `compactView` für Listen.

Edge-Cases

- Duplicate Analyses for same symbol/date — Entscheidung: allow multiples, show timestamps and authoring metadata.
- Timezone-Handling: datetime-local -> convert to UTC ISO in EntryDate VO.
- Malformed/shortened TradingView Links or share links (support multiple link patterns).
- Large numbers of analyses/trades: lazy loading/pagination (later)

Security & Privacy

- Keine sensitive Daten in TradingView-Links (nur öffentlich referenziert charts). Wenn nötig, strip query params — config option.

Docs & Diagrams

- Aktualisiere `docs/diagrams/*.puml` mit:
  - Components: AnalysisService, AnalysisRepository, TradeService
  - Sequence: CreateAnalysis -> createTradeFromAnalysis -> TradeRepository.save (backlink)

Next Steps / Vorschlag für Vorgehen (Optionen)

1) Domain-first (Empfohlen)
   - Erstelle VOs + Tests
   - Erstelle Analysis Entity + Factory + Tests
   - Implement InMemory Repo + Service + Tests
   - Implement Presentation stubs wired to mocked service

2) Design-first (schnell sichtbares Ergebnis)
   - Erstelle responsive Pages/Components (no logic), Storybook/Component tests
   - Parallel Domain-Design in kleiner Iteration

Konkreter nächster Schritt (Empfehlung)

- Wenn du mir das OK gibst: Ich erstelle die Domain-VOs (TradeSymbol, EntryDate, TradingViewLink) samt Unit-Tests (TDD) und die Analysis Entity + Factory. Danach implementiere ich InMemoryRepository und AnalysisService mit Tests — alles in einem Branch `feature/analysis-domain` (ich committe erst nach deinem ausdrücklichen OK).

Wenn du lieber zuerst das UI willst: Sag mir welche View du bevorzugst (Detail-Page oder Editor oder List) — ich erstelle die React-Komponente(n) als responsive Stubs ohne Business-Logic.

---

Dokument erstellt am: 30.12.2025

