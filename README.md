# Traders Mirror

---

## Use Case: Trading-Journal für Privatanleger & Trader

**Traders Mirror** ist ein modernes Trading-Journal für Privatanleger und ambitionierte Trader. Ziel ist es, Trades strukturiert zu erfassen, auszuwerten und daraus zu lernen.

## Features
- Schnelles Erfassen von Trades (Symbol, Entry, Size, Price, Notizen)
- Onion Architecture & Domain-Driven Design (DDD)
- Strikte Schichtung: Domain, Application, Infrastructure, Presentation
- React + TypeScript, CSS Modules
- Tests (Vitest)

## Live-Demo
[Traders Mirror Live](https://monkey-trader.github.io/traders-mirror/)

## Documentation (navigierbar)
- [Architecture (AsciiDoc)](docs/ARCHITECTURE.adoc)
- [Components (Shared Presentation Components)](docs/COMPONENTS.adoc)
- [Contributing Guide](docs/CONTRIBUTING.adoc)
- [Docs Home (AsciiDoc)](docs/README.adoc)

## Diagrams (PNG)

Architecture diagram (generated):

![Architecture](docs/diagrams/architecture.png)

Custom components diagram:

![Custom Components](docs/diagrams/custom_components.png)

Sequence: Add Trade flow:

![Sequence Trade Flow](docs/diagrams/sequence_trade_flow.png)

## How to build docs locally
```bash
npm ci
npm run docs:build
```

---

*Hinweis:* Die volle Architektur-Dokumentation liegt in `docs/ARCHITECTURE.adoc` (AsciiDoc). Diese README verweist auf die AsciiDoc-Quellen und die gerenderten PNGs, damit die GitHub-Startseite sauber dargestellt wird.

