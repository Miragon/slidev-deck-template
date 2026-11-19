import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const PACKAGE_DIR = fileURLToPath(new URL('../', import.meta.url))
export const REPO_ROOT = join(PACKAGE_DIR, '../../../..')
export const EXAMPLE_DIR = join(REPO_ROOT, 'kits/docs/example')
export const TEMPLATES_DIR = join(REPO_ROOT, 'kits/docs/templates')
export const BUILD_DIR = join(PACKAGE_DIR, 'test/.build')
export const VITEPRESS_BIN = join(REPO_ROOT, 'node_modules/vitepress/bin/vitepress.js')

export function newSite(name) {
  mkdirSync(BUILD_DIR, { recursive: true })
  const site = mkdtempSync(join(BUILD_DIR, `${name}-`))
  cpSync(EXAMPLE_DIR, site, {
    recursive: true,
    filter: (source) => !/[\\/](node_modules|dist|cache)$/.test(source),
  })
  return site
}

export function buildSite(site, docsBase) {
  return spawnSync(process.execPath, [VITEPRESS_BIN, 'build'], {
    cwd: site,
    encoding: 'utf8',
    env: { ...process.env, DOCS_BASE: docsBase },
  })
}

export async function loadConfig(site, source, env = {}) {
  writeFileSync(join(site, '.vitepress/config.ts'), source)
  const before = { ...process.env }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  try {
    const { resolveUserConfig } = await import('vitepress')
    const [config] = await resolveUserConfig(site, 'build', 'production')
    return config
  } finally {
    for (const key of Object.keys(env)) {
      if (before[key] === undefined) delete process.env[key]
      else process.env[key] = before[key]
    }
  }
}

export const miragonDocsCall = (options) =>
  `import { miragonDocs } from "@miragon/docs-starter"\nexport default miragonDocs(${JSON.stringify(options)})\n`

export function cssBlocks(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const blocks = []
  let media = null
  let i = 0
  while (i < text.length) {
    const open = text.indexOf('{', i)
    const close = text.indexOf('}', i)
    if (close !== -1 && (open === -1 || close < open)) {
      media = null
      i = close + 1
      continue
    }
    if (open === -1) break
    const head = text.slice(i, open).trim()
    if (head.startsWith('@media')) {
      media = head.slice('@media'.length).trim()
      i = open + 1
      continue
    }
    const end = text.indexOf('}', open)
    const declarations = text
      .slice(open + 1, end)
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const colon = part.indexOf(':')
        return [part.slice(0, colon).trim(), part.slice(colon + 1).trim()]
      })
    blocks.push({ media, selectors: head.split(',').map((s) => s.trim()), declarations })
    i = end + 1
  }
  return blocks
}

function relativeLuminance(hex) {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
  const linear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function contrast(first, second) {
  const [high, low] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a)
  return (high + 0.05) / (low + 0.05)
}
