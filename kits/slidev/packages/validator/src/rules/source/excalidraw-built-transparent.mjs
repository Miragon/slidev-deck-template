import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot, toRel } from '../../helpers.mjs'

/**
 * The chapter-resources plugin (deck/vite.config.ts) strips the baked background at
 * build time so the diagram is transparent on the slide and inside white cards. We
 * validate the BUILT output. Requires a prior `npm run build`; if dist/ is absent
 * the check is reported as NOT APPLICABLE (skipped) rather than passing silently,
 * so the report distinguishes "ran and passed" from "never ran".
 */
export const excalidrawBuiltTransparent = {
  id: 'excalidraw-built-transparent',
  type: 'source',
  title: 'built excalidraw diagrams are transparent',
  message: 'Built Excalidraw diagrams must be transparent',
  meta: { category: 'recommended', default: 'warn' },
  check() {
    const distRoot = join(repoRoot(), 'dist')
    const files = []
    const walk = (d) => {
      if (!existsSync(d)) return
      for (const n of readdirSync(d)) {
        const p = join(d, n)
        if (statSync(p).isDirectory()) walk(p)
        else if (n.endsWith('.excalidraw.svg')) files.push(p)
      }
    }
    walk(distRoot)
    if (!files.length) {
      return { skipped: 'no dist/ output — run `npm run build` to validate built diagrams' }
    }
    const offenders = []
    for (const file of files) {
      const svg = readFileSync(file, 'utf8')
      const rel = toRel(file)
      if (/<rect x="0" y="0" width="[0-9.]+" height="[0-9.]+" fill="#[0-9a-fA-F]{6}"><\/rect>/.test(svg)) {
        offenders.push({ file: rel, message: 'still has a baked background rect (plugin must strip it for the slide)' })
      }
    }
    return offenders
  },
}
