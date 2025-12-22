# Traders Mirror

[![codecov](https://codecov.io/gh/<USER>/<REPO>/branch/main/graph/badge.svg)](https://codecov.io/gh/<USER>/<REPO>)

> Ersetze `<USER>` und `<REPO>` durch deinen GitHub-Benutzernamen und das Repo auf GitHub, z.B. monkey-trader/traders-mirror

## Projektüberblick

Traders Mirror ist eine React/TypeScript-Anwendung mit Onion Architecture und Domain-Driven Design (DDD).

- **Test Coverage:** Automatisch mit Vitest und Codecov (siehe Badge oben)
- **CI:** GitHub Actions (siehe `.github/workflows/ci.yml`)
- **Coverage-Report:** Nach jedem Push/PR auf main automatisch auf [Codecov](https://codecov.io/)

## Lokale Entwicklung

```sh
npm install
npm run dev
```

## Tests & Coverage

```sh
npm run test:unit -- --coverage
# HTML-Report: coverage/index.html
```

## Coverage Badge im README

Der Badge oben zeigt die aktuelle Testabdeckung des main-Branches. Klicke auf den Badge, um den vollständigen Coverage-Report auf Codecov zu sehen.

## Weitere Hinweise
- Für private Repos: Lege ein `CODECOV_TOKEN` als Secret in den GitHub Actions Einstellungen an.
- Für Public Repos: Kein Token nötig.

---

Siehe auch [CODECOV.md](./CODECOV.md) für Details zur Coverage-Integration.

