#!/usr/bin/env node
/**
 * The `slidev-validator` CLI — a thin wrapper over src/index.mjs `validate()`.
 *
 *   slidev-validator                 run source rules (fast, no browser)
 *   slidev-validator --rendered      also boot Slidev + Chromium and run rendered rules
 *   slidev-validator init            write a starter slidev-validator.config.mjs
 *   slidev-validator migrate         adopt the validator in an existing deck (config + scripts)
 *   slidev-validator rules           list every rule id, type, category, and default severity
 *
 * Flags: --pages "4-6", --port 3030, --format json, --config <path>,
 *        --max-warnings <n>, -v/--version, -h/--help.
 *
 * Exit code is non-zero on any error-severity violation, an expired exception, a
 * config error, or more warnings than --max-warnings (default: unlimited).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { validate, ConfigError, selfInfo, resolvedToolkitVersion, ruleCatalog } from '../src/index.mjs'
import { formatText, toJson } from '../src/report.mjs'

const STARTER_CONFIG = `// Miragon Slidev validator config. See @miragon/slidev-validator.
// Severities: 'off' | 'warn' | 'error'. Rules marked [required] cannot be lowered
// below 'error' here — suppress them deliberately via an 'exceptions' entry instead.
export default {
  extends: ['@miragon/slidev-validator/recommended'],
  rules: {
    // 'no-nested-bullets': 'warn',
    // 'slide-number-overlap': 'off',
  },
  overrides: [
    // { files: ['deck/chapter/99-legacy/**'], rules: { 'element-overflow': 'off' } },
  ],
  exceptions: [
    // { rule: 'card-white', files: ['deck/chapter/07-*/**'], reason: 'Customer logo tile', ticket: 'ABC-123', expires: '2026-12-31' },
  ],
}
`

const USAGE = `Usage: slidev-validator [command] [options]

Commands:
  (default)                run the validator over ./deck (source rules)
  init                     write a starter slidev-validator.config.mjs
  migrate                  adopt the validator in an existing deck (config + scripts)
  rules                    list every rule id, type, category, and default severity

Options:
  --rendered               also run the rendered (browser) checks
  --pages "4-6"            limit the rendered run to some slides ("2,5,9" or "4-6")
  --port <n>               dev-server port for the rendered run (default 3030)
  --format json            machine-readable report
  --config <path>          use a specific config file
  --max-warnings <n>       fail if warnings exceed <n> (default: unlimited)
  -v, --version            print versions
  -h, --help               show this help`

function parse(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      rendered: { type: 'boolean' },
      pages: { type: 'string' },
      port: { type: 'string' },
      format: { type: 'string' },
      config: { type: 'string' },
      'max-warnings': { type: 'string' },
      version: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  return { values, command: positionals[0] }
}

function cmdInit() {
  const target = join(process.cwd(), 'slidev-validator.config.mjs')
  if (existsSync(target)) {
    console.log('slidev-validator.config.mjs already exists — leaving it untouched.')
    return 0
  }
  writeFileSync(target, STARTER_CONFIG)
  console.log('Wrote slidev-validator.config.mjs (extends @miragon/slidev-validator/recommended).')
  return 0
}

/** Adopt the validator in an existing (statically-copied) deck: config + scripts. */
function cmdMigrate() {
  cmdInit()
  const pkgPath = join(process.cwd(), 'package.json')
  if (!existsSync(pkgPath)) {
    console.log('No package.json here — skipping script migration.')
    return 0
  }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const changes = []
  pkg.scripts ??= {}
  const want = { verify: 'slidev-validator --rendered', 'verify:source': 'slidev-validator', 'verify:ci': 'slidev-validator' }
  for (const [k, v] of Object.entries(want)) {
    if (pkg.scripts[k] !== v && (pkg.scripts[k]?.includes('playwright') || pkg.scripts[k]?.includes('verify/') || pkg.scripts[k] === undefined)) {
      pkg.scripts[k] = v
      changes.push(`  scripts.${k} → ${v}`)
    }
  }
  for (const dep of ['@playwright/test', 'playwright-chromium']) {
    if (pkg.devDependencies?.[dep]) {
      delete pkg.devDependencies[dep]
      changes.push(`  removed devDependency ${dep} (now transitive via @miragon/slidev-validator)`)
    }
  }
  if (!pkg.devDependencies?.['@miragon/slidev-validator']) {
    changes.push('  NOTE: add "@miragon/slidev-validator" to devDependencies (pin an exact version) and run npm install')
  }
  if (changes.length) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    console.log('Updated package.json:')
    console.log(changes.join('\n'))
  }
  if (existsSync(join(process.cwd(), 'verify'))) {
    console.log('You can now delete the old, statically-copied verify/ folder — the validator supersedes it.')
  }
  return 0
}

/** List the rule catalog so authors can discover the ids they configure. */
function cmdRules(values) {
  const catalog = ruleCatalog()
  if (values.format === 'json') {
    console.log(JSON.stringify(catalog, null, 2))
    return 0
  }
  const idW = Math.max(...catalog.map((r) => r.id.length), 'ID'.length)
  const typeW = Math.max(...catalog.map((r) => r.type.length), 'TYPE'.length)
  const catW = Math.max(...catalog.map((r) => r.category.length), 'CATEGORY'.length)
  const sevW = Math.max(...catalog.map((r) => r.default.length), 'DEFAULT'.length)
  const row = (id, type, cat, sev, title) => `  ${id.padEnd(idW)}  ${type.padEnd(typeW)}  ${cat.padEnd(catW)}  ${sev.padEnd(sevW)}  ${title}`
  console.log(`${catalog.length} rules — configure any by id in slidev-validator.config.mjs (off | warn | error):\n`)
  console.log(row('ID', 'TYPE', 'CATEGORY', 'DEFAULT', 'DESCRIPTION'))
  for (const r of catalog) console.log(row(r.id, r.type, r.category, r.default, r.title))
  console.log('\n[required] rules cannot be lowered below error in `rules`; suppress them deliberately via an `exceptions` entry.')
  return 0
}

async function cmdRun(values) {
  try {
    const { results, summary, meta } = await validate({
      rendered: !!values.rendered,
      pages: values.pages,
      port: values.port ? Number(values.port) : undefined,
      configPath: values.config,
      log: (m) => console.error(m),
    })
    if (values.format === 'json') {
      console.log(JSON.stringify(toJson({ results, summary, meta }), null, 2))
    } else {
      console.log(formatText({ results, summary, meta }))
    }
    const maxWarnings = values['max-warnings'] !== undefined ? Number(values['max-warnings']) : Infinity
    const warnFail = summary.warnCount > maxWarnings
    if (warnFail) console.error(`\n${summary.warnCount} warning(s) exceed --max-warnings ${maxWarnings}.`)
    return summary.failed || warnFail ? 1 : 0
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`Config error: ${err.message}`)
      return 2
    }
    throw err
  }
}

async function main() {
  const { values, command } = parse(process.argv.slice(2))
  if (values.help) {
    console.log(USAGE)
    return 0
  }
  if (values.version) {
    console.log(`@miragon/slidev-validator ${selfInfo().version}`)
    console.log(`@miragon/slidev-toolkit    ${resolvedToolkitVersion() ?? 'unresolved'}`)
    return 0
  }
  if (command === 'init') return cmdInit()
  if (command === 'migrate') return cmdMigrate()
  if (command === 'rules') return cmdRules(values)
  if (command && command !== 'run') {
    console.error(`Unknown command: ${command}\n`)
    console.log(USAGE)
    return 2
  }
  return cmdRun(values)
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err instanceof Error ? err.stack || err.message : err)
    process.exit(1)
  })
