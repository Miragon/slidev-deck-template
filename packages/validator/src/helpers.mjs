/**
 * Shared, Node-side helpers for the validator.
 *
 * The validator runs against the deck in the CURRENT WORKING DIRECTORY: in the
 * template monorepo that is the repo root; in a scaffolded deck it is the deck
 * root. Both keep their slides under `deck/`, entered at `deck/slides.md`, but the
 * on-disk shape below that is the DECK'S choice: the reference template is flat
 * (one folder per chapter), other decks nest arbitrarily (e.g.
 * `deck/content/<topic>/<chapter>/slides.md`). So source discovery derives the file
 * set from what Slidev actually loads (following every `src:` import), never from a
 * fixed folder shape. These are functions, not module-level constants, so tests can
 * `process.chdir()` / point `SLIDEV_VALIDATOR_ROOT` at a fixture between calls.
 */

import { readdirSync, existsSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { load } from '@slidev/parser/fs'

/** A file path made repo-relative with forward slashes (for display + glob match). */
export function toRel(file) {
  return relative(repoRoot(), file).split('\\').join('/')
}

/** The deck root the validator operates on: the current working directory. */
export function repoRoot() {
  return process.env.SLIDEV_VALIDATOR_ROOT || process.cwd()
}

/** The single deck entry point. */
export function deckEntry() {
  return join(repoRoot(), 'deck', 'slides.md')
}

/** The deck root everything under `deck/` is discovered from. */
export function deckDir() {
  return join(repoRoot(), 'deck')
}

/**
 * The flat reference convention: one folder per chapter, deck/chapter/<chapter>/
 * with <chapter>.md + resources/. Only used as a FALLBACK when the Slidev loader
 * yields nothing (a malformed entry), so a broken deck still gets scanned instead
 * of silently passing on an empty file set.
 */
export function chapterDir() {
  return join(deckDir(), 'chapter')
}

/**
 * The slide source files the deck ACTUALLY renders: the distinct set of
 * `source.filepath` values from Slidev's own FS loader (the same loader
 * `slideFileMap()` uses), which follows every `src:` import to any depth, plus the
 * entry itself. This is structure-agnostic: a flat deck and a deeply nested one
 * both resolve to their full, real file set. Async because the loader is.
 *
 * Fallback: if the loader yields nothing (throws, or an entry with no resolvable
 * slides), scan the flat deck/chapter/<chapter>/<chapter>.md convention so a broken
 * deck surfaces something to check rather than an accidental green on zero files.
 */
export async function slideSourceFiles() {
  const files = new Set()
  const entry = deckEntry()
  if (existsSync(entry)) files.add(entry)
  try {
    const data = await load(repoRoot(), entry)
    for (const s of data.slides) {
      const fp = s.source?.filepath
      if (fp) files.add(fp)
    }
  } catch {
    // loader failed — fall through to the flat-convention fallback below
  }
  if (files.size <= (existsSync(entry) ? 1 : 0)) {
    const dir = chapterDir()
    if (existsSync(dir)) {
      for (const ch of readdirSync(dir)) {
        const md = join(dir, ch, `${ch}.md`)
        if (existsSync(md)) files.add(md)
      }
    }
  }
  return [...files]
}

/**
 * Every committed Excalidraw diagram source in the deck. Recurses all of `deck/`
 * for `*.excalidraw.svg` (under any `resources/` folder, at any nesting depth), so
 * diagrams in a nested deck are found the same as in the flat reference deck.
 */
export function excalidrawSvgFiles() {
  const out = []
  const walk = (d) => {
    if (!existsSync(d)) return
    for (const n of readdirSync(d)) {
      if (n === 'node_modules' || n === '.git') continue
      const p = join(d, n)
      let st
      try {
        st = statSync(p)
      } catch {
        continue
      }
      if (st.isDirectory()) walk(p)
      else if (n.endsWith('.excalidraw.svg')) out.push(p)
    }
  }
  walk(deckDir())
  return out
}

/** The Slidev canvas is a fixed 16:9 box. Anything rendering past it overflows. */
export const CANVAS = { width: 980, height: 552 }

/**
 * Sub-pixel slack: layout/scroll measurements jitter by ~1px. Real overflow
 * (an extra bullet, a too-wide card) is tens of pixels, so this never masks it.
 */
export const TOLERANCE = 2

/**
 * Content must clear the bottom of the canvas by at least this many px. Fitting
 * is not enough: content jammed against the floor reads as cut off. The static
 * layouts keep a 24-32px bottom margin by design; 16px sits below that healthy
 * floor but well above the few-px gap a too-tall slide leaves.
 */
export const MIN_BOTTOM_MARGIN = 16

/**
 * Parse a page selection like "4-10", "4,5,9", or a mix "4,5,9-11" into a sorted,
 * de-duplicated list of 1-based slide numbers, clamped to the deck's slide count.
 * An empty/undefined spec means "every slide". Throws on a malformed segment or a
 * selection entirely outside 1..total, so a typo fails loudly.
 */
export function parsePages(spec, total) {
  if (!spec || !spec.trim()) return Array.from({ length: total }, (_, i) => i + 1)
  const out = new Set()
  for (const raw of spec.split(',')) {
    const seg = raw.trim()
    if (!seg) continue
    const range = seg.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      let a = Number(range[1])
      let b = Number(range[2])
      if (a > b) [a, b] = [b, a]
      for (let n = a; n <= b; n++) out.add(n)
    } else if (/^\d+$/.test(seg)) {
      out.add(Number(seg))
    } else {
      throw new Error(`Invalid page segment "${seg}". Use e.g. "4-10", "4,5,9", or "4,5,9-11".`)
    }
  }
  const pages = [...out].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  if (!pages.length) throw new Error(`Page selection "${spec}" selected no slides in the deck's range 1-${total}.`)
  return pages
}

/** Turn the deck's title into a folder slug for screenshots. */
export function slugFromTitle(title) {
  return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'deck'
}
