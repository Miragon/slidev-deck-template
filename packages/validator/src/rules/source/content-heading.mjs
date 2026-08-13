import { readFileSync } from 'node:fs'
import { parseSync } from '@slidev/parser'
import { toRel } from '../../helpers.mjs'

/**
 * Content headings (frontmatter `title` → `<h2 class="*-title">`) must stay on one
 * line; a wrap shrinks the content area below. Statement headings (`hero`/`section`/
 * `subsection`/`cover`, markdown `#` → `<h1>`) may wrap and are not checked.
 *
 * Two checks: an explicit break (`<br>`/newline/trailing `\`) is always flagged; the
 * char budget is a heuristic ("WWW" and "iii" differ in width).
 */

/**
 * Max heading chars per layout, derived from each layout's container width + font
 * size (~0.5em advance) with headroom over the longest real heading (38).
 * `content-image`'s title sits in one narrow grid column.
 */
const HEADING_LIMITS = {
  content: 50,
  compare: 50,
  'content-image': 28,
  showcase: 56,
  goodbad: 56,
  excalidraw: 56,
  bpmn: 56,
  dmn: 56,
  mermaid: 56,
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
  if (!layout || !(layout in HEADING_LIMITS)) return []
  if (typeof title !== 'string' || !title.trim()) return []

  const reasons = []
  if (hasExplicitBreak(title)) {
    reasons.push('content heading contains an explicit line break; write it as a single-line heading')
  }
  const limit = HEADING_LIMITS[layout]
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
