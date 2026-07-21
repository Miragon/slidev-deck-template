/**
 * The registry of source-level guardrails. Add a rule by creating its file here
 * and listing it below; the validator and the Playwright suite pick it up
 * automatically. Ordered from deck-structure rules to diagram-asset rules.
 */

import { sanctionedLayout } from './sanctioned-layout'
import { noRawHtml } from './no-raw-html'
import { noHtmlEntities } from './no-html-entities'
import { excalidrawCommittedLight } from './excalidraw-committed-light'
import { excalidrawBuiltTransparent } from './excalidraw-built-transparent'
import type { Rule } from './types'

export const sourceRules: Rule[] = [
  sanctionedLayout,
  noRawHtml,
  noHtmlEntities,
  excalidrawCommittedLight,
  excalidrawBuiltTransparent,
]

export type { Rule, Violation } from './types'
