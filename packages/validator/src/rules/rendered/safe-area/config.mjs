/**
 * Loads the central safe-area model from the toolkit (global/safe-areas.json).
 *
 * Resolution mirrors sanctioned-layout: prefer the INSTALLED
 * `@miragon/slidev-toolkit` (a scaffolded deck consumes the toolkit purely from
 * npm), and fall back to the in-repo source so the template monorepo verifies
 * itself. Reading the config from the TOOLKIT — never from the deck — is what stops
 * a presentation from quietly switching the global protection off: a deck can add
 * per-slide exceptions, but it cannot edit this file.
 */

import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { repoRoot } from '../../../helpers.mjs'

function configPath() {
  try {
    const from = pathToFileURL(join(repoRoot(), 'package.json'))
    const pkg = createRequire(from).resolve('@miragon/slidev-toolkit/package.json')
    return join(dirname(pkg), 'global', 'safe-areas.json')
  } catch {
    return join(repoRoot(), 'packages', 'toolkit', 'global', 'safe-areas.json')
  }
}

let cached = null

/** Returns { canvas, overlays } or null when the toolkit ships no config. */
export function loadSafeAreaConfig() {
  if (cached) return cached
  const path = configPath()
  if (!existsSync(path)) return null
  const raw = JSON.parse(readFileSync(path, 'utf8'))
  cached = { canvas: raw.canvas, overlays: raw.overlays }
  return cached
}
