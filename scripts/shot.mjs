// Screenshot one rendered slide of the running dev deck — the fast way to check
// a visual/CSS change, which `build` and `verify:source` cannot see (they never
// render colours or backgrounds).
//
// Usage:  node scripts/shot.mjs <page> [port] [clicks]
//   node scripts/shot.mjs 9            # slide 9, port from env or 3030
//   node scripts/shot.mjs 28 3031 2    # slide 28 on port 3031, after 2 clicks
//
// It prints the DECK TITLE first: always confirm it names THIS deck before
// trusting the screenshot. Two Slidev servers on neighbouring ports (e.g. from
// parallel workspaces) are the classic trap — the title tells you which one you
// hit. On a missed port it scans 3030-3034 and lists what is running where.
//
// Saves to verify/screenshots/ (gitignored). Requires a running `npm run dev`.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const [pageArg = '1', portArg = process.env.VERIFY_PORT ?? process.env.CONDUCTOR_PORT ?? '3030', clicks = '0'] =
  process.argv.slice(2)

const browser = await chromium.launch()

async function probe(port) {
  const p = await browser.newPage()
  try {
    await p.goto(`http://localhost:${port}/1`, { waitUntil: 'load', timeout: 4000 })
    await p.waitForTimeout(400)
    return await p.title()
  } catch {
    return null
  } finally {
    await p.close()
  }
}

const title = await probe(portArg)
if (!title) {
  console.error(`No dev server answered on port ${portArg}. Scanning 3030-3034...`)
  for (const port of [3030, 3031, 3032, 3033, 3034]) {
    const t = await probe(port)
    if (t) console.error(`  ${port}  ->  ${t}`)
  }
  console.error(`\nRe-run with the right port:  node scripts/shot.mjs ${pageArg} <port>`)
  await browser.close()
  process.exit(1)
}

const outDir = 'verify/screenshots'
mkdirSync(outDir, { recursive: true })
const out = `${outDir}/shot-${pageArg}.png`
const url = `http://localhost:${portArg}/${pageArg}?clicks=${clicks}`

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto(url, { waitUntil: 'load', timeout: 15000 })
await page.waitForTimeout(1500)
await page.screenshot({ path: out })
await browser.close()

console.log(`deck:  ${title}`)
console.log(`slide: ${url}`)
console.log(`saved: ${out}`)
