/**
 * Programmatic entry point for the Miragon Slidev validator.
 *
 * `validate()` resolves the deck's config, runs the source rules and (optionally)
 * the rendered rules, classifies every violation by severity/override/exception,
 * and returns { results, summary, meta } ready for report.mjs. The CLI
 * (bin/index.mjs) is a thin wrapper over this.
 */

import { loadConfig } from './config.mjs'
import { runSourceRules, runRenderedRules, summarize } from './engine.mjs'
import { sourceRules, renderedRules, allRules } from './rules/index.mjs'
import { measureDeck } from './rendered-runner.mjs'
import { selfInfo, resolvedToolkitVersion, compat } from './versions.mjs'

export { loadConfig, ConfigError } from './config.mjs'
export { allRules, sourceRules, renderedRules, ruleById, knownRuleIds } from './rules/index.mjs'
export { formatText, toJson } from './report.mjs'
export { selfInfo, resolvedToolkitVersion, compat } from './versions.mjs'

/**
 * Run the validator against the deck in the current working directory.
 * opts: { rendered?: boolean, pages?: string, port?: number, configPath?: string, log?: fn }
 */
export async function validate(opts = {}) {
  const config = await loadConfig(opts.configPath)

  const sourceResults = runSourceRules(sourceRules, config)

  let renderedResults
  let deckTitle
  if (opts.rendered) {
    const { measured, title } = await measureDeck({
      port: opts.port ?? Number(process.env.VERIFY_PORT ?? 3030),
      pages: opts.pages ?? process.env.VERIFY_PAGES,
      log: opts.log,
    })
    deckTitle = title
    renderedResults = runRenderedRules(renderedRules, config, measured)
  } else {
    renderedResults = runRenderedRules(renderedRules, config, null)
  }

  // Order results by the registry (source first, then rendered) for a stable report.
  const byId = new Map([...sourceResults, ...renderedResults].map((r) => [r.rule.id, r]))
  const results = allRules.map((r) => byId.get(r.id)).filter(Boolean)

  const summary = summarize(results)
  const meta = {
    validatorVersion: selfInfo().version,
    toolkitVersion: resolvedToolkitVersion(),
    configPath: config.configPath,
    presetNames: config.presetNames,
    rendered: !!opts.rendered,
    deckTitle,
    compat: compat(),
  }
  return { results, summary, meta, config }
}
