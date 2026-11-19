/**
 * Turn classified results into a human report (default) or JSON (`--format json`).
 *
 * The report deliberately separates three states the plan calls out: rules that
 * RAN (pass/warn/error), rules DELIBERATELY DISABLED (off or a live exception, with
 * where + why), and rules NOT RUN (skipped / not applicable). The header always
 * records the validator version, the resolved toolkit version, and the config, so a
 * report is self-describing and a CI log shows exactly what was enforced.
 */

const GLYPH = { pass: '✓', warn: '!', error: '✗', off: '·', skipped: '–' }

function loc(v) {
  const where = v.file ? (v.line ? `${v.file}:${v.line}` : v.file) : ''
  const slide = v.slide ? `slide ${v.slide}` : ''
  const head = [where, slide].filter(Boolean).join(' ')
  return head ? `${head}  ${v.message}` : v.message
}

/** The plain-text report. Returns the string; the CLI prints it. */
export function formatText({ results, summary, meta }) {
  const out = []
  out.push('Miragon Slidev validator')
  if (meta.deckTitle) out.push(`  deck "${meta.deckTitle}"`)
  out.push(`  validator ${meta.validatorVersion}   toolkit ${meta.toolkitVersion ?? 'unresolved'}   mode ${meta.rendered ? 'source + rendered' : 'source'}`)
  out.push(`  config ${meta.configPath ?? '(defaults: extends recommended)'}`)
  if (meta.presetNames?.length) out.push(`  extends ${meta.presetNames.join(', ')}`)
  if (meta.compat && !meta.compat.ok) out.push(`  ! toolkit ${meta.compat.installed} is outside the supported range ${meta.compat.range}`)
  out.push('')

  for (const r of results) {
    const g = GLYPH[r.status] ?? '?'
    const tag = r.rule.meta.category === 'required' ? ' [required]' : ''
    out.push(`${g} ${r.rule.id}${tag} — ${r.rule.title}`)
    for (const v of r.errors) out.push(`    error  ${loc(v)}`)
    for (const { v, ex } of r.expired) out.push(`    error  ${loc(v)}  (exception expired ${ex.expires})`)
    for (const v of r.warns) out.push(`    warn   ${loc(v)}`)
  }

  // Deliberately disabled + exceptions — always surfaced.
  const disabled = results.filter((r) => r.status === 'off')
  if (disabled.length) {
    out.push('')
    out.push('Disabled rules (off — will not fail the build):')
    for (const r of disabled) out.push(`  · ${r.rule.id}`)
  }
  const suppressed = results.flatMap((r) => r.suppressed.map((s) => ({ rule: r.rule, ...s })))
  if (suppressed.length) {
    out.push('')
    out.push('Suppressed violations (exceptions / scoped off — reported, not failing):')
    for (const s of suppressed) {
      const why = s.ex ? `${s.ex.reason}${s.ex.ticket ? ` [${s.ex.ticket}]` : ''}${s.ex.expires ? ` (expires ${s.ex.expires})` : ''}` : 'scoped off'
      out.push(`  · ${s.rule.id}: ${loc(s.v)}  — ${why}`)
    }
  }
  const skipped = results.filter((r) => r.status === 'skipped')
  if (skipped.length) {
    out.push('')
    out.push('Not run (not applicable):')
    for (const r of skipped) out.push(`  – ${r.rule.id}: ${r.reason}`)
  }

  out.push('')
  const verdict = summary.failed ? 'FAILED' : 'passed'
  out.push(`${verdict}: ${summary.errorCount} error(s), ${summary.warnCount} warning(s), ${summary.suppressedCount} suppressed, ${summary.expiredCount} expired exception(s).`)
  return out.join('\n')
}

/** The machine-readable report for CI. */
export function toJson({ results, summary, meta }) {
  return {
    meta,
    summary,
    rules: results.map((r) => ({
      id: r.rule.id,
      title: r.rule.title,
      type: r.rule.type,
      category: r.rule.meta.category,
      status: r.status,
      reason: r.reason,
      errors: r.errors.map(loc),
      warns: r.warns.map(loc),
      expired: r.expired.map(({ v, ex }) => ({ where: loc(v), expires: ex.expires })),
      suppressed: r.suppressed.map(({ v, ex }) => ({ where: loc(v), reason: ex?.reason ?? 'scoped off', ticket: ex?.ticket, expires: ex?.expires })),
    })),
  }
}
