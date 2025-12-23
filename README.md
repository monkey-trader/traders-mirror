# Traders Mirror

---

## Use Case: Trading-Journal für Privatanleger & Trader

**Traders Mirror** ist ein modernes Trading-Journal für Privatanleger und ambitionierte Trader. Ziel ist es, Trades strukturiert zu erfassen, auszuwerten und daraus zu lernen. Die App hilft, Handelsentscheidungen transparent zu dokumentieren und die eigene Performance zu verbessern.

**Features:**
- Schnelles Erfassen von Trades (Symbol, Entry, Size, Price, Notizen)
- Übersichtliches Journal mit Filter- und Suchfunktion (erweiterbar)
- Onion Architecture & Domain-Driven Design (DDD) für maximale Wartbarkeit
- Strikte Trennung von Domain, Application, Infrastructure, Presentation
- Moderne React UI mit CSS Modules
- Testabdeckung (Vitest, Codecov, Coverage-Badge)
- Automatisiertes Deployment auf GitHub Pages

**Zielgruppe:**
- Privatanleger, Daytrader, Swingtrader, Trading-Interessierte
- Entwickler, die eine saubere DDD/Onion-Architektur als Referenz suchen

---

## Live-Demo (GitHub Pages)

Die App ist jederzeit online erreichbar unter:

➡️ **[Traders Mirror Live](https://monkey-trader.github.io/traders-mirror/)**

---

## Documentation

Die Projekt-Dokumentation und Architekturübersicht findest du im `docs/`-Ordner.

- ARCHITECTURE (AsciiDoc): `docs/ARCHITECTURE.adoc`
- Gerenderte HTML-Version: `docs/build/ARCHITECTURE.html` (nach `npm run docs:build`)
- PlantUML-Quellen: `docs/diagrams/` (z. B. `architecture.puml`, `sequence_trade_flow.puml`, `custom_components.puml`)
- Generierte Diagramme: `docs/diagrams/*.png` und `docs/build/assets/diagrams/*.png`

Tipp: Um die Diagramme automatisch zu (re)generieren und die HTML-Dokumentation zu bauen, führe lokal aus:

```bash
npm ci
npm run docs:build
```

Die CI-Action `.github/workflows/render-puml.yml` rendert `.puml`-Dateien zu PNGs und öffnet optional einen Pull Request mit den generierten Bildern (wenn du ein PAT in `ACTIONS_PAT` hinterlegst oder Actions das Erstellen von PRs erlaubt).
