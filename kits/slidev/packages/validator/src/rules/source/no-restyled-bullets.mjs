import { readFileSync } from 'node:fs'
import { toRel } from '../../helpers.mjs'

/**
 * Bullets: the layout owns the marker; no per-slide inline list-style override.
 *
 * Like `no-inline-font`, an author can only override bullet styling through a
 * `style=` / `:style=` attribute or raw HTML (banned by `no-raw-html`), both visible
 * in the source. Pure source scan. Fenced code, comments, and inline code are
 * blanked first so an illustrative `style="list-style: …"` in a sample is not flagged.
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

/** Pure core (fixture-free, testable): 1-based line numbers of inline `list-style` in author content. */
export function findRestyledBullets(source) {
  const lines = []
  sanitize(source).split('\n').forEach((line, i) => {
    STYLE_ATTR.lastIndex = 0
    let m
    while ((m = STYLE_ATTR.exec(line))) {
      if (/list-style/i.test(m[2])) {
        lines.push(i + 1)
        break
      }
    }
  })
  return lines
}

export const noRestyledBullets = {
  id: 'no-restyled-bullets',
  type: 'source',
  title: 'bullets not restyled',
  message: 'Slide content must not override bullet styling inline',
  meta: { category: 'recommended', default: 'error' },
  check({ sourceFiles = [] } = {}) {
    const offenders = []
    for (const file of sourceFiles) {
      const rel = toRel(file)
      const src = readFileSync(file, 'utf8')
      const byLine = src.split('\n')
      for (const line of findRestyledBullets(src)) {
        offenders.push({ file: rel, line, message: `overrides bullet styling inline. Use plain <ul>/<li>; the layout provides the marker.  →  ${byLine[line - 1].trim()}` })
      }
    }
    return offenders
  },
}
