/**
 * Map each rendered slide (1-based page number) back to the chapter source file it
 * came from, so rendered violations can be attributed to a file and matched by the
 * config's `overrides`/`exceptions` globs. Uses Slidev's own FS loader, which
 * resolves the deck's `src:` imports into a flat slide list with per-slide
 * `source.filepath`. Best-effort: on any failure, callers fall back to the entry.
 */

import { load } from '@slidev/parser/fs'
import { repoRoot, deckEntry, toRel } from './helpers.mjs'

/** page number (1-based) → repo-relative source file. */
export async function slideFileMap() {
  const map = new Map()
  try {
    const data = await load(repoRoot(), deckEntry())
    for (const s of data.slides) {
      const fp = s.source?.filepath
      if (fp) map.set((s.index ?? 0) + 1, toRel(fp))
    }
  } catch {
    // leave empty — caller falls back to the deck entry
  }
  return map
}
