/**
 * Shared, Node-side helpers for the validator.
 *
 * The validator runs against the deck in the CURRENT WORKING DIRECTORY: in the
 * template monorepo that is the repo root; in a scaffolded deck it is the deck
 * root. Both have the same `deck/` layout (entry + one folder per chapter), so a
 * cwd-relative root works in both. These are functions, not module-level
 * constants, so tests can `process.chdir()` into a fixture between calls.
 */

import { readdirSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

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

/** Each chapter is a folder deck/chapter/<chapter>/ with <chapter>.md + resources/. */
export function chapterDir() {
  return join(repoRoot(), 'deck', 'chapter')
}

/** The slide source files: the entry + one <chapter>.md per chapter folder. */
export function slideSourceFiles() {
  const files = []
  const entry = deckEntry()
  if (existsSync(entry)) files.push(entry)
  const dir = chapterDir()
  if (existsSync(dir)) {
    for (const ch of readdirSync(dir)) {
      const md = join(dir, ch, `${ch}.md`)
      if (existsSync(md)) files.push(md)
    }
  }
  return files
}

/** Every chapter's exported Excalidraw diagrams (committed sources). */
export function excalidrawSvgFiles() {
  const out = []
  const dir = chapterDir()
  if (!existsSync(dir)) return out
  for (const ch of readdirSync(dir)) {
    const resDir = join(dir, ch, 'resources')
    if (!existsSync(resDir)) continue
    for (const f of readdirSync(resDir)) {
      if (f.endsWith('.excalidraw.svg')) out.push(join(resDir, f))
    }
  }
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
