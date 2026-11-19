/**
 * Version + compatibility resolution.
 *
 * The validator declares a peerDependency range on `@miragon/slidev-toolkit`
 * (package.json). The rules encode brand invariants that must match the theme, and
 * `sanctioned-layout` reads the theme's installed layouts — so a validator run must
 * know which toolkit it is validating against and warn when the pair is out of
 * range. A tiny semver satisfies() covers the simple ranges we ship (">=1.15.0 <2").
 */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { repoRoot } from './helpers.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

/** This validator's own version + declared toolkit peer range. */
export function selfInfo() {
  const pkg = JSON.parse(readFileSync(join(HERE, '..', 'package.json'), 'utf8'))
  return { version: pkg.version, toolkitRange: pkg.peerDependencies?.['@miragon/slidev-toolkit'] ?? '*' }
}

/** The installed toolkit version resolved from the deck root, or null. */
export function resolvedToolkitVersion() {
  try {
    const from = pathToFileURL(join(repoRoot(), 'package.json'))
    const p = createRequire(from).resolve('@miragon/slidev-toolkit/package.json')
    return JSON.parse(readFileSync(p, 'utf8')).version
  } catch {
    // In the monorepo the workspace symlink may not be resolvable from a bare cwd;
    // fall back to the in-repo source.
    try {
      return JSON.parse(readFileSync(join(repoRoot(), 'packages', 'toolkit', 'package.json'), 'utf8')).version
    } catch {
      return null
    }
  }
}

function parseVer(v) {
  // Accept partial versions in ranges ("2" → 2.0.0, "1.15" → 1.15.0).
  const m = String(v).match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
  return m ? [Number(m[1]), Number(m[2] || 0), Number(m[3] || 0)] : null
}

function cmp(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1
  return 0
}

/** Minimal semver satisfies for space-separated comparator ranges (>=, >, <=, <, =). */
export function satisfies(version, range) {
  if (!range || range === '*') return true
  const v = parseVer(version)
  if (!v) return false
  return range
    .trim()
    .split(/\s+/)
    .every((token) => {
      const m = token.match(/^(>=|<=|>|<|=)?\s*v?(\d+(?:\.\d+){0,2})/)
      if (!m) return true
      const op = m[1] || '='
      const t = parseVer(m[2])
      const c = cmp(v, t)
      if (op === '>=') return c >= 0
      if (op === '<=') return c <= 0
      if (op === '>') return c > 0
      if (op === '<') return c < 0
      return c === 0
    })
}

/** { ok, installed, range } describing toolkit ↔ validator compatibility. */
export function compat() {
  const { toolkitRange } = selfInfo()
  const installed = resolvedToolkitVersion()
  return { ok: installed ? satisfies(installed, toolkitRange) : false, installed, range: toolkitRange }
}
