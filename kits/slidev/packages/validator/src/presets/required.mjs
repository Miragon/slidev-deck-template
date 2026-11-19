/**
 * The `required` preset: only the non-negotiable brand invariants, all at `error`.
 * These are the rules whose `meta.category` is 'required' — the same set the engine
 * refuses to let a deck silently turn `off`/`warn` (see config.mjs). Derived from
 * the registry, so marking a new rule `required` adds it here automatically.
 */

import { allRules } from '../rules/index.mjs'

const rules = {}
for (const r of allRules) if (r.meta.category === 'required') rules[r.id] = 'error'

export default { name: '@miragon/slidev-validator/required', rules }
