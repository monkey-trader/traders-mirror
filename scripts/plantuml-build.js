#!/usr/bin/env node
/**
 * plantuml-build.js
 * - Sucht nach .puml Dateien in docs/diagrams
 * - Versucht zuerst `plantuml` CLI zu verwenden (npm plantuml wrapper),
 * - fällt zurück auf `java -jar plantuml.jar` wenn verfügbar.
 * - Schreibt PNG/SVG nach docs/build/assets/diagrams
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const DIAGRAMS_DIR = path.join(__dirname, '..', 'docs', 'diagrams')
const OUT_DIR = path.join(__dirname, '..', 'docs', 'build', 'assets', 'diagrams')

if (!fs.existsSync(DIAGRAMS_DIR)) {
  console.error('No diagrams dir found:', DIAGRAMS_DIR)
  process.exit(0)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const pumlFiles = fs.readdirSync(DIAGRAMS_DIR).filter(f => f.endsWith('.puml'))
if (pumlFiles.length === 0) {
  console.log('No .puml files found')
  process.exit(0)
}

function run(cmd) {
  console.log('>', cmd)
  execSync(cmd, { stdio: 'inherit' })
}

for (const file of pumlFiles) {
  const src = path.join(DIAGRAMS_DIR, file)
  try {
    // Try plantuml CLI first
    run(`plantuml -tpng -o ${OUT_DIR} ${src}`)
  } catch (err) {
    console.warn('plantuml CLI failed, trying java -jar plantuml.jar...')
    try {
      const plantumlJar = path.join(__dirname, '..', 'tools', 'plantuml.jar')
      if (!fs.existsSync(plantumlJar)) {
        throw new Error('plantuml.jar not found at ' + plantumlJar)
      }
      run(`java -jar ${plantumlJar} -tpng -o ${OUT_DIR} ${src}`)
    } catch (err2) {
      console.error('Failed to render', file, err2.message)
    }
  }
}

console.log('PlantUML build finished')

