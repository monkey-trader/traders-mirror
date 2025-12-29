import { Project } from 'ts-morph'
import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const glob = require('glob')

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })

const pattern = process.argv[2] || 'src/**/*.{ts,tsx,js,jsx}'
const apply = process.argv.includes('--apply')

const files = glob.sync(pattern, { nodir: true })

const results = []
for (const f of files) {
  const src = project.addSourceFileAtPathIfExists(f)
  if (!src) continue
  const imports = src.getImportDeclarations()
  const unused = []
  const content = fs.readFileSync(f, 'utf8')
  for (const imp of imports) {
    const importText = imp.getText()
    const defaultImport = imp.getDefaultImport()
    const nsImport = imp.getNamespaceImport()
    const named = imp.getNamedImports()

    const names = []
    if (defaultImport) names.push(defaultImport.getText())
    if (nsImport) names.push(nsImport.getText())
    for (const ni of named) {
      // ImportSpecifier: getName() returns the imported name; getAliasNode?.getText() for alias
      const alias = ni.getAliasNode()
      if (alias) names.push(alias.getText())
      else names.push(ni.getName())
    }

    // If there are no imported names (e.g. `import './styles.css'`) treat as side-effect import and skip
    if (names.length === 0) continue

    // Check if any of the names appear in the file outside the import text
    const rest = content.replace(importText, '')
    const used = names.some(n => {
      // Word boundary search to avoid partial matches
      const re = new RegExp('\\b' + n.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\b')
      return re.test(rest)
    })

    if (!used) unused.push(imp)
  }
  if (unused.length) results.push({ file: f, unused })
}

if (!results.length) {
  console.log('No unused imports found')
  process.exit(0)
}

for (const r of results) {
  console.log(`File: ${r.file}`)
  for (const imp of r.unused) {
    console.log('  Unused import:', imp.getText())
  }
}

if (apply) {
  console.log('\n--apply specified: removing unused imports (textual edits)')
  for (const r of results) {
    let updated = fs.readFileSync(r.file, 'utf8')
    for (const imp of r.unused) {
      const text = imp.getText()
      // Remove the whole import line(s) - best-effort
      const escaped = text.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
      const re = new RegExp('^' + escaped.replace(/\n/g, '\\s*') + '\\s*;?\\n?', 'm')
      updated = updated.replace(re, '')
    }
    fs.writeFileSync(r.file, updated, 'utf8')
    console.log('Updated', r.file)
  }
  console.log('Finished applying removals. Please run your tests and linting to verify.')
} else {
  console.log('\nRun with --apply to remove the above imports (make sure to commit first)')
}
