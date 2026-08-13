/**
 * Loads the central safe-area model from the toolkit.
 *
 * Resolution mirrors rules/sanctioned-layout.ts: prefer the INSTALLED
 * `@miragon/slidev-toolkit` (a scaffolded deck consumes the toolkit purely from
 * npm and has no packages/toolkit/ source tree), and fall back to the in-repo
 * source so the template monorepo verifies itself. Reading the config from the
 * toolkit — never from the deck — is what stops a presentation from quietly
 * switching the global protection off: a deck can add per-slide exceptions, but
 * it cannot edit this file.
 */

import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { repoRoot } from './helpers'
import type { OverlayDescriptor } from './safe-area'

export interface SafeAreaConfig {
  canvas: { width: number; height: number }
  overlays: OverlayDescriptor[]
}

function configPath(): string {
  try {
    const pkg = createRequire(import.meta.url).resolve('@miragon/slidev-toolkit/package.json')
    return join(dirname(pkg), 'global', 'safe-areas.json')
  } catch {
    return join(repoRoot, 'packages', 'toolkit', 'global', 'safe-areas.json')
  }
}

let cached: SafeAreaConfig | null = null

export function loadSafeAreaConfig(): SafeAreaConfig {
  if (cached) return cached
  const path = configPath()
  if (!existsSync(path)) {
    throw new Error(`Safe-area config not found at ${path}. The toolkit must ship global/safe-areas.json.`)
  }
  const raw = JSON.parse(readFileSync(path, 'utf8'))
  // Drop the $comment scaffolding; keep only the typed fields.
  cached = { canvas: raw.canvas, overlays: raw.overlays as OverlayDescriptor[] }
  return cached
}
