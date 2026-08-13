import { readFileSync } from 'node:fs'
import { toRel } from '../../helpers.mjs'

/**
 * Layouts own typography: no inline `font-family` in author slide content.
 *
 * The only way an author can set an inline font is a `style=` / `:style=` attribute
 * on a component (the sanctioned escape hatch is spacing/layout only) or raw HTML
 * (already banned by `no-raw-html`). Both are visible in the source, so this is a
 * pure source scan. Fenced code, comments, and inline code are blanked first so an
 * illustrative `style="font-family: …"` inside a code sample is not flagged.
 */

/** Replace a matched region with blanks, preserving newlines so line numbers stay true. */
const blank = (text, re) => text.replace(re, (m) => m.replace(/[^\n]/g, ' '))

/** Blank fenced code blocks, speaker-note comments, and inline code spans. */
function sanitize(src) {
  src = blank(src, /```[\s\S]*?```/g)
  src = blank(src, /<!--[\s\S]*?-->/g)
  src = blank(src, /`[^`\n]*`/g)
  return src
}

/**
 * An inline `style` / `:style` attribute, single- or double-quoted; group 2 is its
 * value. The look-behind keeps `data-style` / `x-style` fragments from matching.
 */
const STYLE_ATTR = /(?<![-\w]):?style\s*=\s*(['"])([\s\S]*?)\1/gi

/** Pure core (fixture-free, testable): 1-based line numbers of inline `font-family` in author content. */
export function findInlineFonts(source) {
  const lines = []
  sanitize(source).split('\n').forEach((line, i) => {
    STYLE_ATTR.lastIndex = 0
    let m
    while ((m = STYLE_ATTR.exec(line))) {
      if (/font-family/i.test(m[2])) {
        lines.push(i + 1)
        break
      }
    }
  })
  return lines
}

export const noInlineFont = {
  id: 'no-inline-font',
  type: 'source',
  title: 'typography not overridden',
  message: 'Slide content must not set font-family inline',
  meta: { category: 'recommended', default: 'error' },
  check({ sourceFiles = [] } = {}) {
    const offenders = []
    for (const file of sourceFiles) {
      const rel = toRel(file)
      const src = readFileSync(file, 'utf8')
      const byLine = src.split('\n')
      for (const line of findInlineFonts(src)) {
        offenders.push({ file: rel, line, message: `sets font-family inline. Let the layout own typography.  →  ${byLine[line - 1].trim()}` })
      }
    }
    return offenders
  },
}
