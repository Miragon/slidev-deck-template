import { readFileSync } from 'node:fs'
import { parseSync } from '@slidev/parser'
import MarkdownIt from 'markdown-it'
import { toRel } from '../../helpers.mjs'

/**
 * Keep bullet lists to one level. Split the slide instead of sub-bullets.
 *
 * Nesting is authored in the markdown body (indented list items), so it is fully
 * visible in the source — no browser needed. Each slide body is tokenised with
 * markdown-it (Node, no server) and a `*_list_open` that fires while already inside
 * a list is a nested level, mirroring the old rendered selector `ul ul, ul ol, …`.
 * Only the body is scanned (frontmatter YAML lists are component props, not bullets).
 */

const md = new MarkdownIt({ html: true })

/** Pure core (fixture-free, testable): how many list levels open while already inside a list. */
export function countNestedLists(content) {
  if (typeof content !== 'string' || !content.trim()) return 0
  let depth = 0
  let nested = 0
  for (const t of md.parse(content, {})) {
    if (/(?:bullet|ordered)_list_open/.test(t.type)) {
      depth++
      if (depth >= 2) nested++
    } else if (/(?:bullet|ordered)_list_close/.test(t.type)) {
      depth--
    }
  }
  return nested
}

export const noNestedBullets = {
  id: 'no-nested-bullets',
  type: 'source',
  title: 'no nested bullets',
  message: 'Bullet lists must stay at one level',
  meta: { category: 'recommended', default: 'warn' },
  check({ sourceFiles = [] } = {}) {
    const offenders = []
    for (const file of sourceFiles) {
      const rel = toRel(file)
      const parsed = parseSync(readFileSync(file, 'utf8'), file)
      for (const s of parsed.slides) {
        if (s.frontmatter?.src) continue // import stub — the body lives in the imported file
        const n = countNestedLists(s.content)
        if (n > 0) {
          offenders.push({ file: rel, line: (s.start ?? 0) + 1, message: `${n} nested list(s). Keep to one level; split the slide instead of sub-bullets.` })
        }
      }
    }
    return offenders
  },
}
