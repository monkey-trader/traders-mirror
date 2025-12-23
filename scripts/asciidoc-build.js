#!/usr/bin/env node
/**
 * asciidoc-build.js
 * - Nutzt asciidoctor.js um ARCHITECTURE.adoc nach docs/build zu rendern.
 * - Verwendet vorhandene Diagramme in docs/build/assets/diagrams.
 */

const asciidoctor = require('asciidoctor')()
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'docs', 'ARCHITECTURE.adoc')
const outDir = path.join(__dirname, '..', 'docs', 'build')

if (!fs.existsSync(src)) {
  console.error('Source AsciiDoc not found:', src)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const options = {
  safe: 'unsafe',
  to_dir: outDir,
  mkdirs: true,
  attributes: {
    'source-highlighter': 'highlight.js',
    'imagesdir': 'assets/diagrams'
  }
}

try {
  asciidoctor.convertFile(src, options)
  console.log('AsciiDoc rendered to', outDir)
} catch (err) {
  console.error('AsciiDoc render failed:', err && err.message)
  process.exit(1)
}

