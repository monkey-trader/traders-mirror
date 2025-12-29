import { Project } from 'ts-morph'
import fs from 'node:fs'
import path from 'node:path'

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })

const glob = process.argv[2] || 'src/**/*.test.{ts,tsx}'

function listFiles(root, pattern) {
  const globSync = (await import('glob')).sync
}

const globSync = (await import('glob')).sync
const files = globSync(glob, { nodir: true })

const results = []
for (const f of files) {
  const src = project.addSourceFileAtPathIfExists(f)
  if (!src) continue
  const imports = src.getImportDeclarations()
  const unused = []
  for (const imp of imports) {
    const named = imp.getNamedImports()
    const defaultImport = imp.getDefaultImport()
    const nsImport = imp.getNamespaceImport()
    let allUnused = true
    if (defaultImport) {
      const refs = defaultImport.findReferences()
      if (refs.some(r => r.getReferences().some(rr => !rr.isDefinition()))) allUnused = false
    }
    if (nsImport) {
      const refs = nsImport.findReferences()
      if (refs.some(r => r.getReferences().some(rr => !rr.isDefinition()))) allUnused = false
    }
    for (const ni of named) {
      const refs = ni.findReferences()
      if (refs.some(r => r.getReferences().some(rr => !rr.isDefinition()))) allUnused = false
    }
    if (allUnused) unused.push(imp.getText())
  }
  if (unused.length) results.push({ file: f, unused })
}

console.log(JSON.stringify(results, null, 2))

