import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { parseSync } from '@slidev/parser'
import { repoRoot, slideSourceFiles, toRel } from '../../helpers.mjs'

/**
 * The theme's layout archetypes live one-.vue-file-per-layout under the toolkit's
 * `layouts/`. Resolve the INSTALLED `@miragon/slidev-toolkit` from the deck's own
 * root first (a scaffolded deck consumes the toolkit purely from npm and has no
 * `packages/toolkit/` source tree). Fall back to the in-repo source so the
 * template monorepo itself still verifies.
 */
function layoutsDir() {
  try {
    const from = pathToFileURL(join(repoRoot(), 'package.json'))
    const pkg = createRequire(from).resolve('@miragon/slidev-toolkit/package.json')
    return join(dirname(pkg), 'layouts')
  } catch {
    return join(repoRoot(), 'packages', 'toolkit', 'layouts')
  }
}

/**
 * Slidev built-in layouts allowed even though they are not theme archetypes.
 * Only `default`, which hosts full-bleed component slides (the Agenda). `none` is
 * deliberately NOT here: it renders a slide with no layout wrapper at all.
 */
const BUILTIN_LAYOUTS = ['default']

function sanctionedLayouts() {
  const names = new Set(BUILTIN_LAYOUTS)
  const dir = layoutsDir()
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.vue')) names.add(f.slice(0, -'.vue'.length))
    }
  }
  return names
}

function slideFrontmatters(file) {
  const parsed = parseSync(readFileSync(file, 'utf8'), file)
  return parsed.slides.map((s) => ({
    layout: s.frontmatter?.layout,
    src: s.frontmatter?.src,
    start: (s.start ?? 0) + 1,
  }))
}

/**
 * Consistency guardrail: every slide must opt into a layout archetype, so no slide
 * silently falls back to a freehand/default rendering that drifts off the design
 * system. The allowed set is DERIVED from the installed toolkit's `layouts/*.vue`
 * (never hardcoded), plus the built-in `default`. `src:` import stubs are exempt.
 */
export const sanctionedLayout = {
  id: 'sanctioned-layout',
  type: 'source',
  title: 'every slide declares a sanctioned layout',
  message: 'Every slide must declare a sanctioned layout archetype',
  meta: { category: 'required', default: 'error' },
  check() {
    const allowed = sanctionedLayouts()
    const list = [...allowed].sort().join(', ')
    const offenders = []
    for (const file of slideSourceFiles()) {
      const rel = toRel(file)
      for (const s of slideFrontmatters(file)) {
        if (s.src) continue // import stub — the layout lives in the imported file
        if (!s.layout) offenders.push({ file: rel, line: s.start, message: `no layout: declared. Add one of: ${list}` })
        else if (!allowed.has(s.layout)) offenders.push({ file: rel, line: s.start, message: `layout: ${s.layout} is not a sanctioned archetype. Use one of: ${list}` })
      }
    }
    return offenders
  },
}
