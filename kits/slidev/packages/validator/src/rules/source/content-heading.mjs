import { readFileSync } from 'node:fs'
import { parseSync } from '@slidev/parser'
import { toRel } from '../../helpers.mjs'

/**
 * Content headings (frontmatter `title` → `<h2 class="*-title">`) must stay on one
 * line; a wrap shrinks the content area below. Statement headings (`hero`/`section`/
 * `subsection`/`cover`/`closing` and the full-bleed `default`, markdown `#` → `<h1>`)
 * may wrap and are the only layouts exempt from the budget.
 *
 * Every other title-bearing layout is budgeted — including any deck-local
 * `deck/layouts/*.vue`. An unknown layout defaults to the BASE limit rather than
 * silently passing; a layout with no `title:` frontmatter never triggers a check.
 *
 * Two checks: an explicit break (`<br>`/newline/trailing `\`) is always flagged; the
 * char budget is a heuristic ("WWW" and "iii" differ in width).
 */

/**
 * Base single-line budget for a content title. Calibrated against the rendered
 * heading, not guessed: limit ≈ floor(titleWidthPx / advancePerChar) minus a ~12%
 * margin, where advancePerChar is measured once in the brand font at the title's
 * size/weight/letter-spacing (Geist, weight 800, ~33.7px, letter-spacing -0.02em →
 * ~17.3px/char over an ~820px title column ⇒ ~47-char wrap point ⇒ 44 with margin).
 * The margin keeps limits clear of the pixel boundary where a few px of
 * kerning/hinting flips a heading onto a second line in the presenter's browser.
 */
const BASE_LIMIT = 44

/**
 * Statement layouts whose heading is a markdown `#` → `<h1>` that may legitimately
 * wrap; never budget-checked. Everything not listed here is budgeted.
 */
const STATEMENT_LAYOUTS = new Set(['hero', 'section', 'subsection', 'cover', 'closing', 'default'])

/**
 * Per-layout budget where the title area differs from the base content column.
 * `content-image`'s title sits in one narrow grid column; the wide diagram/showcase
 * layouts give the title the full slide width. Layouts absent here use BASE_LIMIT.
 * Same re-calibration formula as BASE_LIMIT, per layout's title width.
 */
const HEADING_LIMITS = {
  content: 44,
  compare: 44,
  'content-image': 24,
  showcase: 49,
  goodbad: 49,
  excalidraw: 49,
  bpmn: 49,
  dmn: 49,
  mermaid: 49,
}

/** Off-by-default per-slide opt-out from both checks. */
const OPT_OUT_KEY = 'allowMultilineHeading'

/** Visible length: code points (emoji/umlauts = 1), spaces counted, trimmed. */
function visibleLength(title) {
  return [...title.trim()].length
}

/** `<br>`/`<br/>`, an embedded newline, or a trailing backslash continuation. */
function hasExplicitBreak(title) {
  return /<br\s*\/?>/i.test(title) || /[\r\n]/.test(title) || /\\\s*$/.test(title)
}

/** Pure per-heading check (fixture-testable). Returns reasons; [] = ok. */
export function scanHeading(title, layout, optOut = false) {
  if (optOut) return []
  if (!layout || STATEMENT_LAYOUTS.has(layout)) return []
  if (typeof title !== 'string' || !title.trim()) return []

  const reasons = []
  if (hasExplicitBreak(title)) {
    reasons.push('content heading contains an explicit line break; write it as a single-line heading')
  }
  const limit = HEADING_LIMITS[layout] ?? BASE_LIMIT
  const len = visibleLength(title)
  if (len > limit) {
    reasons.push(`content heading is ${len} characters; the ${layout} layout allows up to ${limit}. Shorten it or use a shorter heading`)
  }
  return reasons
}

/** Per-slide frontmatter via Slidev's parser; `src:` import stubs surface with `src` set. */
function slideHeadings(file) {
  const parsed = parseSync(readFileSync(file, 'utf8'), file)
  return parsed.slides.map((s) => ({
    title: s.frontmatter?.title,
    layout: s.frontmatter?.layout,
    src: s.frontmatter?.src,
    optOut: s.frontmatter?.[OPT_OUT_KEY] === true,
    start: (s.start ?? 0) + 1,
  }))
}

export const contentHeading = {
  id: 'content-heading',
  type: 'source',
  title: 'content headings stay single-line',
  message: 'Content headings must be single-line: no explicit break, and within the layout character budget',
  meta: { category: 'required', default: 'error' },
  check({ sourceFiles = [] } = {}) {
    const offenders = []
    for (const file of sourceFiles) {
      const rel = toRel(file)
      for (const s of slideHeadings(file)) {
        if (s.src) continue // import stub — heading lives in the imported file
        for (const reason of scanHeading(s.title, s.layout, s.optOut)) {
          offenders.push({ file: rel, line: s.start, message: `${reason}: "${s.title}"` })
        }
      }
    }
    return offenders
  },
}
