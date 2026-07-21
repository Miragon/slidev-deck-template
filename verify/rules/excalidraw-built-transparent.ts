import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { repoRoot } from '../helpers'
import type { Rule } from './types'

/**
 * The chapter-resources plugin (deck/vite.config.ts) strips the baked background at
 * build time so the diagram is transparent and blends on the slide AND inside white
 * cards. (Arrowheads are left as excalidraw's own native triangle arrows.) We
 * validate the BUILT output. Requires a prior `npm run build`; if dist/ is absent
 * the check notes it and passes (CI builds before verifying).
 */
export const excalidrawBuiltTransparent: Rule = {
  id: 'excalidraw-built-transparent',
  title: 'built excalidraw diagrams are transparent',
  message: 'Built Excalidraw diagrams must be transparent',
  check() {
    const distRoot = join(repoRoot, 'dist')
    const files: string[] = []
    const walk = (d: string) => {
      if (!existsSync(d)) return
      for (const n of readdirSync(d)) {
        const p = join(d, n)
        if (statSync(p).isDirectory()) walk(p)
        else if (n.endsWith('.excalidraw.svg')) files.push(p)
      }
    }
    walk(distRoot)
    if (!files.length) {
      console.log('built excalidraw check skipped: no dist/ output — run `npm run build` to validate')
      return []
    }
    const offenders: string[] = []
    for (const file of files) {
      const svg = readFileSync(file, 'utf8')
      const rel = relative(repoRoot, file)
      if (/<rect x="0" y="0" width="[0-9.]+" height="[0-9.]+" fill="#[0-9a-fA-F]{6}"><\/rect>/.test(svg)) {
        offenders.push(`${rel}  →  still has a baked background rect (plugin must strip it for the slide)`)
      }
    }
    return offenders
  },
}
