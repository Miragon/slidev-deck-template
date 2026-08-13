import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { parseSync } from '@slidev/parser'
import { repoRoot, slideSourceFiles } from '../helpers'
import type { Rule } from './types'

/**
 * Content headings (frontmatter `title` → `<h2 class="*-title">`) must stay on one
 * line; a wrap shrinks the content area below. Statement headings (`hero`/`section`/
 * `subsection`/`cover`, markdown `#` → `<h1>`) may wrap and are not checked.
 *
 * Two checks: explicit break (`<br>`/newline/trailing `\`) is always an error; the
 * char budget is a heuristic ("WWW" and "iii" differ in width) — the binding
 * single-line width measurement is a separate rendered check.
 */

/**
 * Max heading chars per layout, derived from each layout's container width + font
 * size (average ~0.5em advance) with headroom over the longest real heading (38).
 * `content-image`'s title sits in one narrow grid column. Inline for now — moves to
 * a central verify config (with OPT_OUT_KEY) when that lands.
 */
const HEADING_LIMITS: Record<string, number> = {
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
function visibleLength(title: string): number {
  return [...title.trim()].length
}

/** `<br>`/`<br/>`, an embedded newline, or a trailing backslash continuation. */
function hasExplicitBreak(title: string): boolean {
  return /<br\s*\/?>/i.test(title) || /[\r\n]/.test(title) || /\\\s*$/.test(title)
}

/** Pure per-heading check (fixture-testable). Returns reasons; [] = ok. */
export function scanHeading(
  title: string | undefined,
  layout: string | undefined,
  optOut = false,
): string[] {
  if (optOut) return []
  if (!layout || !(layout in HEADING_LIMITS)) return []
  if (typeof title !== 'string' || !title.trim()) return []

  const reasons: string[] = []
  if (hasExplicitBreak(title)) {
    reasons.push('content heading contains an explicit line break; write it as a single-line heading')
  }
  const limit = HEADING_LIMITS[layout]
  const len = visibleLength(title)
  if (len > limit) {
    reasons.push(
      `content heading is ${len} characters; the ${layout} layout allows up to ${limit}. ` +
        'Shorten it or use a shorter heading',
    )
  }
  return reasons
}

/** Per-slide frontmatter via Slidev's parser; `src:` import stubs surface with `src` set. */
function slideHeadings(
  file: string,
): { title?: string; layout?: string; src?: string; optOut: boolean; start: number }[] {
  const parsed = parseSync(readFileSync(file, 'utf8'), file)
  return parsed.slides.map((s) => ({
    title: s.frontmatter?.title,
    layout: s.frontmatter?.layout,
    src: s.frontmatter?.src,
    optOut: s.frontmatter?.[OPT_OUT_KEY] === true,
    start: (s.start ?? 0) + 1, // 0-based → human line number
  }))
}

export const contentHeading: Rule = {
  id: 'content-heading',
  title: 'content headings stay single-line',
  message:
    'Content headings must be single-line: no explicit break, and within the layout character budget',
  check() {
    const offenders: string[] = []
    for (const file of slideSourceFiles()) {
      for (const s of slideHeadings(file)) {
        if (s.src) continue // import stub — heading lives in the imported file
        for (const reason of scanHeading(s.title, s.layout, s.optOut)) {
          offenders.push(`${relative(repoRoot, file)}:${s.start}  →  ${reason}: "${s.title}"`)
        }
      }
    }
    return offenders
  },
}
