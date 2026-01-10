# Traders Mirror

Traders Mirror is a small Trading-Journal application built with React + TypeScript following Onion Architecture and Domain-Driven Design (DDD).

## Live-Demo
[Traders Mirror Live](https://monkey-trader.github.io/traders-mirror/)

[![Codecov](https://codecov.io/gh/monkey-trader/traders-mirror/branch/main/graph/badge.svg)](https://codecov.io/gh/monkey-trader/traders-mirror/)
[![SonarQube Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=monkey-trader_traders-mirror&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=monkey-trader_traders-mirror)


See the documentation in the `docs/` folder for architecture diagrams and details.

- docs: [docs/README.md](./docs/README.md)

## Deployment

- Manual deploy to GitHub Pages via Actions: [deploy-pages.yml](.github/workflows/deploy-pages.yml)
- Full guide and CLI examples: [docs/deploy.md](docs/deploy.md)
- Direct workflow link (GitHub UI): https://github.com/monkey-trader/traders-mirror/actions/workflows/deploy-pages.yml

Pipelines are simplified:
- CI runs lint, tests and coverage on push/PR: [ci.yml](.github/workflows/ci.yml)
- SonarCloud runs only on `main` when enabled: [sonarcloud.yml](.github/workflows/sonarcloud.yml)
