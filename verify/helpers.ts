/**
 * Shared, Node-side helpers for the layout verification suite.
 * Browser-side measurement lives inline in slides.spec.ts (it must be
 * self-contained so Playwright can serialize it into page.evaluate).
 *
 * This template is a single deck: the entry point is deck/slides.md, which
 * pulls its chapters from deck/chapter/*.md via `src:`. There is no deck
 * manifest to resolve.
 */

import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// @ts-ignore
export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

// The single deck entry point.
export const DECK_ENTRY = join(repoRoot, 'deck', 'slides.md')

// Each chapter is a folder deck/chapter/<chapter>/ with <chapter>.md + resources/.
export const CHAPTER_DIR = join(repoRoot, 'deck', 'chapter')

// The slide source files: the entry + one <chapter>.md per chapter folder.
export function slideSourceFiles(): string[] {
  const files = [DECK_ENTRY]
  if (existsSync(CHAPTER_DIR)) {
    for (const ch of readdirSync(CHAPTER_DIR)) {
      const md = join(CHAPTER_DIR, ch, `${ch}.md`)
      if (existsSync(md)) files.push(md)
    }
  }
  return files
}

/** Every chapter's exported Excalidraw diagrams. */
export function excalidrawSvgFiles(): string[] {
  const out: string[] = []
  if (!existsSync(CHAPTER_DIR)) return out
  for (const ch of readdirSync(CHAPTER_DIR)) {
    const resDir = join(CHAPTER_DIR, ch, 'resources')
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
 * is not enough: content jammed against the floor reads as cut off and leaves no
 * breathing room. The static layouts keep a 24-32px bottom margin by design;
 * 16px sits below that healthy floor but well above the few-px gap a too-tall
 * slide leaves, so it flags the genuinely-too-low without false positives.
 */
export const MIN_BOTTOM_MARGIN = 16

/**
 * Parse a page selection like "4-10", "4,5,9", or a mix "4,5,9-11" into a sorted,
 * de-duplicated list of 1-based slide numbers, clamped to the deck's slide count.
 * An empty/undefined spec means "every slide" (the default full run). Throws on a
 * malformed segment or a selection that lands entirely outside 1..total, so a typo
 * fails loudly instead of silently verifying nothing.
 */
export function parsePages(spec: string | undefined, total: number): number[] {
  if (!spec || !spec.trim()) return Array.from({ length: total }, (_, i) => i + 1)
  const out = new Set<number>()
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
      throw new Error(`Invalid VERIFY_PAGES segment "${seg}". Use e.g. "4-10", "4,5,9", or "4,5,9-11".`)
    }
  }
  const pages = [...out].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  if (!pages.length) throw new Error(`VERIFY_PAGES="${spec}" selected no slides in the deck's range 1-${total}.`)
  return pages
}

/**
 * Turn the deck's title (from window.__slidev__.configs.title) into a folder
 * slug for screenshots. Falls back to 'deck' for an untitled deck.
 */
export function slugFromTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'deck'
}
