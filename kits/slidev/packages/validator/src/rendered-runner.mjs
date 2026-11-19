/**
 * The rendered runner: boot (or reuse) a Slidev dev server for the deck, drive
 * headless Chromium through every selected slide fully revealed, and take ONE DOM
 * measurement per slide (measure.mjs). It returns the measurements; the engine
 * applies the rendered rules. Driving Chromium directly (playwright-chromium's
 * `chromium`) keeps this a plain CLI with no test-runner dependency.
 */

import { spawn } from 'node:child_process'
import { chromium } from 'playwright-chromium'
import { CANVAS, deckEntry, repoRoot, parsePages, slugFromTitle } from './helpers.mjs'
import { measureSlide } from './rules/rendered/measure.mjs'
import { measureSafeArea } from './rules/rendered/safe-area/measure.mjs'
import { loadSafeAreaConfig } from './rules/rendered/safe-area/config.mjs'
import { slideFileMap } from './slide-files.mjs'

/** Resolve true when the URL answers, false on timeout. */
async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok || res.status === 200) return true
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  return false
}

/** Boot `slidev` unless a server already answers at the URL. Returns a stop(). */
async function ensureServer(url, port, log) {
  if (await waitForServer(url, 1500)) {
    log(`Reusing dev server at ${url}`)
    return async () => {}
  }
  log(`Starting Slidev at ${url} ...`)
  const child = spawn('npx', ['slidev', deckEntry(), '--port', String(port)], {
    cwd: repoRoot(),
    stdio: 'ignore',
    env: process.env,
  })
  const up = await waitForServer(url, 120_000)
  if (!up) {
    child.kill('SIGTERM')
    throw new Error(`Slidev dev server did not come up at ${url} within 120s.`)
  }
  return async () => {
    child.kill('SIGTERM')
  }
}

/** Navigate to slide `n`, fully reveal it (all clicks), settle fonts + transitions. */
async function gotoSlideRevealed(page, n) {
  await page.evaluate((n) => window.__slidev__.nav.go(n), n)
  await page.waitForFunction((n) => window.__slidev__.nav.currentPage === n, n)
  await page.waitForFunction(() => !document.querySelector('[class*="leave-active"]'), null, { timeout: 3000 }).catch(() => {})
  const clicks = await page.evaluate(() => window.__slidev__.nav.clicksTotal)
  if (clicks > 0) await page.evaluate(({ n, c }) => window.__slidev__.nav.go(n, c), { n, c: clicks })
  await page.evaluate(() => document.fonts?.ready)
  await page.waitForTimeout(200)
}

/**
 * Measure the deck. Returns { measured, title, slug, total, pages }. `measured` is
 * [{ slide, file, metrics }] — one entry per selected slide (metrics null if a
 * slide fails to render, which surfaces as an error downstream).
 */
export async function measureDeck({ port, pages, log = () => {} }) {
  const url = `http://localhost:${port}`
  const stop = await ensureServer(url, port, log)
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      viewport: { width: CANVAS.width + 10, height: CANVAS.height + 5 },
      reducedMotion: 'reduce',
      baseURL: url,
    })
    const page = await context.newPage()
    await page.goto('/1', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => !!window.__slidev__?.nav)
    await page.waitForTimeout(500)

    const title = await page.evaluate(() => window.__slidev__.configs?.title ?? 'deck')
    const total = await page.evaluate(() => window.__slidev__.nav.total)
    const selected = parsePages(pages, total)
    const fileMap = await slideFileMap()

    // The toolkit-owned safe-area model (overlay selectors + canvas), loaded once.
    const safeAreaConfig = loadSafeAreaConfig()
    const overlaySel = safeAreaConfig ? safeAreaConfig.overlays.map((o) => ({ id: o.id, selector: o.selector, zIndex: o.zIndex })) : null

    const measured = []
    for (const n of selected) {
      await gotoSlideRevealed(page, n)
      const metrics = await page.evaluate(measureSlide, n)
      const safeArea = overlaySel ? await page.evaluate(measureSafeArea, { n, overlaySel, canvas: safeAreaConfig.canvas }) : null
      measured.push({ slide: n, file: fileMap.get(n) ?? 'deck/slides.md', metrics, safeArea })
    }
    return { measured, title, slug: slugFromTitle(title), total, pages: selected }
  } finally {
    await browser.close()
    await stop()
  }
}
