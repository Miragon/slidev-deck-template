// Unit + light-integration tests for @miragon/slidev-validator. Node built-ins
// only (node:test), no browser — the rendered pipeline is proven by feeding
// synthetic per-slide metrics through the real rendered rules, and the source
// rules run end-to-end against the repo's own deck.
//
// Coverage maps to the plan's required scenarios: new project (defaults), invalid
// rule id, invalid severity, disabled rule, override for a slide dir, exception
// (deliberate waiver), expired exception, required rule cannot be silently
// disabled, a new warn rule, a new required/error rule, and toolkit compat.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadConfig, ConfigError } from '../src/config.mjs'
import { classify, runRenderedRules, summarize, isActive } from '../src/engine.mjs'
import { renderedRules, ruleById, knownRuleIds } from '../src/rules/index.mjs'
import recommended from '../src/presets/recommended.mjs'
import required from '../src/presets/required.mjs'
import { satisfies } from '../src/versions.mjs'
import { globToRegExp, matchesAny } from '../src/glob.mjs'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

/** Write a temp config file and load it (explicit path — no deck needed). */
async function withConfig(body) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-cfg-'))
  const p = join(dir, 'slidev-validator.config.mjs')
  writeFileSync(p, body)
  try {
    return await loadConfig(p)
  } finally {
    // keep the file for import() caching safety; clean the dir at process exit
    process.on('exit', () => rmSync(dir, { recursive: true, force: true }))
  }
}

// --- Presets ---------------------------------------------------------------

test('recommended preset lists every rule', () => {
  assert.equal(Object.keys(recommended.rules).length, knownRuleIds().size)
})

test('required preset is the required subset, all at error', () => {
  for (const [id, sev] of Object.entries(required.rules)) {
    assert.equal(sev, 'error')
    assert.equal(ruleById(id).meta.category, 'required')
  }
  assert.ok(Object.keys(required.rules).length > 0)
})

// --- Glob + semver ---------------------------------------------------------

test('glob matches directory trees and single segments', () => {
  assert.ok(matchesAny('deck/chapter/99-legacy/x.md', ['deck/chapter/99-legacy/**']))
  assert.ok(matchesAny('deck/chapter/07-x/a/b.md', ['deck/chapter/07-*/**']))
  assert.ok(!matchesAny('deck/chapter/01-intro/a.md', ['deck/chapter/99-legacy/**']))
  assert.ok(matchesAny('deck/chapter/99-legacy/a.md', ['deck/chapter/99-legacy/']))
  assert.throws(() => globToRegExp(''), /Invalid file glob/)
})

test('semver satisfies handles the shipped peer range', () => {
  assert.ok(satisfies('1.15.1', '>=1.15.0 <2'))
  assert.ok(!satisfies('2.0.0', '>=1.15.0 <2'))
  assert.ok(!satisfies('1.14.9', '>=1.15.0 <2'))
})

// --- Config validation -----------------------------------------------------

test('unknown rule id is a ConfigError', async () => {
  await assert.rejects(
    withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'], rules: { 'nope': 'error' } }`),
    (e) => e instanceof ConfigError && /Unknown rule id/.test(e.message),
  )
})

test('invalid severity is a ConfigError', async () => {
  await assert.rejects(
    withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'], rules: { 'no-nested-bullets': 'loud' } }`),
    (e) => e instanceof ConfigError && /Invalid severity/.test(e.message),
  )
})

test('a required rule cannot be lowered below error', async () => {
  await assert.rejects(
    withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'], rules: { 'no-em-dash': 'off' } }`),
    (e) => e instanceof ConfigError && /REQUIRED/.test(e.message),
  )
})

test('a required rule cannot be lowered in an override either', async () => {
  await assert.rejects(
    withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'], overrides: [{ files: ['deck/**'], rules: { 'card-white': 'warn' } }] }`),
    (e) => e instanceof ConfigError && /REQUIRED/.test(e.message),
  )
})

test('a required rule MAY be suppressed via an exception', async () => {
  const cfg = await withConfig(
    `export default { extends: ['@miragon/slidev-validator/recommended'], exceptions: [{ rule: 'no-em-dash', reason: 'waiver', ticket: 'X-1', expires: '2999-01-01' }] }`,
  )
  assert.equal(cfg.exceptions.length, 1)
  assert.equal(cfg.severityFor('no-em-dash'), 'error') // severity unchanged; the exception suppresses matching violations
})

test('an exception missing a reason is a ConfigError', async () => {
  await assert.rejects(
    withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'], exceptions: [{ rule: 'no-em-dash' }] }`),
    (e) => e instanceof ConfigError && /reason/.test(e.message),
  )
})

// --- Severity resolution + classification ----------------------------------

const fakeRule = (id) => ruleById(id) ?? { id, type: 'source', title: id, meta: { category: 'recommended', default: 'error' } }

test('override turns a rule off for a matching slide dir only', async () => {
  const cfg = await withConfig(
    `export default { extends: ['@miragon/slidev-validator/recommended'], overrides: [{ files: ['deck/chapter/99-legacy/**'], rules: { 'element-overflow': 'off' } }] }`,
  )
  assert.equal(cfg.severityFor('element-overflow', 'deck/chapter/99-legacy/x.md'), 'off')
  assert.equal(cfg.severityFor('element-overflow', 'deck/chapter/01-intro/x.md'), 'error')

  // a violation in the legacy dir is suppressed; one elsewhere is an error
  const r = classify(cfg, fakeRule('element-overflow'), [
    { file: 'deck/chapter/99-legacy/x.md', message: 'overflow' },
    { file: 'deck/chapter/01-intro/x.md', message: 'overflow' },
  ])
  assert.equal(r.status, 'error')
  assert.equal(r.errors.length, 1)
  assert.equal(r.suppressed.length, 1)
})

test('a live exception suppresses; an expired one fails', async () => {
  const live = await withConfig(
    `export default { extends: ['@miragon/slidev-validator/recommended'], exceptions: [{ rule: 'element-overflow', files: ['deck/**'], reason: 'ok', expires: '2999-01-01' }] }`,
  )
  const rLive = classify(live, fakeRule('element-overflow'), [{ file: 'deck/a.md', message: 'overflow' }])
  assert.equal(rLive.status, 'pass')
  assert.equal(rLive.suppressed.length, 1)

  const expired = await withConfig(
    `export default { extends: ['@miragon/slidev-validator/recommended'], exceptions: [{ rule: 'element-overflow', files: ['deck/**'], reason: 'ok', expires: '2000-01-01' }] }`,
  )
  const rExp = classify(expired, fakeRule('element-overflow'), [{ file: 'deck/a.md', message: 'overflow' }])
  assert.equal(rExp.status, 'error')
  assert.equal(rExp.expired.length, 1)
})

test('a warn-severity rule reports but does not fail', async () => {
  const cfg = await withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'], rules: { 'no-nested-bullets': 'warn' } }`)
  const r = classify(cfg, fakeRule('no-nested-bullets'), [{ file: 'deck/a.md', slide: 3, message: 'nested' }])
  assert.equal(r.status, 'warn')
  assert.equal(summarize([r]).failed, false)
})

test('a disabled (off) rule is inactive and reported as off', async () => {
  const cfg = await withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'], rules: { 'no-nested-bullets': 'off' } }`)
  assert.equal(isActive(cfg, 'no-nested-bullets'), false)
  const r = classify(cfg, fakeRule('no-nested-bullets'), [])
  assert.equal(r.status, 'off')
})

// --- Rendered rules interpret synthetic metrics -----------------------------

test('rendered rules fire on bad metrics and map to error', async () => {
  const cfg = await withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'] }`)
  const badMetrics = {
    cw: 980, ch: 552, right: 1040, contentBottom: 552, // overflow + no bottom margin
    emDash: true, emoji: true, blueHeads: 1, badCards: 2, inlineFonts: 1, listOverrides: 1, nestedLists: 1,
  }
  const measured = [{ slide: 5, file: 'deck/chapter/01-intro/01-intro.md', metrics: badMetrics }]
  const results = runRenderedRules(renderedRules, cfg, measured)
  const byId = Object.fromEntries(results.map((r) => [r.rule.id, r]))
  for (const id of ['element-overflow', 'no-em-dash', 'no-emoji', 'heading-black', 'card-white', 'no-inline-font', 'no-restyled-bullets']) {
    assert.equal(byId[id].status, 'error', `${id} should error on bad metrics`)
  }
  assert.equal(byId['no-nested-bullets'].status, 'warn') // default warn
  assert.equal(summarize(results).failed, true)
})

test('rendered rules pass on clean metrics', async () => {
  const cfg = await withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'] }`)
  const ok = { cw: 980, ch: 552, right: 980, contentBottom: 500, emDash: false, emoji: false, blueHeads: 0, badCards: 0, inlineFonts: 0, listOverrides: 0, nestedLists: 0 }
  const results = runRenderedRules(renderedRules, cfg, [{ slide: 1, file: 'deck/slides.md', metrics: ok }])
  assert.equal(summarize(results).failed, false)
})

test('rendered rules are skipped (not applicable) when the run did not happen', async () => {
  const cfg = await withConfig(`export default { extends: ['@miragon/slidev-validator/recommended'] }`)
  const results = runRenderedRules(renderedRules, cfg, null)
  assert.ok(results.every((r) => r.status === 'skipped'))
})

// --- Light integration: source rules on the real reference deck -------------

test('source rules pass on the repo reference deck (new-project baseline)', async (t) => {
  const { validate } = await import('../src/index.mjs')
  const prev = process.env.SLIDEV_VALIDATOR_ROOT
  process.env.SLIDEV_VALIDATOR_ROOT = REPO_ROOT
  try {
    const { results, summary } = await validate({ rendered: false })
    // Every source rule that ran must pass; rendered rules are skipped here.
    const ranSource = results.filter((r) => r.rule.type === 'source' && r.status !== 'off' && r.status !== 'skipped')
    assert.ok(ranSource.length >= 3, 'expected several source rules to run')
    assert.equal(summary.failed, false, 'reference deck must pass source rules')
  } finally {
    if (prev === undefined) delete process.env.SLIDEV_VALIDATOR_ROOT
    else process.env.SLIDEV_VALIDATOR_ROOT = prev
  }
})
