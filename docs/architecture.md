# Architecture Overview

This page collects the project's architecture diagrams in PNG format so they render on GitHub and other markdown viewers.

Diagrams are expected to be present in `docs/diagrams/` so they can be displayed directly in this markdown.

---

## Diagrams

### System Architecture

![System Architecture](./diagrams/architecture.png)

### Components

![Components](./diagrams/components.png)

### Sequence

![Sequence](./diagrams/sequence.png)

### Use Cases

![Use Cases](./diagrams/usecases.png)

---

## Regenerating diagrams

Diagrams are authored as `.puml` files inside `docs/diagrams`.
Use the included Node script to render them to PNGs (requires the `plantuml` binary + graphviz + Java):

```bash
# from repository root
node --experimental-specifier-resolution=node ./scripts/plantuml-build.mjs
```

On Ubuntu you can install dependencies with:

```bash
sudo apt-get update && sudo apt-get install -y plantuml graphviz default-jre
```

The script writes generated images to `docs/build/assets/diagrams`, but this repository expects the final PNG files to live in `docs/diagrams` so they are referenced directly by documentation.

If your CI produces the images into `docs/build/assets/diagrams`, ensure your workflow copies them to `docs/diagrams` (the project includes a workflow step that does this).

---

If you'd like this page expanded with descriptions for each diagram or embedded SVGs instead of PNGs, tell me how you prefer the layout and I'll update it.
