import { readFileSync } from 'node:fs'
import { toRel } from '../../helpers.mjs'

/**
 * No emoji icons in slide content. Use inline SVG or Iconify (`i-*`) classes.
 *
 * Pure source scan, deckungsgleich with the old rendered check: an emoji can only
 * reach the DOM as a literal code point in the source (HTML entities are banned by
 * `no-html-entities`). Same `\p{Extended_Pictographic}` test as before. Speaker-note
 * comments are exempt.
 */

const EMOJI = /\p{Extended_Pictographic}/u

/** Replace `<!-- … -->` comments with blanks, preserving newlines so line numbers stay true. */
const blankComments = (text) => text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))

/** Pure core (fixture-free, testable): 1-based line numbers of every emoji outside speaker notes. */
export function findEmojis(source) {
  const lines = []
  blankComments(source).split('\n').forEach((line, i) => {
    if (EMOJI.test(line)) lines.push(i + 1)
  })
  return lines
}

export const noEmoji = {
  id: 'no-emoji',
  type: 'source',
  title: 'no emoji icons',
  message: 'Slide content must not contain emoji',
  meta: { category: 'required', default: 'error' },
  check({ sourceFiles = [] } = {}) {
    const offenders = []
    for (const file of sourceFiles) {
      const rel = toRel(file)
      const src = readFileSync(file, 'utf8')
      const byLine = src.split('\n')
      for (const line of findEmojis(src)) {
        offenders.push({ file: rel, line, message: `contains an emoji. Use inline SVG or Iconify (i-*) icon classes instead.  →  ${byLine[line - 1].trim()}` })
      }
    }
    return offenders
  },
}
