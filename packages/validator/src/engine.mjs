/**
 * The engine: run rules and classify every violation against the resolved config.
 *
 * It is deliberately framework-agnostic. Source rules produce their violations by
 * reading files; rendered rules interpret a per-slide DOM measurement supplied by
 * the runner. Both feed the SAME classifier, so severity, overrides, and exceptions
 * behave identically for either kind. A rule outcome is either an array of
 * violations ([] = pass) or `{ skipped: reason }` (not applicable — reported apart
 * from "ran and passed").
 */

/** Is a rule active anywhere (base severity or any override lifts it above 'off')? */
export function isActive(config, ruleId) {
  const base = config.base[ruleId] ?? 'off'
  if (base !== 'off') return true
  return config.overrides.some((ov) => ov.rules[ruleId] && ov.rules[ruleId] !== 'off')
}

/**
 * Classify one rule's outcome into { status, errors, warns, suppressed, expired }.
 *   status: 'pass' | 'warn' | 'error' | 'off' | 'skipped'
 *   suppressed: violations silenced by an `off` severity or a live exception
 *   expired:    violations whose covering exception has lapsed (these fail)
 */
export function classify(config, rule, outcome) {
  if (outcome && outcome.skipped) return { rule, status: 'skipped', reason: outcome.skipped, errors: [], warns: [], suppressed: [], expired: [] }
  const violations = Array.isArray(outcome) ? outcome : []
  const active = isActive(config, rule.id)

  const errors = []
  const warns = []
  const suppressed = []
  const expired = []
  for (const v of violations) {
    const ex = config.exceptionFor(rule.id, v.file)
    if (ex) {
      if (ex.expired) expired.push({ v, ex })
      else suppressed.push({ v, ex })
      continue
    }
    const sev = config.severityFor(rule.id, v.file)
    if (sev === 'off') suppressed.push({ v, ex: null })
    else if (sev === 'warn') warns.push(v)
    else errors.push(v)
  }

  let status = 'pass'
  if (errors.length || expired.length) status = 'error'
  else if (warns.length) status = 'warn'
  else if (!active && !suppressed.length) status = 'off'
  return { rule, status, errors, warns, suppressed, expired }
}

/** Run the source rules that are active (or referenced by an exception) and classify them. */
export function runSourceRules(rules, config) {
  return rules.map((rule) => {
    const referenced = config.exceptions.some((e) => e.rule === rule.id)
    if (!isActive(config, rule.id) && !referenced) {
      return { rule, status: 'off', errors: [], warns: [], suppressed: [], expired: [] }
    }
    let outcome
    try {
      outcome = rule.check()
    } catch (err) {
      outcome = [{ file: undefined, message: `rule threw: ${err.message}` }]
    }
    return classify(config, rule, outcome)
  })
}

/**
 * Classify rendered rules from measured slides. `measured` is
 * [{ slide, file, metrics }]. A null `measured` means rendered checks did not run
 * (no --rendered): every rendered rule is reported as skipped/not-applicable.
 */
export function runRenderedRules(rules, config, measured) {
  return rules.map((rule) => {
    if (measured === null) return { rule, status: 'skipped', reason: 'rendered checks not run (pass --rendered)', errors: [], warns: [], suppressed: [], expired: [] }
    const referenced = config.exceptions.some((e) => e.rule === rule.id)
    if (!isActive(config, rule.id) && !referenced) {
      return { rule, status: 'off', errors: [], warns: [], suppressed: [], expired: [] }
    }
    // A rendered rule consumes either the generic DOM metrics (default) or the
    // dedicated safe-area measurement.
    const pick = rule.consumes === 'safeArea' ? (m) => m.safeArea : (m) => m.metrics
    const violations = []
    for (const m of measured) {
      const data = pick(m)
      if (!data) continue
      for (const v of rule.evaluate(data, { slide: m.slide, file: m.file })) violations.push(v)
    }
    return classify(config, rule, violations)
  })
}

/** Roll results up into totals + a pass/fail verdict. */
export function summarize(results) {
  let errorCount = 0
  let warnCount = 0
  let suppressedCount = 0
  let expiredCount = 0
  for (const r of results) {
    errorCount += r.errors.length
    warnCount += r.warns.length
    suppressedCount += r.suppressed.length
    expiredCount += r.expired.length
  }
  return {
    errorCount,
    warnCount,
    suppressedCount,
    expiredCount,
    failed: results.some((r) => r.status === 'error'),
  }
}
