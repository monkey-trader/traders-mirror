#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const src = path.join(process.cwd(), 'docs', 'ARCHITECTURE.adoc')
const outDir = path.join(process.cwd(), 'docs', 'build')

if (!fs.existsSync(src)) {
  console.error('Source AsciiDoc not found:', src)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

// Try to use asciidoctor.js if available; otherwise produce a basic fallback HTML
let usedAsciidoctor = false
try {
  const asciidoctor = await import('asciidoctor')
  const asciidoctorInstance = asciidoctor.default()
  asciidoctorInstance.convertFile(src, {
    safe: 'unsafe',
    to_dir: outDir,
    mkdirs: true,
    attributes: {
      'source-highlighter': 'highlight.js',
      'imagesdir': 'assets/diagrams'
    }
  })
  console.log('AsciiDoc rendered to', outDir)
  usedAsciidoctor = true
} catch (err) {
  console.warn('asciidoctor.js not available; using fallback HTML output')
}

if (!usedAsciidoctor) {
  const adoc = fs.readFileSync(src, 'utf-8')
  const html = `<!doctype html>\n<html><head><meta charset="utf-8"><title>ARCHITECTURE</title></head><body><h1>ARCHITECTURE (fallback)</h1><pre>${escapeHtml(adoc)}</pre></body></html>`
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8')
  console.log('Fallback HTML written to', path.join(outDir, 'index.html'))
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
