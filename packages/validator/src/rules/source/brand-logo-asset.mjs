import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { repoRoot } from '../../helpers.mjs'

/**
 * The bundled logo vectors must stay the untouched official artwork.
 *
 * brand-review rule B5: a logo that is recoloured, reshaped, or redrawn is a hard
 * fail — and the failure mode is quiet. A single wrong digit (#00e476 instead of
 * #00e676) renders as "green" on every slide and survives review, because nobody
 * eyeballs a wordmark against a swatch. So the two properties that a hand edit
 * actually breaks are asserted mechanically:
 *
 *   1. the viewBox (proportions: a squashed or cropped mark changes it), and
 *   2. the single fill each variant carries (its colour).
 *
 * The expected values live in `brand-palette.json` next to this file — the same
 * file the `brand-palette` rule reads — so the validator keeps one machine-readable
 * brand source, not two.
 *
 * Not asserted: the path data. Comparing a full byte hash would fail on a
 * lossless re-export (formatting, id renaming) while catching nothing a human
 * would call a brand violation.
 */

const BRAND = JSON.parse(readFileSync(fileURLToPath(new URL('./brand-palette.json', import.meta.url)), 'utf8'))

/** Every fill declared in an SVG, as an attribute (`fill="#…"`) or in a <style> rule (`fill:#…`). */
const FILL = /\bfill\s*[:=]\s*["']?(#[0-9a-fA-F]{3,8})/g

/** 1-based line number of a character offset. */
const lineOf = (src, index) => src.slice(0, index).split('\n').length

/** `#fff` -> `#ffffff`, lowercased, so the short and long forms compare equal. */
export function normalizeFill(hex) {
  let h = String(hex).replace(/^#/, '').toLowerCase()
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  return `#${h}`
}

/**
 * Pure core (fixture-free, testable): what is wrong with one logo SVG, given its
 * manifest entry. Returns an array of `{ line, message }`, empty when the asset is
 * the official vector.
 */
export function checkLogoSvg(svg, asset) {
  const problems = []

  const vb = svg.match(/\bviewBox\s*=\s*["']([^"']*)["']/)
  if (!vb) {
    problems.push({ line: 1, message: 'has no viewBox (the official vector declares one)' })
  } else {
    const actual = vb[1].trim().replace(/\s+/g, ' ')
    const expected = asset.viewBox.trim().replace(/\s+/g, ' ')
    if (actual !== expected) {
      problems.push({ line: lineOf(svg, vb.index), message: `viewBox "${actual}" is not the official "${expected}". The mark has been rescaled, cropped, or redrawn.` })
    }
  }

  const fills = []
  FILL.lastIndex = 0
  let m
  while ((m = FILL.exec(svg))) fills.push({ raw: m[1], hex: normalizeFill(m[1]), index: m.index })
  const expectedFill = normalizeFill(asset.fill)
  if (!fills.length) {
    problems.push({ line: 1, message: `declares no fill (expected exactly one, ${asset.fill} for the "${asset.variant}" variant)` })
  } else {
    const distinct = [...new Set(fills.map((f) => f.hex))]
    if (distinct.length > 1) {
      problems.push({ line: lineOf(svg, fills[0].index), message: `declares ${distinct.length} fills (${distinct.join(', ')}); the official vector is single-colour (${asset.fill})` })
    }
    for (const f of fills) {
      if (f.hex !== expectedFill) {
        problems.push({ line: lineOf(svg, f.index), message: `fill ${f.raw} is not the official "${asset.variant}" colour ${asset.fill}. Check every digit.` })
      }
    }
  }
  return problems
}

export const brandLogoAsset = {
  id: 'brand-logo-asset',
  type: 'source',
  title: 'brand logo assets are the official vectors',
  message: 'Bundled logo SVGs must be the unaltered official vectors',
  meta: { category: 'required', default: 'error' },
  check() {
    const present = BRAND.logo.assets.filter((a) => existsSync(join(repoRoot(), a.file)))
    if (!present.length) {
      // A scaffolded deck consumes the toolkit from node_modules and vendors no
      // assets. Nothing to check is NOT a pass, so report it as such.
      return { skipped: 'no bundled logo assets in this repo (the toolkit ships them from node_modules)' }
    }
    const offenders = []
    for (const asset of BRAND.logo.assets) {
      const file = join(repoRoot(), asset.file)
      if (!existsSync(file)) {
        offenders.push({ file: asset.file, message: 'missing: the toolkit must ship this official logo variant' })
        continue
      }
      const svg = readFileSync(file, 'utf8')
      for (const p of checkLogoSvg(svg, asset)) offenders.push({ file: asset.file, line: p.line, message: p.message })
    }
    return offenders
  },
}
