import { readFileSync } from 'node:fs'
import { toRel } from '../../helpers.mjs'

/**
 * Consistency guardrail: a slide is markdown + Miragon/Slidev components, never raw
 * HTML. PascalCase tags (<Card>, <Figure>, …) are components; Slidev/Vue built-ins
 * (<template>, <v-clicks>, …) are allowed; any other lowercase tag (<div>, <span>,
 * <style>, <br>, …) is raw HTML and must become a component or plain markdown.
 * Fenced code blocks and speaker-note comments are exempt.
 */
const ALLOWED = new Set(['template', 'component', 'slot', 'transition', 'transition-group', 'keep-alive', 'teleport', 'suspense'])

/** Replace a matched region with blanks, preserving newlines so line numbers stay true. */
const blank = (text, re) => text.replace(re, (m) => m.replace(/[^\n]/g, ' '))

/**
 * A real tag: `<` (optional `/`) + name, immediately followed by whitespace, `/` or
 * `>`. The lookahead rejects markdown autolinks and prose like `<https://…>`.
 */
const TAG = /<\/?([A-Za-z][A-Za-z0-9-]*)(?=[\s/>])/g

export const noRawHtml = {
  id: 'no-raw-html',
  type: 'source',
  title: 'no raw HTML in slide source — markdown and components only',
  message: 'Slides must use markdown and components only — replace raw HTML with a component or plain markdown',
  meta: { category: 'required', default: 'error' },
  check({ sourceFiles = [] } = {}) {
    const offenders = []
    for (const file of sourceFiles) {
      const rel = toRel(file)
      let src = readFileSync(file, 'utf8')
      src = blank(src, /```[\s\S]*?```/g) // fenced code blocks
      src = blank(src, /<!--[\s\S]*?-->/g) // HTML comments (speaker notes)
      src = blank(src, /`[^`\n]*`/g) // inline code spans
      src.split('\n').forEach((line, i) => {
        TAG.lastIndex = 0
        let m
        while ((m = TAG.exec(line))) {
          const tag = m[1]
          if (/^[A-Z]/.test(tag) || tag.startsWith('v-') || ALLOWED.has(tag)) continue
          offenders.push({ file: rel, line: i + 1, message: `<${tag}>  →  ${line.trim()}` })
        }
      })
    }
    return offenders
  },
}
