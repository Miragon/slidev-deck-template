import { defineTransformersSetup, defineMarkdownTransformer } from '@slidev/types'

/**
 * Make inline Markdown render inside a component body, whatever the author wrote.
 *
 * Slidev only runs inline Markdown (`` `code` ``, **bold**, links) inside a
 * component body when that body is its OWN Markdown block, i.e. separated from
 * the opening/closing tags by blank lines. A body written on the tag line
 * (`<Card title="X">`code`</Card>`) is handed through as raw HTML and the
 * backticks/asterisks render literally. That is a silent footgun: the natural,
 * one-line authoring form the deck otherwise mandates is exactly the form that
 * breaks.
 *
 * This pre-transformer rewrites the single-line form into the blank-line form
 * before the Markdown is parsed, so authors keep writing components on one line
 * and inline Markdown just works:
 *
 *   <Step label="Handle">`@Autowired ProcessEngine`.</Step>
 *
 * becomes, only for the parser:
 *
 *   <Step label="Handle">
 *
 *   `@Autowired ProcessEngine`.
 *
 *   </Step>
 *
 * Paired with the `.step__body > p` rule in StepList.vue (which renders the
 * resulting <p> inline) the step still reads as "Label: body" on one line.
 *
 * Scope is deliberately narrow: only the components whose default slot is a
 * prose body, only when the whole `<Tag …>body</Tag>` sits on a single line
 * (multi-line bodies are already blank-line blocks and are left untouched), and
 * never inside fenced code blocks (so slides that *show* component source stay
 * verbatim). Extend BODY_TAGS if another prose-body component is added.
 */
const BODY_TAGS = ['Card', 'Step']

// <indent><Tag attrs>body</Tag> with body and close tag on the same line.
const SINGLE_LINE = new RegExp(
  String.raw`^([ \t]*)<(${BODY_TAGS.join('|')})\b([^>\n]*)>(.+?)</\2>[ \t]*$`,
)
const FENCE = /^\s*(```|~~~)/

const wrapComponentBody = defineMarkdownTransformer((ctx) => {
  const src = ctx.s.original
  if (!src) return
  const lines = src.split('\n')
  let inFence = false
  let changed = false
  for (let i = 0; i < lines.length; i++) {
    if (FENCE.test(lines[i])) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = lines[i].match(SINGLE_LINE)
    if (!m) continue
    const [, indent, tag, attrs, body] = m
    if (!body.trim()) continue
    lines[i] = `${indent}<${tag}${attrs}>\n\n${body.trim()}\n\n${indent}</${tag}>`
    changed = true
  }
  if (changed) ctx.s.overwrite(0, src.length, lines.join('\n'))
})

export default defineTransformersSetup(() => ({ pre: [wrapComponentBody] }))
