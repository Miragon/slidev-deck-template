import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { repoRoot, slideSourceFiles } from '../helpers'
import type { Rule } from './types'

/**
 * Authors must write the literal character, never an HTML escape: an entity like
 * &#39; renders to ' in the DOM, so it slips past the rendered-slide checks and
 * silently litters the source. Catch them here, at the source.
 */
const ENTITY = /&(#[0-9]+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/

export const noHtmlEntities: Rule = {
  id: 'no-html-entities',
  title: 'no HTML entities in slide source',
  message: 'HTML entities must not appear in slide source — write the literal character instead',
  check() {
    const offenders: string[] = []
    for (const file of slideSourceFiles()) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        const m = line.match(ENTITY)
        if (m) offenders.push(`${relative(repoRoot, file)}:${i + 1}  ${m[0]}  →  ${line.trim()}`)
      })
    }
    return offenders
  },
}
