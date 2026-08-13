/**
 * The single registry of guardrails. Every rule has a stable `id` (the public API,
 * used in config files), a `type` ('source' = static file check, no browser;
 * 'rendered' = interprets the per-slide DOM measurement), and `meta.category`
 * ('required' rules cannot be silently disabled) + `meta.default` severity.
 *
 * Add a rule: create its file, import it here, list it below. It becomes
 * configurable, documented, and part of both presets automatically.
 */

import { sanctionedLayout } from './source/sanctioned-layout.mjs'
import { noRawHtml } from './source/no-raw-html.mjs'
import { noHtmlEntities } from './source/no-html-entities.mjs'
import { contentHeading } from './source/content-heading.mjs'
import { noEmDash } from './source/no-em-dash.mjs'
import { noEmoji } from './source/no-emoji.mjs'
import { noNestedBullets } from './source/no-nested-bullets.mjs'
import { noInlineFont } from './source/no-inline-font.mjs'
import { noRestyledBullets } from './source/no-restyled-bullets.mjs'
import { excalidrawCommittedLight } from './source/excalidraw-committed-light.mjs'
import { excalidrawBuiltTransparent } from './source/excalidraw-built-transparent.mjs'

import { elementOverflow } from './rendered/element-overflow.mjs'
import { headingBlack } from './rendered/heading-black.mjs'
import { cardWhite } from './rendered/card-white.mjs'
import { overlaySafeArea } from './rendered/overlay-safe-area.mjs'

/** Every rule, source then rendered, in report order. */
export const allRules = [
  sanctionedLayout,
  noRawHtml,
  noHtmlEntities,
  contentHeading,
  noEmDash,
  noEmoji,
  noNestedBullets,
  noInlineFont,
  noRestyledBullets,
  excalidrawCommittedLight,
  excalidrawBuiltTransparent,
  elementOverflow,
  headingBlack,
  cardWhite,
  overlaySafeArea,
]

export const sourceRules = allRules.filter((r) => r.type === 'source')
export const renderedRules = allRules.filter((r) => r.type === 'rendered')

/** A rule looked up by its stable id, or undefined. */
export function ruleById(id) {
  return allRules.find((r) => r.id === id)
}

/** The set of all known rule ids (for config validation). */
export function knownRuleIds() {
  return new Set(allRules.map((r) => r.id))
}

/**
 * The rule catalog: every rule as a plain, report-ordered row for tooling, docs,
 * and the `slidev-validator rules` command. Lets deck authors discover the stable
 * ids they configure (off/warn/error, overrides, exceptions) without reading the
 * source. Stable shape: { id, type, category, default, title }.
 */
export function ruleCatalog() {
  return allRules.map((r) => ({
    id: r.id,
    type: r.type,
    category: r.meta.category,
    default: r.meta.default,
    title: r.title,
  }))
}
