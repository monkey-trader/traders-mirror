// Postbuild: inject window.__BUILD_INFO__ into build/index.html and write build-info.json
import { promises as fs } from 'node:fs'
import path from 'node:path'

function sanitizeBranch(input) {
  if (!input) return ''
  // Allow only common branch name characters
  const safe = input.match(/[A-Za-z0-9._/-]+/g)?.join('') ?? ''
  return safe.slice(0, 100)
}

function sanitizeSha(input) {
  if (!input) return ''
  const safe = input.match(/[0-9a-fA-F]+/g)?.join('') ?? ''
  // short sha typically up to 40, but we often display 7
  return safe.slice(0, 40)
}

async function main() {
  const buildDir = path.join(process.cwd(), 'build')
  const indexPath = path.join(buildDir, 'index.html')

  // Resolve branch and sha from git, fallback to env
  const repoRoot = process.cwd()
  const gitHeadPath = path.join(repoRoot, '.git', 'HEAD')

  let branchRaw = process.env.GITHUB_REF_NAME || ''
  let shaRaw = process.env.GITHUB_SHA || ''

  // Fallbacks: derive from .git files without spawning any process
  try {
    if (!branchRaw) {
      const head = await fs.readFile(gitHeadPath, 'utf8').catch(() => '')
      const match = head.match(/^ref:\s+(.+)$/m)
      if (match && match[1]) {
        // e.g. refs/heads/feature/x -> feature/x
        const ref = match[1].trim()
        const parts = ref.split('refs/heads/')
        branchRaw = parts.length > 1 ? parts[1] : ref
        // Try to read the target ref to get commit sha
        if (!shaRaw) {
          const refPath = path.join(repoRoot, '.git', ...ref.split('/'))
          const refSha = await fs.readFile(refPath, 'utf8').catch(() => '')
          shaRaw = refSha.trim()
        }
      } else if (!shaRaw) {
        // Detached HEAD stores the sha directly in HEAD
        shaRaw = head.trim()
      }
    }
  } catch {
    // ignore
  }

  const tagRaw = process.env.GITHUB_TAG || ''
  const branch = sanitizeBranch(branchRaw)
  const sha = sanitizeSha(shaRaw)
  const tag = sanitizeBranch(tagRaw)
  const time = new Date().toISOString()

  const buildInfo = { branch, sha, tag, time }
  const infoPath = path.join(buildDir, 'build-info.json')
  await fs.writeFile(infoPath, JSON.stringify(buildInfo, null, 2) + '\n')

  // Inject a script tag safely before the closing </head> to avoid regex-based parsing
  let html = await fs.readFile(indexPath, 'utf8')
  const injection = `<script>window.__BUILD_INFO__=${JSON.stringify(buildInfo)};</script>`
  if (!html.includes('window.__BUILD_INFO__')) {
    // Guard against unusually large files to avoid potential DoS during processing
    const MAX_LEN = 2_000_000
    if (html.length > MAX_LEN) {
      throw new Error(`index.html too large (${html.length} bytes)`)
    }
    const headClose = html.indexOf('</head>')
    if (headClose !== -1) {
      html = html.slice(0, headClose) + injection + html.slice(headClose)
    } else {
      // Fallback: prepend to document
      html = injection + html
    }
    await fs.writeFile(indexPath, html, 'utf8')
  }

  console.log('inject-build-info: wrote', path.relative(process.cwd(), infoPath))
  console.log('inject-build-info: injected __BUILD_INFO__ into', path.relative(process.cwd(), indexPath))
}

main().catch((err) => {
  console.error('inject-build-info failed:', err)
  process.exit(1)
})
