/** One violation, formatted for a human: typically `path:line  token  →  context`. */
export type Violation = string

/**
 * The contract every source-level guardrail implements.
 *
 * A rule is a pure, framework-agnostic check: it reads the deck's source files
 * and returns a list of human-readable violations ([] means it passes). Rules
 * live one-per-file under verify/rules/; the validator (verify/validator.ts) runs
 * them and the Playwright suite (verify/slides.spec.ts) turns each into a test.
 */
export interface Rule {
  id: string
  title: string
  message: string
  check(): Violation[]
}
