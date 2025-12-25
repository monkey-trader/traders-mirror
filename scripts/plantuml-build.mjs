#!/usr/bin/env node
// Explanation: Improve PlantUML build script logging and error handling
// - report when docs/diagrams does not exist
// - print a helpful hint when `plantuml` binary is missing (ENOENT)
// - ensure informative logs when no .puml files are found
import { promises as fs } from 'fs'
import { spawnSync } from 'child_process'
import path from 'path'

async function findPumlFiles(dir) {
  const found = []
  async function walk(current) {
    let entries
    try {
      entries = await fs.readdir(current, { withFileTypes: true })
    } catch (err) {
      return
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (entry.isFile() && entry.name.endsWith('.puml')) found.push(full)
    }
  }
  await walk(dir)
  return found
}

async function main() {
  const repoRoot = process.cwd()
  const diagramsDir = path.join(repoRoot, 'docs', 'diagrams')
  const outDir = path.join(repoRoot, 'docs', 'build', 'assets', 'diagrams')

  console.log('plantuml-build: repoRoot=', repoRoot)

  // check diagrams dir exists
  try {
    const stat = await fs.stat(diagramsDir)
    if (!stat.isDirectory()) {
      console.warn(`plantuml-build: ${diagramsDir} exists but is not a directory`)
      return
    }
  } catch (err) {
    console.log(`plantuml-build: docs diagrams directory not found at ${diagramsDir}`)
    console.log('plantuml-build: nothing to render; create docs/diagrams and add .puml files')
    return
  }

  await fs.mkdir(outDir, { recursive: true })

  const pumlFiles = await findPumlFiles(diagramsDir)

  if (pumlFiles.length === 0) {
    console.log('plantuml-build: No .puml files found under docs/diagrams')
    return
  }

  for (const file of pumlFiles) {
    const baseName = path.basename(file, '.puml')
    const outPath = path.join(outDir, `${baseName}.png`)

    console.log(`Rendering ${path.relative(repoRoot, file)} -> ${path.relative(repoRoot, outPath)}`)

    const inputBuffer = await fs.readFile(file)

    // Use plantuml -tpng -pipe and feed the .puml content via stdin
    const result = spawnSync('plantuml', ['-tpng', '-charset', 'UTF-8', '-pipe'], {
      input: inputBuffer,
      encoding: 'buffer',
      maxBuffer: 10 * 1024 * 1024, // 10MB
    })

    if (result.error) {
      console.error('Failed to spawn plantuml:', result.error)
      if (result.error.code === 'ENOENT') {
        console.error('plantuml binary not found. On Debian/Ubuntu run: sudo apt-get update && sudo apt-get install -y plantuml graphviz default-jre')
      }
      process.exit(2)
    }

    if (result.status !== 0) {
      const stderr = result.stderr ? result.stderr.toString('utf8') : ''
      console.error(`plantuml exited with code ${result.status} for ${file}`)
      if (stderr) console.error(stderr)
      process.exit(result.status || 1)
    }

    // result.stdout contains the PNG bytes
    await fs.writeFile(outPath, result.stdout)
    console.log(`Wrote ${path.relative(repoRoot, outPath)}`)
  }

  console.log('PlantUML rendering completed successfully')
}

main().catch((err) => {
  console.error('plantuml-build failed:', err)
  process.exit(1)
})
