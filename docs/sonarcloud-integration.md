# SonarCloud Integration für monkey-trader/traders-mirror

## Voraussetzungen
- SonarCloud-Account (https://sonarcloud.io/)
- Projekt auf SonarCloud angelegt (z.B. monkey-trader_traders-mirror)
- SONAR_TOKEN als GitHub-Secret (Repository > Settings > Secrets > Actions)

## GitHub Actions Workflow Beispiel

Erstelle im Projekt unter `.github/workflows/sonarcloud.yml` folgende Datei:

```yaml
name: SonarCloud

on:
  push:
    branches:
      - main
      - master
      - develop
      - feature/**
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  build:
    name: Build and analyze
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Run Vitest (JUnit + Coverage)
        run: |
          npx vitest run --reporter=default --reporter=junit --outputFile=vitest-report.xml --coverage
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@v2
        with:
          projectBaseDir: .
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## Hinweise
- Stelle sicher, dass das Projekt auf SonarCloud korrekt konfiguriert ist (Organisation, Projekt-Key, ggf. SonarCloud-Properties).
- Die Datei `vitest-report.xml` wird im Root erzeugt und von SonarCloud automatisch erkannt.
- Coverage- und Lint-Reports werden ebenfalls übernommen, wenn sie im Root liegen.

## Weiterführende Links
- [SonarCloud Docs](https://docs.sonarcloud.io/)
- [SonarCloud GitHub Action](https://github.com/SonarSource/sonarcloud-github-action)

