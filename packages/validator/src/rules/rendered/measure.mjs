/**
 * The single browser-side measurement pass, run once per fully-revealed slide.
 * Every rendered rule interprets the plain object this returns, so the DOM is
 * walked ONE time per slide no matter how many rendered rules are enabled.
 *
 * This function is serialized and executed inside the page by Playwright, so it
 * must be fully self-contained (no imports, no closure over module scope).
 */
export function measureSlide(n) {
  /**
   * `:not(.disable-view-transition)` selects the live presentation slide and
   * skips the overview miniatures the Agenda renders.
   */
  const root = document.querySelector(`.slidev-page-${n}:not(.disable-view-transition)`)
  if (!root) return null
  const layout = root.querySelector('.slidev-layout') || root
  const all = [...layout.querySelectorAll('*')]
  const rgb = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map((x) => parseFloat(x))
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }
  }
  const isBlue = (c) => !!c && c.b > 150 && c.b > c.r + 40 && c.b > c.g + 40

  // --- Fit: horizontal overflow + how close content sits to the bottom ---
  const box = layout.getBoundingClientRect()
  const cw = layout.clientWidth || 980
  const ch = layout.clientHeight || 552
  const scale = box.width / cw
  let right = cw
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
  const pictographic = '\\p{Extended' + '_Pictographic}'
  const emoji = new RegExp(pictographic, 'u').test(text)

  // --- Headings must be black, never blue ---
  const blueHeads = [...layout.querySelectorAll('h1, h2')].filter((h) => isBlue(rgb(getComputedStyle(h).color))).length

  // --- Cards stay white: no colored/gradient background, no colored left-accent border ---
  const badCards = [...layout.querySelectorAll('[class*="rounded-xl"]')].filter((el) => {
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

  // --- Layouts own typography: no inline font-family in author slide content ---
  const inlineFonts = all.filter((el) => el.style && el.style.fontFamily && !el.closest('svg, pre, code, button')).length

  // --- Bullets: layout owns the marker; no per-slide list-style override; max 1 nesting level ---
  const listOverrides = [...layout.querySelectorAll('ul, li')].filter((el) => el.style && (el.style.listStyle || el.style.listStyleType)).length
  const nestedLists = layout.querySelectorAll('ul ul, ul ol, ol ul, ol ol').length

  return { cw, ch, right, contentBottom, emDash, emoji, blueHeads, badCards, inlineFonts, listOverrides, nestedLists }
}
