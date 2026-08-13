/**
 * The `recommended` preset: every rule at its documented default severity. This is
 * the base a deck should `extends`. It is derived from the registry so a new rule
 * joins the preset automatically — there is no second list to keep in sync.
 */

import { allRules } from '../rules/index.mjs'

const rules = {}
for (const r of allRules) rules[r.id] = r.meta.default

export default { name: '@miragon/slidev-validator/recommended', rules }
