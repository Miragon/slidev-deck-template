import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseSync } from '@slidev/parser'
import { repoRoot, slideSourceFiles } from '../helpers'
import type { Rule } from './types'

/** The theme's layout archetypes live one-.vue-file-per-layout under packages/toolkit/layouts/. */
const LAYOUTS_DIR = join(repoRoot, 'packages', 'toolkit', 'layouts')

/**
 * Slidev built-in layouts allowed even though they are not theme archetypes.
 * Only `default`, which hosts full-bleed component slides (the Agenda). Keep this
 * list short. `none` is deliberately NOT here: it renders a slide with no layout
 * wrapper at all — the freehand slide this guardrail exists to prevent.
 */
const BUILTIN_LAYOUTS = ['default']

/**
 * The sanctioned set of `layout:` values: every theme archetype (derived from
 * packages/toolkit/layouts/*.vue, never hardcoded) plus the small built-in allowlist above.
 */
function sanctionedLayouts(): Set<string> {
  const names = new Set(BUILTIN_LAYOUTS)
  if (existsSync(LAYOUTS_DIR)) {
    for (const f of readdirSync(LAYOUTS_DIR)) {
      if (f.endsWith('.vue')) names.add(f.slice(0, -'.vue'.length))
    }
  }
  return names
}

/**
 * Per-slide frontmatter for a source file, via Slidev's own parser (so the
 * `---` / YAML rules match the renderer exactly). parseSync does NOT resolve
 * `src:` imports, so import stubs surface as slides with `src` set and no layout.
 */
function slideFrontmatters(file: string): { layout?: string; src?: string; start: number }[] {
  const parsed = parseSync(readFileSync(file, 'utf8'), file)
  return parsed.slides.map((s) => ({
    layout: s.frontmatter?.layout,
    src: s.frontmatter?.src,
    // `start` is 0-based over the file's lines; +1 for a human-readable line number.
    start: (s.start ?? 0) + 1,
  }))
}

/**
 * Consistency guardrail: every slide must opt into a layout archetype, so no slide
 * silently falls back to a freehand/default rendering that drifts off the design
 * system. The allowed set is DERIVED from packages/toolkit/layouts/*.vue (never hardcoded),
 * plus the built-in `default` (full-bleed component slides like the Agenda). `src:`
 * import stubs legitimately have no layout of their own and are exempt.
 */
export const sanctionedLayout: Rule = {
  id: 'sanctioned-layout',
  title: 'every slide declares a sanctioned layout',
  message: 'Every slide must declare a sanctioned layout archetype',
  check() {
    const allowed = sanctionedLayouts()
    const list = [...allowed].sort().join(', ')
    const offenders: string[] = []
    for (const file of slideSourceFiles()) {
      for (const s of slideFrontmatters(file)) {
        if (s.src) continue // import stub — the layout lives in the imported file
        const rel = `${relative(repoRoot, file)}:${s.start}`
        if (!s.layout) offenders.push(`${rel}  →  no layout: declared. Add one of: ${list}`)
        else if (!allowed.has(s.layout)) offenders.push(`${rel}  →  layout: ${s.layout} is not a sanctioned archetype. Use one of: ${list}`)
      }
    }
    return offenders
  },
}
