import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { repoRoot, excalidrawSvgFiles } from '../helpers'
import type { Rule } from './types'

/**
 * The COMMITTED .excalidraw.svg is the editable source. It must render light in
 * editor previews (IntelliJ/Finder/GitHub): NO dark-mode invert filter on the root
 * <svg>, and a baked full-canvas LIGHT background (#F9F7F7 or #FFFFFF). The
 * chapter-resources plugin (deck/vite.config.ts) strips that background to make the
 * diagram transparent on the slide at serve/build time — validated by the sibling
 * excalidraw-built-transparent rule.
 */
const LIGHT = /^#(?:f9f7f7|ffffff)$/i

export const excalidrawCommittedLight: Rule = {
  id: 'excalidraw-committed-light',
  title: 'committed excalidraw diagrams are light (no dark filter, light background)',
  message: 'Committed Excalidraw diagrams must be light (no dark filter, light background)',
  check() {
    const offenders: string[] = []
    for (const file of excalidrawSvgFiles()) {
      const svg = readFileSync(file, 'utf8')
      const rel = relative(repoRoot, file)
      const tag = (svg.match(/<svg\b[^>]*>/) || [''])[0]
      if (/\bfilter=/.test(tag)) offenders.push(`${rel}  →  dark-mode filter on <svg> (must be light)`)
      const dim = tag.match(/\bwidth="(\d+)"[^>]*\bheight="(\d+)"/)
      if (dim) {
        const m = svg.match(new RegExp(`<rect x="0" y="0" width="${dim[1]}" height="${dim[2]}"[^>]*\\bfill="(#[0-9a-fA-F]{6})"`))
        if (!m) offenders.push(`${rel}  →  no full-canvas background rect (needs a light <rect> so it previews light)`)
        else if (!LIGHT.test(m[1])) offenders.push(`${rel}  →  background ${m[1]} is not light (must be #F9F7F7 or #FFFFFF)`)
      }
    }
    return offenders
  },
}
