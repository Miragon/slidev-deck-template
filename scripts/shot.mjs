import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const [pageArg = '1', baseArg, clicks = '0'] = process.argv.slice(2)

function portlessUrl() {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
  const bin = [
    join(repoRoot, 'node_modules', '.bin', 'portless'),
    join(repoRoot, 'deck', 'node_modules', '.bin', 'portless'),
  ].find(existsSync)
  if (!bin) return null
  try {
    const url = execFileSync(bin, ['get', 'slidev-deck'], { encoding: 'utf8' }).trim()
    return url.startsWith('http') ? url : null
  } catch {
    return null
  }
}

function resolveBase() {
  if (baseArg) return /^\d+$/.test(baseArg) ? `http://localhost:${baseArg}` : baseArg.replace(/\/+$/, '')
  const env = process.env.DECK_URL ?? process.env.PORTLESS_URL
  if (env) return env.replace(/\/+$/, '')
  return portlessUrl()
}

const browser = await chromium.launch()
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } })

async function probe(base) {
  const p = await context.newPage()
  try {
    await p.goto(`${base}/1`, { waitUntil: 'load', timeout: 4000 })
    await p.waitForTimeout(400)
    return await p.title()
  } catch {
    return null
  } finally {
    await p.close()
  }
}

let base = resolveBase()
let title = base ? await probe(base) : null

if (!title && !baseArg && !process.env.DECK_URL && !process.env.PORTLESS_URL) {
  const fallback = process.env.VERIFY_PORT ?? process.env.CONDUCTOR_PORT ?? '3030'
  for (const port of [fallback, 3030, 3031, 3032, 3033, 3034]) {
    const candidate = `http://localhost:${port}`
    const t = await probe(candidate)
    if (t) {
      base = candidate
      title = t
      break
    }
  }
}

if (!title) {
  console.error(`No dev server answered${base ? ` at ${base}` : ''}.`)
  console.error(`Is 'npm run dev' running? Then pass its printed URL:`)
  console.error(`  node scripts/shot.mjs ${pageArg} https://<worktree>.slidev-deck.localhost`)
  await browser.close()
  process.exit(1)
}

const outDir = 'verify/screenshots'
mkdirSync(outDir, { recursive: true })
const out = `${outDir}/shot-${pageArg}.png`
const url = `${base}/${pageArg}?clicks=${clicks}`

const page = await context.newPage()
await page.goto(url, { waitUntil: 'load', timeout: 15000 })
await page.waitForTimeout(1500)
await page.screenshot({ path: out })
await browser.close()

console.log(`deck:  ${title}`)
console.log(`slide: ${url}`)
console.log(`saved: ${out}`)
