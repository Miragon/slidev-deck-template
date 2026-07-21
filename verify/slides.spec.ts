import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { slugFromTitle, repoRoot, TOLERANCE, MIN_BOTTOM_MARGIN, parsePages } from './helpers'
import { sourceRules } from './rules'
import { runRules, formatFailure } from './validator'

/** A single design-system check on one slide. */
type Check = { label: string; ok: boolean; detail: string }

/**
 * Navigate to slide `n` and fully reveal it (all v-clicks shown), so we test
 * the worst case. Uses Slidev's in-page nav API instead of URL reloads, which
 * avoids SPA-routing issues and is far faster.
 */
async function gotoSlideRevealed(page: Page, n: number) {
  await page.evaluate((n) => (window as any).__slidev__.nav.go(n), n)
  await page.waitForFunction((n) => (window as any).__slidev__.nav.currentPage === n, n)
  // Let the leaving slide's transition finish so we measure only slide n.
  await page
    .waitForFunction(() => !document.querySelector('[class*="leave-active"]'), null, { timeout: 3000 })
    .catch(() => {})
  const clicks = await page.evaluate(() => (window as any).__slidev__.nav.clicksTotal)
  if (clicks > 0) {
    await page.evaluate(({ n, c }) => (window as any).__slidev__.nav.go(n, c), { n, c: clicks })
  }
  await page.evaluate(() => (document as any).fonts?.ready)
  await page.waitForTimeout(200)
}

/**
 * Run the DOM-checkable design-system rules against slide `n` (see the slides skill).
 * Editorial/semantic rules (English only, focal point, hero-as-question, scenario
 * discipline, transitions) are not reliably detectable from the DOM and are left
 * to human review. Everything here is measured on the live, fully-revealed slide.
 */
async function runChecks(page: Page, n: number): Promise<Check[]> {
  const r = await page.evaluate((n) => {
    /**
     * `:not(.disable-view-transition)` selects the live presentation slide and
     * skips the overview miniatures the Agenda renders (those use the overview
     * render context, which adds that class and re-uses the same page classes).
     */
    const root = document.querySelector(`.slidev-page-${n}:not(.disable-view-transition)`)
    if (!root) return null
    const layout = (root.querySelector('.slidev-layout') as HTMLElement) || (root as HTMLElement)
    const all = [...layout.querySelectorAll<HTMLElement>('*')]
    const rgb = (s: string) => {
      const m = s.match(/rgba?\(([^)]+)\)/)
      if (!m) return null
      const p = m[1].split(',').map((x) => parseFloat(x))
      return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }
    }
    const isBlue = (c: { r: number; g: number; b: number } | null) =>
      !!c && c.b > 150 && c.b > c.r + 40 && c.b > c.g + 40

    // --- Fit: horizontal overflow + how close content sits to the bottom ---
    const box = layout.getBoundingClientRect()
    const cw = layout.clientWidth || 980
    const ch = layout.clientHeight || 552
    const scale = box.width / cw
    let right = cw
    /**
     * contentBottom: the true lowest content edge, used to require a minimum
     * bottom margin (not just "fits"). Full-height elements — the layout shell,
     * the mesh-shader background, and the vertical-centering wrappers of
     * cover/closing — span the canvas height by design, so they're excluded;
     * actual content (text, cards, diagrams) is never full-height.
     */
    let contentBottom = 0
    all.forEach((el) => {
      const cr = el.getBoundingClientRect()
      if (!cr.width && !cr.height) return
      if (getComputedStyle(el).position === 'fixed') return
      right = Math.max(right, (cr.right - box.left) / scale)
      if (cr.height / scale / ch >= 0.92) return
      contentBottom = Math.max(contentBottom, (cr.bottom - box.top) / scale)
    })
    right = Math.round(Math.max(right, layout.scrollWidth))
    contentBottom = Math.round(contentBottom)

    // --- Text rules ---
    const text = layout.innerText || ''
    const emDash = text.includes('—')
    /**
     * Extended_Pictographic (ES2018+) is the correct Unicode property for emoji.
     * Assembled from a variable so editors that inject regex inspection (and don't
     * recognize the property name) don't false-flag it; runtime is identical.
     */
    const pictographic = '\\p{Extended' + '_Pictographic}'
    const emoji = new RegExp(pictographic, 'u').test(text)

    // --- Headings must be black, never blue ---
    const blueHeads = [...layout.querySelectorAll<HTMLElement>('h1, h2')].filter((h) =>
      isBlue(rgb(getComputedStyle(h).color)),
    ).length

    // --- Cards stay white: no colored/gradient background, no colored left-accent border ---
    const badCards = [...layout.querySelectorAll<HTMLElement>('[class*="rounded-xl"]')].filter((el) => {
      const s = getComputedStyle(el)
      if (s.backgroundImage && s.backgroundImage !== 'none') return true
      const bg = rgb(s.backgroundColor)
      if (bg && bg.a > 0.01 && !(bg.r >= 250 && bg.g >= 250 && bg.b >= 250)) return true
      const lw = parseFloat(s.borderLeftWidth) || 0
      const tw = parseFloat(s.borderTopWidth) || 0
      if (lw >= 3 && lw > tw + 1) {
        const lc = rgb(s.borderLeftColor)
        if (lc && !(Math.abs(lc.r - lc.g) < 24 && Math.abs(lc.g - lc.b) < 24)) return true
      }
      return false
    }).length

    // --- Layouts own typography: no inline font-family in slide content ---
    /**
     * Exclude library output, not author markdown: code blocks (Shiki emits
     * inline font-family), SVG and addon controls (e.g. the bpmn diagram labels
     * and its token-simulation buttons).
     */
    const inlineFonts = all.filter(
      (el) => el.style && el.style.fontFamily && !el.closest('svg, pre, code, button'),
    ).length

    // --- Bullets: layout owns the marker; no per-slide list-style override; max 1 nesting level ---
    const listOverrides = [...layout.querySelectorAll<HTMLElement>('ul, li')].filter(
      (el) => el.style && (el.style.listStyle || el.style.listStyleType),
    ).length
    const nestedLists = layout.querySelectorAll('ul ul, ul ol, ol ul, ol ol').length

    return { cw, ch, right, contentBottom, emDash, emoji, blueHeads, badCards, inlineFonts, listOverrides, nestedLists }
  }, n)

  if (!r) throw new Error(`Slide ${n} did not render (.slidev-page-${n} not found)`)

  const byX = r.right - r.cw
  const bottomMargin = r.ch - r.contentBottom
  const issues: string[] = []
  if (bottomMargin < MIN_BOTTOM_MARGIN) {
    issues.push(
      bottomMargin < 0
        ? `content runs ${-bottomMargin}px past the bottom (reaches ${r.contentBottom}px, canvas is ${r.ch}px)`
        : `only ${bottomMargin}px clear of the bottom (content reaches ${r.contentBottom}px; needs >= ${MIN_BOTTOM_MARGIN}px below the ${r.ch}px floor)`,
    )
  }
  if (byX > TOLERANCE) issues.push(`${byX}px past the right edge (content reaches ${r.right}px, canvas is ${r.cw}px)`)

  return [
    { label: 'Fits the canvas with a bottom margin', ok: issues.length === 0, detail: `Slide ${issues.join(' and ')}. Reduce content (split the slide, fewer items, shrink the visual, or move detail to speaker notes).` },
    { label: 'No em-dashes', ok: !r.emDash, detail: 'Contains an em-dash (—). Use commas, periods, parentheses, or colons.' },
    { label: 'No emoji icons', ok: !r.emoji, detail: 'Contains an emoji. Use inline SVG or Iconify (i-*) icon classes instead.' },
    { label: 'Headings are black, not blue', ok: r.blueHeads === 0, detail: `${r.blueHeads} heading(s) render blue. Headings must be black; blue is only for kickers, accents, and small labels.` },
    { label: 'Cards stay white', ok: r.badCards === 0, detail: `${r.badCards} card(s) have a colored/gradient background or a colored left-accent border. Cards are always white with the accent on the title text only.` },
    { label: 'Typography not overridden', ok: r.inlineFonts === 0, detail: `${r.inlineFonts} element(s) set font-family inline. Let the layout own typography (Calibre).` },
    { label: 'Bullets not restyled', ok: r.listOverrides === 0, detail: `${r.listOverrides} list element(s) override bullet styling inline. Use plain <ul>/<li>; the layout provides the marker.` },
    { label: 'No nested bullets', ok: r.nestedLists === 0, detail: `${r.nestedLists} nested list(s). Keep to one level; split the slide instead of sub-bullets.` },
  ]
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

const ALERT = {
  ok: {
    bg: '#F0FDF4', border: '#86EFAC', bar: '#16A34A', head: '#15803D', text: '#166534',
    icon: '<circle cx="12" cy="12" r="10" fill="#16A34A"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  error: {
    bg: '#FEF2F2', border: '#FCA5A5', bar: '#DC2626', head: '#B91C1C', text: '#7F1D1D',
    icon: '<path d="M12 2 1 21h22L12 2z" fill="#DC2626"/><path d="M11 9h2v6h-2zM11 17h2v2h-2z" fill="#fff"/>',
  },
} as const

/**
 * Render one combined image: the slide screenshot on the left, the checklist on
 * the right (green when every check passes, red when any fails). The HTML report
 * stacks attachments vertically and only inlines image/*, so composing a single
 * side-by-side image is the way to show the checks NEXT TO the slide. Reuses one
 * offscreen page so the slide under test is untouched.
 */
async function renderSlideReport(p: Page, shot: Buffer, headline: string, checks: Check[]): Promise<Buffer> {
  const variant = checks.every((c) => c.ok) ? 'ok' : 'error'
  const c = ALERT[variant]
  const rows = checks
    .map(
      (ck) => `
        <li style="margin:7px 0;display:flex;gap:10px;align-items:flex-start;list-style:none">
          <span style="flex:none;font-weight:800;font-size:15px;color:${ck.ok ? '#16A34A' : '#DC2626'}">${ck.ok ? '✓' : '✗'}</span>
          <span><strong>${esc(ck.label)}</strong>${ck.ok ? '' : ` <span style="color:#6B7280">— ${esc(ck.detail)}</span>`}</span>
        </li>`,
    )
    .join('')
  const slideSrc = `data:image/png;base64,${shot.toString('base64')}`
  await p.setContent(
    `<!doctype html><html lang="en"><body style="margin:0;padding:0">
      <div style="display:flex;gap:18px;align-items:stretch;box-sizing:border-box;width:1080px;padding:16px;background:#fff;
                  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <img src="${slideSrc}" alt="Slide screenshot" style="flex:none;width:620px;height:auto;display:block;border:1px solid #E5E7EB;border-radius:8px"/>
        <div style="flex:1;background:${c.bg};border:1px solid ${c.border};border-left:8px solid ${c.bar};border-radius:10px;
                    padding:18px 22px;color:${c.text}">
          <div style="display:flex;align-items:center;gap:10px;color:${c.head};font-weight:700;font-size:18px">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">${c.icon}</svg>
            <span>${esc(headline)}</span>
          </div>
          <ul style="margin:14px 0 0;padding:0;font-size:14px;line-height:1.5">${rows}</ul>
        </div>
      </div>
    </body></html>`,
  )
  return p.locator('body > div').first().screenshot()
}

test.describe('Design-system verification', () => {
  test('every slide meets the design system', async ({ page }, testInfo) => {
    /**
     * Load a concrete slide (not "/", which redirects) and let the dev server's
     * initial compile + any first-load HMR reload settle, so later page.evaluate
     * calls don't race a navigation that destroys the execution context.
     */
    await page.goto('/1', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => !!(window as any).__slidev__?.nav)
    await page.waitForTimeout(500)

    // Label screenshots/report by the deck's own title.
    const title: string = await page.evaluate(() => (window as any).__slidev__.configs?.title ?? 'deck')
    const slug = slugFromTitle(title)
    testInfo.annotations.push({ type: 'deck', description: `${title} (${slug})` })
    const total: number = await page.evaluate(() => (window as any).__slidev__.nav.total)

    /**
     * VERIFY_PAGES selects a subset to check ("4-10", "4,5,9", or a mix); empty
     * means the whole deck. Lets the authoring flow re-verify only the slides it
     * just edited instead of walking every slide each iteration.
     */
    const pages = parsePages(process.env.VERIFY_PAGES, total)
    const isSubset = pages.length < total
    if (isSubset) testInfo.annotations.push({ type: 'pages', description: pages.join(', ') })

    const shotDir = join(repoRoot, 'verify', 'screenshots', slug)
    /**
     * A full run owns the whole screenshot folder, so clear stale slides; a subset
     * run only refreshes the slides it checks and leaves the rest in place.
     */
    if (!isSubset) rmSync(shotDir, { recursive: true, force: true })
    mkdirSync(shotDir, { recursive: true })

    // One reused offscreen page to compose the side-by-side report images.
    const alertPage = await page.context().newPage()
    await alertPage.setViewportSize({ width: 1120, height: 600 })

    const failing: string[] = []
    try {
      for (const n of pages) {
        const pad = String(n).padStart(2, '0')
        /**
         * One collapsible step per slide, holding a single image: the slide on
         * the left, its checklist on the right (green when all checks pass, red
         * when any fail). Soft assertions keep the run going so every slide is
         * reported, not just the first.
         */
        await test.step(`Slide ${pad}`, async () => {
          await gotoSlideRevealed(page, n)
          const checks = await runChecks(page, n)
          const failed = checks.filter((c) => !c.ok)
          const headline = failed.length
            ? `Slide ${n}: ${failed.length} of ${checks.length} checks failed`
            : `Slide ${n}: all ${checks.length} checks passed`

          const shot = await page.locator(`.slidev-page-${n}:not(.disable-view-transition)`).screenshot({ path: join(shotDir, `${pad}.png`) })
          const report = await renderSlideReport(alertPage, shot, headline, checks)
          await testInfo.attach(`Slide ${pad}`, { body: report, contentType: 'image/png' })

          if (failed.length) failing.push(`Slide ${n}: ${failed.map((c) => c.label).join(', ')}`)
          for (const c of checks) {
            expect.soft(c.ok, `Slide ${n} — ${c.label}: ${c.detail}`).toBeTruthy()
          }
        })
      }
    } finally {
      await alertPage.close()
    }

    const scope = isSubset ? `${pages.length} selected slide(s) [${pages.join(', ')}]` : `all ${total} slide(s)`
    const summary = failing.length
      ? `${failing.length} of ${scope} of "${title}" failed checks:\n - ${failing.join('\n - ')}`
      : `${isSubset ? scope[0].toUpperCase() + scope.slice(1) : `All ${total} slide(s)`} of "${title}" pass every design-system check.`
    console.log(summary)
    console.log(`Screenshots in verify/screenshots/${slug}/`)
  })
})

/**
 * Source-level guardrails (no browser): each rule lives in its own file under
 * verify/rules/, the validator runs it, and here every rule becomes its own
 * @source test — so CI reports them individually and `verify:source` selects them
 * with `-g @source`. To add a guardrail, drop a file in verify/rules/ and list it
 * in verify/rules/index.ts; it shows up here automatically.
 */
for (const rule of sourceRules) {
  test(`${rule.title} @source`, () => {
    const [result] = runRules([rule])
    expect(result.violations, formatFailure(result)).toEqual([])
  })
}
