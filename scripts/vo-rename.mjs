#!/usr/bin/env node
import { Project, SyntaxKind } from 'ts-morph'
import path from 'path'

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

const sourceFiles = project.getSourceFiles(['src/**/*.ts', 'src/**/*.tsx'])
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
    // Heuristic: only rename very short variable names (1-3 chars) to avoid accidental large refactors
    if (currentName.length > 3) continue

    const nameNode = varDecl.getNameNode()
    try {
      nameNode.rename(desiredName)
      fileChanged = true
      console.log(`Renamed ${currentName} -> ${desiredName} in ${file.getFilePath()}`)
    } catch (e) {
      console.warn(`Failed to rename ${currentName} in ${file.getFilePath()}: ${e.message}`)
    }
  }
  if (fileChanged) changedFiles++
}

if (changedFiles > 0) {
  project.saveSync()
  console.log(`Saved changes in ${changedFiles} file(s).`)
} else {
  console.log('No changes necessary.')
}
