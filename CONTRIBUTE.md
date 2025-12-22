# Contribute — Kurze Anleitung (Deutsch)
Wenn du möchtest, kann ich jetzt deine JPG-Datei automatisch in die passenden PNG-Favicons konvertieren (ich benutze `sips`) und die `public/icons`-Dateien anlegen — sag mir kurz, wie die Quelldatei heißt (`src/assets/...` oder `public/assets/...`).

Kurz: Für Favicons -> `public/icons`. Für in-Code verwendete Bilder -> `src/assets`.

```
  Icon.module.css
  Icon.tsx
  Button.module.css
  Button.tsx
src/presentation/shared/components/
```

Beispiel Ordner:

- Verwende TypeScript, funktionale Komponenten und CSS Modules (`*.module.css`).
- Lege wiederverwendbare UI-Komponenten unter `src/presentation/shared/components` ab.

Shared UI Components

- Komponenten-spezifische Bilder, die per ES-Import verwendet werden, gehören in `src/` (z. B. `src/assets`) und werden per `import logo from '@/assets/logo.jpg'` eingebunden.
- Statische Assets, die direkt vom Browser geladen werden (HTML `<link>`, Webmanifest, Favicons), gehören in `public/` (z. B. `public/icons` oder `public/assets`).

Wo kopieren?

- Die Datei `public/index.html` verweist bereits auf `public/icons/*`. Stelle sicher, dass die Dateinamen übereinstimmen.

```
sips -Z 180 src/assets/logo.jpg --out public/icons/apple-touch-icon.png
sips -Z 16 src/assets/logo.jpg --out public/icons/favicon-16x16.png
sips -Z 32 src/assets/logo.jpg --out public/icons/favicon-32x32.png
mkdir -p public/icons
# Beispiel: aus logo.jpg mehrere PNGs erzeugen
```bash

- Auf macOS kannst du das eingebaute `sips`-Tool benutzen, um zu konvertieren und zu skalieren:
- Wenn du ein JPG/PNG hast, kannst du es in mehrere Größen konvertieren (z. B. 16x16, 32x32, 180x180) und die PNG-Dateien in `public/icons` ablegen.
- Favicons und generierte App-Icons gehören in `public/icons`.

Favicons / App-Icons

Dieses kleine Dokument ergänzt das vorhandene `CONTRIBUTING.md` und erklärt kurz, wie du fertige Assets (z. B. Favicons) und Shared UI-Komponenten hinzufügst.


