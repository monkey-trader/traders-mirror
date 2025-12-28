#!/usr/bin/env node
// Explanation: Improve PlantUML build script logging and error handling
// - report when docs/diagrams does not exist
// - print a helpful hint when `plantuml` binary is missing (ENOENT)
// - ensure informative logs when no .puml files are found
// - write generated PNGs into both docs/build/assets/diagrams and docs/diagrams
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
  const outDirBuild = path.join(repoRoot, 'docs', 'build', 'assets', 'diagrams') // TODO: change build output dir to root build dir
  const outDirDiagrams = diagramsDir // write PNGs next to .puml files

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

  // Ensure both output directories exist (build and diagrams)
  await fs.mkdir(outDirBuild, { recursive: true })
  await fs.mkdir(outDirDiagrams, { recursive: true })

  const pumlFiles = await findPumlFiles(diagramsDir)

  if (pumlFiles.length === 0) {
    console.log('plantuml-build: No .puml files found under docs/diagrams')
    return
  }

  for (const file of pumlFiles) {
    const baseName = path.basename(file, '.puml')
    const outPathBuild = path.join(outDirBuild, `${baseName}.png`)
    const outPathDiagrams = path.join(outDirDiagrams, `${baseName}.png`)

    console.log(`Rendering ${path.relative(repoRoot, file)} -> ${path.relative(repoRoot, outPathBuild)} and ${path.relative(repoRoot, outPathDiagrams)}`)

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
    await fs.writeFile(outPathBuild, result.stdout)
    console.log(`Wrote ${path.relative(repoRoot, outPathBuild)}`)

    // Also write the image into the diagrams folder (next to the .puml)
    // This ensures PNG fallbacks live alongside the source diagrams and makes them easy to commit
    await fs.writeFile(outPathDiagrams, result.stdout)
    console.log(`Wrote ${path.relative(repoRoot, outPathDiagrams)}`)
  }

  console.log('PlantUML rendering completed successfully')
}

main().catch((err) => {
  console.error('plantuml-build failed:', err)
  process.exit(1)
})
