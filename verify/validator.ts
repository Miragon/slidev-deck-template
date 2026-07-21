/**
 * The validator: the small engine that runs source-level rules.
 *
 * It is deliberately framework-agnostic — it knows nothing about Playwright — so
 * the same rules can drive the test suite (verify/slides.spec.ts) or any other
 * runner. Rules live under verify/rules/; this file only runs them and formats
 * their results.
 */

import type { Rule, Violation } from './rules/types'

export interface RuleResult {
  rule: Rule
  violations: Violation[]
}

export function runRules(rules: Rule[]): RuleResult[] {
  return rules.map((rule) => ({ rule, violations: rule.check() }))
}

export function formatFailure(result: RuleResult): string {
  return `${result.rule.message}:\n${result.violations.join('\n')}`
}
