# Codecov Integration

Dein Projekt lädt jetzt automatisch Coverage-Berichte zu [Codecov](https://codecov.io/) hoch.

## Badge für README.md

Füge folgenden Markdown-Abschnitt in dein `README.md` ein (ersetze `<USER>` und `<REPO>` durch deinen GitHub-Namen und das Repo):

```md
[![codecov](https://codecov.io/gh/<USER>/<REPO>/branch/main/graph/badge.svg)](https://codecov.io/gh/<USER>/<REPO>)
```

- Der Badge zeigt immer die aktuelle Testabdeckung (Coverage) des main-Branches.
- Klicke auf den Badge, um den vollständigen Coverage-Report auf Codecov zu sehen.

## Hinweise
- Für private Repos musst du einen `CODECOV_TOKEN` als Secret in den GitHub Actions Einstellungen hinterlegen.
- Für Public Repos ist kein Token nötig.
- Der Coverage-Report wird nach jedem Push/PR auf main automatisch aktualisiert.

## Lokale Coverage-Reports
- Du kannst lokal Coverage mit `npm run test:unit -- --coverage` erzeugen.
- Der HTML-Report liegt dann in `coverage/index.html`.

---

**Fertig!**

