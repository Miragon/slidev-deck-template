import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { matchesAny } from '../../glob.mjs'
import { repoRoot, toRel } from '../../helpers.mjs'

/**
 * Every `var(--miragon-*)` must resolve to a token that theme.css actually defines.
 *
 * This exists because of a real, silent regression: a palette cleanup removed
 * `--miragon-blue-dark`, but `code.css` still read it. CSS does not warn about an
 * undefined custom property. The declaration is simply dropped and the element
 * inherits instead, so inline code on the closing slide rendered white-on-white.
 * The build was green, the deck was broken, and nothing but a human eye on that
 * one slide would have caught it.
 *
 * The failure mode is the point: an undefined token is invisible everywhere except
 * the one place it renders, and it renders as "inherited", which usually looks
 * plausible. So it gets asserted mechanically instead.
 *
 * Deliberately narrow:
 *   - only the `--miragon-*` namespace (the theme's own contract; a deck is free
 *     to define its own variables anywhere)
 *   - only fully closed, literal references `var(--miragon-foo)`. A computed name
 *     (`var(--miragon-gradient-${accent})` in a Vue binding) cannot be resolved
 *     statically and is skipped rather than guessed at.
 */

/** Where a token may be DEFINED. theme.css is the single token file by design. */
const DEFINITION_FILES = ['packages/toolkit/styles/theme.css']

/** Where a token may be USED. */
const USAGE_GLOBS = [
  'packages/toolkit/**/*.vue',
  'packages/toolkit/**/*.css',
  'packages/toolkit/**/*.ts',
  'deck/**/*.md',
  'deck/**/*.vue',
]

const DEFINITION = /^\s*(--miragon-[a-z0-9-]+)\s*:/gm
/** A literal, closed reference. `[^)]*` keeps `var(--x, fallback)` in scope. */
const USAGE = /var\(\s*(--miragon-[a-z0-9-]+)\s*[),]/g

/** 1-based line number of a character offset. */
const lineOf = (src, index) => src.slice(0, index).split('\n').length

/** Pure core (fixture-free, testable): the token names a stylesheet defines. */
export function definedTokens(css) {
  return new Set([...css.matchAll(DEFINITION)].map((m) => m[1]))
}

/**
 * Pure core: every literal `var(--miragon-*)` in a source file that is not in
 * `defined`. Returns `{ token, line }[]`.
 *
 * A `var(--x, fallback)` with a fallback still counts as undefined: the fallback
 * hides the breakage at render time, but the token is gone and the intent is lost.
 * That is worth one line of report, not silence.
 */
export function undefinedUsages(src, defined) {
  const out = []
  for (const m of src.matchAll(USAGE)) {
    if (!defined.has(m[1])) out.push({ token: m[1], line: lineOf(src, m.index) })
  }
  return out
}

/** Directory names never worth walking. */
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.slidev', 'coverage'])

/** The literal path prefix of a glob, i.e. everything before its first wildcard. */
function globRoot(glob) {
  const out = []
  for (const seg of glob.split('/')) {
    if (seg.includes('*') || seg.includes('?')) break
    out.push(seg)
  }
  return out.join('/')
}

/** Absolute paths of every file matching USAGE_GLOBS. */
function usageFiles() {
  const files = new Set()
  const walk = (dir) => {
    if (!existsSync(dir)) return
    for (const name of readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue
      const p = join(dir, name)
      let st
      try {
        st = statSync(p)
      } catch {
        continue
      }
      if (st.isDirectory()) walk(p)
      else if (matchesAny(toRel(p), USAGE_GLOBS)) files.add(p)
    }
  }
  for (const r of new Set(USAGE_GLOBS.map(globRoot))) walk(join(repoRoot(), r))
  return [...files].sort()
}

export const brandTokenDefined = {
  id: 'brand-token-defined',
  type: 'source',
  title: 'every brand token reference resolves',
  message: 'var(--miragon-*) must point at a token theme.css defines',
  meta: { category: 'required', default: 'error' },
  check() {
    const root = repoRoot()
    const themeFiles = DEFINITION_FILES.map((f) => join(root, f)).filter((f) => existsSync(f))
    if (!themeFiles.length) {
      // A scaffolded deck consumes the toolkit from node_modules and vendors no
      // theme.css. Nothing to check is NOT a pass, so report it as such.
      return { skipped: 'no bundled theme.css in this repo (the toolkit ships it from node_modules)' }
    }

    const defined = new Set()
    for (const f of themeFiles) {
      for (const t of definedTokens(readFileSync(f, 'utf8'))) defined.add(t)
    }

    const offenders = []
    for (const abs of usageFiles()) {
      const src = readFileSync(abs, 'utf8')
      for (const u of undefinedUsages(src, defined)) {
        offenders.push({
          file: toRel(abs),
          line: u.line,
          message: `${u.token} is never defined in packages/toolkit/styles/theme.css. CSS drops the declaration silently and the element inherits instead, so this renders wrong on exactly the slides that use it. Define the token, or point the reference at an existing one.`,
        })
      }
    }
    return offenders
  },
}
