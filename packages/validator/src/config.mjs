/**
 * The configuration model — ESLint/tsconfig-shaped.
 *
 *   export default {
 *     extends: ['@miragon/slidev-validator/recommended'],
 *     rules:   { 'no-em-dash': 'error', 'slide-number-overlap': 'off' },
 *     overrides: [{ files: ['deck/chapter/99-legacy/**'], rules: { 'element-overflow': 'off' } }],
 *     exceptions: [{ rule: 'card-white', files: ['deck/chapter/07-*\/**'], reason: '…', ticket: 'ABC-1', expires: '2026-12-31' }],
 *   }
 *
 * Severities: 'off' | 'warn' | 'error'. Rules marked `required` in the registry
 * cannot be set below 'error' here — the only sanctioned way to suppress them is an
 * `exceptions` entry (with a reason), which is always surfaced in the report and CI.
 * Invalid rule ids, severities, globs, and expired/ malformed exceptions fail loudly
 * with a ConfigError.
 */

import { existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { knownRuleIds, ruleById } from './rules/index.mjs'
import { globToRegExp, matchesAny } from './glob.mjs'
import { repoRoot } from './helpers.mjs'

export class ConfigError extends Error {}

const SEVERITIES = new Set(['off', 'warn', 'error'])
const CONFIG_NAMES = ['slidev-validator.config.mjs', 'slidev-validator.config.js']

/** Locate the deck's config file (explicit path wins), or null if none exists. */
export function findConfigFile(explicit) {
  if (explicit) {
    const p = resolve(explicit)
    if (!existsSync(p)) throw new ConfigError(`Config file not found: ${explicit}`)
    return p
  }
  for (const name of CONFIG_NAMES) {
    const p = join(repoRoot(), name)
    if (existsSync(p)) return p
  }
  return null
}

/** A preset/extends module resolved to its `{ rules }` map. */
async function importExtends(spec, configDir) {
  if (spec === '@miragon/slidev-validator/recommended') return (await import('./presets/recommended.mjs')).default
  if (spec === '@miragon/slidev-validator/required') return (await import('./presets/required.mjs')).default
  const url = spec.startsWith('.') ? pathToFileURL(resolve(configDir, spec)).href : spec
  let mod
  try {
    mod = await import(url)
  } catch (err) {
    throw new ConfigError(`Could not resolve extends "${spec}": ${err.message}`)
  }
  const preset = mod.default ?? mod
  if (!preset || typeof preset.rules !== 'object') {
    throw new ConfigError(`extends "${spec}" does not export a { rules } object`)
  }
  return preset
}

function assertSeverity(sev, where) {
  if (!SEVERITIES.has(sev)) {
    throw new ConfigError(`Invalid severity ${JSON.stringify(sev)} for ${where}. Use 'off', 'warn', or 'error'.`)
  }
}

function assertKnownRule(id, where) {
  if (!knownRuleIds().has(id)) {
    throw new ConfigError(`Unknown rule id "${id}" in ${where}. It is not a known validator rule.`)
  }
}

function assertGlobs(globs, where) {
  if (!Array.isArray(globs) || !globs.length) throw new ConfigError(`${where} needs a non-empty "files" array of globs.`)
  for (const g of globs) {
    if (typeof g !== 'string') throw new ConfigError(`${where} has a non-string glob: ${JSON.stringify(g)}`)
    try {
      globToRegExp(g)
    } catch (err) {
      throw new ConfigError(`${where} has an invalid glob "${g}": ${err.message}`)
    }
  }
}

/**
 * Load and fully validate the deck's config. Returns a resolved object plus a
 * `severityFor(ruleId, relFile)` resolver and the list of exceptions. Applies the
 * default (extends recommended) when the deck ships no config file.
 */
export async function loadConfig(explicitPath) {
  const configPath = findConfigFile(explicitPath)
  let raw
  if (configPath) {
    const mod = await import(pathToFileURL(configPath).href)
    raw = mod.default ?? mod
    if (typeof raw !== 'object' || raw === null) throw new ConfigError(`${configPath} must default-export a config object.`)
  } else {
    raw = { extends: ['@miragon/slidev-validator/recommended'] }
  }

  const configDir = configPath ? dirname(configPath) : repoRoot()
  const extendsList = raw.extends ?? []
  if (!Array.isArray(extendsList)) throw new ConfigError('"extends" must be an array of preset specifiers.')

  // 1. Base severities from extends (in order), then the top-level rules block.
  const base = {}
  const presetNames = []
  for (const spec of extendsList) {
    const preset = await importExtends(spec, configDir)
    presetNames.push(preset.name ?? spec)
    for (const [id, sev] of Object.entries(preset.rules)) base[id] = sev
  }
  const userRules = raw.rules ?? {}
  if (typeof userRules !== 'object') throw new ConfigError('"rules" must be an object of ruleId → severity.')
  for (const [id, sev] of Object.entries(userRules)) {
    assertKnownRule(id, '"rules"')
    assertSeverity(sev, `rule "${id}"`)
    base[id] = sev
  }

  // 2. Overrides — validated, kept in order (later match wins).
  const overrides = []
  const rawOverrides = raw.overrides ?? []
  if (!Array.isArray(rawOverrides)) throw new ConfigError('"overrides" must be an array.')
  rawOverrides.forEach((ov, i) => {
    assertGlobs(ov.files, `overrides[${i}]`)
    const rules = ov.rules ?? {}
    for (const [id, sev] of Object.entries(rules)) {
      assertKnownRule(id, `overrides[${i}].rules`)
      assertSeverity(sev, `overrides[${i}].rules["${id}"]`)
    }
    overrides.push({ globs: ov.files, rules })
  })

  // 3. Exceptions — validated; each carries a reason and is reported.
  const exceptions = []
  const rawExceptions = raw.exceptions ?? []
  if (!Array.isArray(rawExceptions)) throw new ConfigError('"exceptions" must be an array.')
  rawExceptions.forEach((ex, i) => {
    assertKnownRule(ex.rule, `exceptions[${i}].rule`)
    if (!ex.reason || typeof ex.reason !== 'string') throw new ConfigError(`exceptions[${i}] for "${ex.rule}" needs a non-empty "reason".`)
    if (ex.files !== undefined) assertGlobs(ex.files, `exceptions[${i}]`)
    let expired = false
    if (ex.expires !== undefined) {
      const t = Date.parse(ex.expires)
      if (Number.isNaN(t)) throw new ConfigError(`exceptions[${i}].expires "${ex.expires}" is not a valid date (use YYYY-MM-DD).`)
      expired = t < Date.now()
    }
    exceptions.push({ rule: ex.rule, globs: ex.files ?? null, reason: ex.reason, ticket: ex.ticket, expires: ex.expires, expired })
  })

  // 4. Required-rule guard: a required rule may not be dropped below 'error' via
  //    rules/overrides. The sanctioned escape is an exceptions entry (reported).
  const requiredIds = [...knownRuleIds()].filter((id) => ruleById(id).meta.category === 'required')
  for (const id of requiredIds) {
    if (base[id] !== undefined && base[id] !== 'error') {
      throw new ConfigError(`Rule "${id}" is REQUIRED and cannot be set to "${base[id]}". To suppress it deliberately, add an { rule: "${id}", reason: … } entry to "exceptions" (which is reported in CI) instead of lowering its severity.`)
    }
    for (const ov of overrides) {
      if (ov.rules[id] !== undefined && ov.rules[id] !== 'error') {
        throw new ConfigError(`Rule "${id}" is REQUIRED and cannot be lowered to "${ov.rules[id]}" in an override. Use an "exceptions" entry (reported in CI) instead.`)
      }
    }
  }

  /** Effective severity of a rule for a given repo-relative file. */
  function severityFor(ruleId, relFile) {
    let sev = base[ruleId] ?? 'off'
    if (relFile) {
      for (const ov of overrides) {
        if (ov.rules[ruleId] !== undefined && matchesAny(relFile, ov.globs)) sev = ov.rules[ruleId]
      }
    }
    return sev
  }

  /** The matching exception for a (rule, file), or null. A fileless exception is global. */
  function exceptionFor(ruleId, relFile) {
    return (
      exceptions.find((ex) => ex.rule === ruleId && (ex.globs === null || (relFile && matchesAny(relFile, ex.globs)))) ?? null
    )
  }

  return { configPath, presetNames, base, overrides, exceptions, severityFor, exceptionFor, raw }
}
