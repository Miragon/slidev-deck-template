// Slidev loads this Vite config for dev, build and export. We export a plain
// config object (no `defineConfig` import) so the file needs no direct `vite`
// dependency — Slidev brings its own Vite and merges this in.
//
// Two things happen here:
//
// 1. `@paper-design/shaders` (used by the BrandMeshBackground) is otherwise
//    discovered and optimized lazily on first page load. During `slidev export`
//    that optimization happens mid-capture, triggering a page reload that leaves
//    the exported PDF blank (all-white). Pre-bundling it removes the race.
//
// 2. The chapter-resources plugin. Each chapter is a folder
//    deck/chapter/<chapter>/ that keeps its own assets in a resources/
//    subfolder. Slidev only serves a single public/ dir, so this plugin serves
//    every deck/chapter/<chapter>/resources/<...> file at the URL
//    /resources/<chapter>/<...> in dev, and copies them into the build output at
//    the same path. Layouts resolve asset paths through BASE_URL, so the
//    frontmatter just points at /resources/<chapter>/<file>.

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, join, relative, dirname, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// This config lives in deck/, which is Slidev's Vite root (it loads
// <entry-dir>/vite.config.ts). Chapters are deck/chapter/<chapter>/.
// @ts-ignore
const CHAPTER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'chapter')

const MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bpmn': 'application/xml',
  '.xml': 'application/xml',
  '.json': 'application/json',
}

// Every chapter resource as { url: "/resources/<chapter>/<rel>", file: <abspath> }.
function collectResources() {
  const out = []
  if (!existsSync(CHAPTER_DIR)) return out
  for (const chapter of readdirSync(CHAPTER_DIR)) {
    const resDir = join(CHAPTER_DIR, chapter, 'resources')
    if (!existsSync(resDir) || !statSync(resDir).isDirectory()) continue
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) walk(p)
        else out.push({ url: `/resources/${chapter}/${relative(resDir, p).split(sep).join('/')}`, file: p })
      }
    }
    walk(resDir)
  }
  return out
}

// Excalidraw exports occasionally carry a dark-mode `filter="invert(…)"` on the
// root <svg> (excalidraw.com state leaks through the export tool), and we bake a
// light full-canvas background into the COMMITTED file on purpose (so it previews
// light in editors like IntelliJ/Finder/GitHub). Neither must reach the deck:
// diagrams render light on the slide already, and their background must be
// TRANSPARENT so the diagram blends on the grey slide AND inside white <Card>s.
// Strip both here so every served/built .excalidraw.svg is normalised, whatever
// the export produced. Box fills stay untouched (they are not the full canvas).
// Arrowheads are left as excalidraw's own native `triangle` arrows: the diagrams
// are authored with real arrows and we keep them so, both on the slide and when
// the .excalidraw.svg is reopened for editing.
function normalizeExcalidrawSvg(svg) {
  let s = svg.replace(/(<svg\b[^>]*?)\s+filter="[^"]*"([^>]*>)/, '$1$2')
  const m = s.match(/<svg\b[^>]*\bwidth="(\d+)"[^>]*\bheight="(\d+)"/)
  if (m) {
    // Match any baked full-canvas background colour (#F9F7F7, #FFFFFF, …) — not
    // just white — so dropping it leaves the diagram transparent on the slide.
    const re = new RegExp(`<rect x="0" y="0" width="${m[1]}" height="${m[2]}"[^>]*fill="#[0-9a-fA-F]{6}"[^>]*>(\\s*</rect>)?`)
    s = s.replace(re, '')
  }
  return s
}

function readResource(file) {
  if (file.endsWith('.excalidraw.svg')) {
    return Buffer.from(normalizeExcalidrawSvg(readFileSync(file, 'utf8')), 'utf8')
  }
  return readFileSync(file)
}

function chapterResources() {
  let outDir
  return {
    name: 'miragon-chapter-resources',
    configResolved(config) {
      // build.outDir may be relative (e.g. "../dist" from `--out`); resolve it
      // against the Vite root (deck/) so the copy lands in the real output dir,
      // not relative to the process CWD.
      outDir = resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0])
        if (!url.startsWith('/resources/')) return next()
        const hit = collectResources().find((r) => r.url === url)
        if (!hit) return next()
        res.setHeader('Content-Type', MIME[extname(hit.file).toLowerCase()] || 'application/octet-stream')
        res.end(readResource(hit.file))
      })
    },
    writeBundle() {
      for (const { url, file } of collectResources()) {
        const dest = join(outDir, url.replace(/^\//, ''))
        mkdirSync(dirname(dest), { recursive: true })
        writeFileSync(dest, readResource(file))
      }
    },
  }
}

export default {
  plugins: [chapterResources()],
  optimizeDeps: {
    include: ['@paper-design/shaders'],
  },
}
