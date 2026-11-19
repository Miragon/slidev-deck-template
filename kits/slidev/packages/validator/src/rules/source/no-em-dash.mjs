import { readFileSync } from 'node:fs'
import { toRel } from '../../helpers.mjs'

/**
 * No em-dashes in slide content. Use commas, periods, parentheses, or colons.
 *
 * This is a pure source scan and it is deckungsgleich with the old rendered check:
 * Slidev does NOT enable the markdown-it `typographer` (no `---` → `—` conversion),
 * and HTML entities are already banned at source (`no-html-entities`), so a literal
 * `—` in the source is the only way one can reach the DOM. Speaker-note comments
 * (`<!-- … -->`) are exempt: notes may be in another language and use em-dashes.
 */

/** Replace `<!-- … -->` comments with blanks, preserving newlines so line numbers stay true. */
const blankComments = (text) => text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))

/** Pure core (fixture-free, testable): 1-based line numbers of every em-dash outside speaker notes. */
export function findEmDashes(source) {
  const lines = []
  blankComments(source).split('\n').forEach((line, i) => {
    if (line.includes('—')) lines.push(i + 1)
  })
  return lines
}

export const noEmDash = {
  id: 'no-em-dash',
  type: 'source',
  title: 'no em-dashes',
  message: 'Slide content must not contain an em-dash (—)',
  meta: { category: 'required', default: 'error' },
  check({ sourceFiles = [] } = {}) {
    const offenders = []
    for (const file of sourceFiles) {
      const rel = toRel(file)
      const src = readFileSync(file, 'utf8')
      const byLine = src.split('\n')
      for (const line of findEmDashes(src)) {
        offenders.push({ file: rel, line, message: `contains an em-dash (—). Use commas, periods, parentheses, or colons.  →  ${byLine[line - 1].trim()}` })
      }
    }
    return offenders
  },
}
