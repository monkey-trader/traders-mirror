#!/usr/bin/env node
import { Project, SyntaxKind } from 'ts-morph'
import path from 'path'

const args = process.argv.slice(2)
const mode = args.includes('--apply') ? 'apply' : args.includes('--check') ? 'check' : 'dry'

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
})

const voToName = {
  TradeSymbol: 'tradeSymbol',
  EntryDate: 'entityDate',
  Size: 'sizeVo',
  Price: 'priceVo',
}

let changedFiles = 0
let proposals = []

// Relaxed heuristic limit: rename identifiers up to this length
const MAX_IDENT_LEN = 5

const sourceFiles = project.getSourceFiles(['src/**/*.ts', 'src/**/*.tsx']).filter(f => !/\.test\./.test(f.getFilePath()))
for (const file of sourceFiles) {
  let fileChanged = false
  const varDeclarations = file.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
  for (const varDecl of varDeclarations) {
    const initializer = varDecl.getInitializer()
    if (!initializer) continue
    if (initializer.getKind() !== SyntaxKind.NewExpression) continue
    const newExpr = initializer
    const expr = newExpr.getExpression()
    if (!expr) continue
    if (expr.getKind() !== SyntaxKind.Identifier) continue
    const className = expr.getText()
    if (!(className in voToName)) continue

    const desiredName = voToName[className]
    const currentName = varDecl.getName()
    if (currentName === desiredName) continue
    // Heuristic: rename short variable names (<= MAX_IDENT_LEN) to avoid accidental large refactors
    if (currentName.length > MAX_IDENT_LEN) continue

    const filePath = file.getFilePath()
    proposals.push({ filePath, currentName, desiredName })

    if (mode === 'apply') {
      const nameNode = varDecl.getNameNode()
      try {
        nameNode.rename(desiredName)
        fileChanged = true
        console.log(`Renamed ${currentName} -> ${desiredName} in ${filePath}`)
      } catch (e) {
        console.warn(`Failed to rename ${currentName} in ${filePath}: ${e.message}`)
      }
    }
  }
  if (fileChanged) changedFiles++
}

if (mode === 'check' || mode === 'dry') {
  if (proposals.length === 0) {
    console.log('No short-VO variable names found (per heuristic).')
    process.exit(0)
  }
  console.log('Proposed renames:')
  for (const p of proposals) console.log(`  ${p.filePath}: ${p.currentName} -> ${p.desiredName}`)
  if (mode === 'check') process.exit(1) // non-zero to fail CI when issues found
}

if (mode === 'apply') {
  if (changedFiles > 0) {
    project.saveSync()
    console.log(`Saved changes in ${changedFiles} file(s).`)
  } else {
    console.log('No changes applied.')
  }
}
