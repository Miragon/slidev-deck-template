#!/usr/bin/env node
// Scaffold a lean Miragon Slidev deck.
//
// Emits ONLY what a deck needs: the shared skeleton (deck/, .claude/, CLAUDE.md,
// .npmrc, .gitignore, the two CI workflows) plus a generated overlay (a standalone
// package.json + a starter validator config + a deck-focused README). Neither the
// toolkit NOR the validator is vendored: both are added as exact-pinned npm
// dependencies. The deck consumes the toolkit via the theme and runs the validator
// via its `slidev-validator` bin, so central guardrail improvements reach the deck
// over a controlled `npm update` instead of a frozen copy of verify/.
//
// The generated package.json is DERIVED from the fetched skeleton's own manifests
// (deck/package.json for the Slidev runtime deps), so the deck's versions are
// whatever the reference deck currently pins — kept current by the monorepo's
// Dependabot. The toolkit AND validator versions come from THIS package's own
// pinned devDependencies (the reference deck resolves both via workspace symlinks,
// so it has no versions to read).
//
// Reproducibility: the skeleton is fetched from this template repo pinned to the
// tag that matches THIS package's version, so a given create-slidev-deck version
// always emits an identical deck. `--ref`, `--toolkit-version` and
// `--validator-version` override.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { downloadTemplate } from 'giget'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = 'Miragon/slidev-deck-template'
const SELF = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

// The toolkit + validator versions written into the generated package.json: this
// package's own pinned devDependencies, so Dependabot keeps the defaults current
// and a given create-slidev-deck version emits a byte-identical deck.
const TOOLKIT_VERSION = SELF.devDependencies['@miragon/slidev-toolkit']
const VALIDATOR_VERSION = SELF.devDependencies['@miragon/slidev-validator']

// Paths copied verbatim from the fetched skeleton into the new deck. Anything not
// listed (packages/, verify/ [now the @miragon/slidev-validator package],
// release-please*, pr-title.yml, LICENSE, netlify.toml, docs/) is intentionally
// left out — that is the whole point of the scaffold.
const SKELETON = [
  'deck',
  '.claude',
  'CLAUDE.md',
  '.npmrc',
  '.gitignore',
  '.github/workflows/ci.yml',
  '.github/workflows/pin-check.yml',
]

// Skeleton files READ (not copied) to derive the generated package.json.
const MANIFESTS = ['package.json', 'deck/package.json']

// Skeleton files that must not survive into a standalone deck. The deck's own
// workspace sub-manifest is replaced by the generated root package.json below.
const PRUNE = ['deck/package.json']

// A starter validator config generated into every new deck: extends the central
// recommended preset, checked in so it is versionable and overridable per project.
const STARTER_VALIDATOR_CONFIG = `// Miragon Slidev validator config. See @miragon/slidev-validator.
// Severities: 'off' | 'warn' | 'error'. Rules marked [required] cannot be lowered
// below 'error' here — suppress them deliberately via an 'exceptions' entry instead.
export default {
  extends: ['@miragon/slidev-validator/recommended'],
  rules: {},
  overrides: [],
  exceptions: [],
}
`

/** Parse argv with node:util — it validates unknown options and missing values for us. */
function parseCliArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      ref: { type: 'string' },
      'toolkit-version': { type: 'string' },
      'validator-version': { type: 'string' },
      version: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  if (positionals.length > 1) throw new Error(`Unexpected argument: ${positionals[1]}`)
  return {
    target: positionals[0],
    ref: values.ref,
    toolkitVersion: values['toolkit-version'],
    validatorVersion: values['validator-version'],
    version: values.version,
    help: values.help,
  }
}

const USAGE = `Usage: npm create @miragon/slidev-deck@latest <dir> [options]

  <dir>                    target directory for the new deck (must be empty)

Options:
  --ref <tag|sha|branch>   skeleton source ref (default: this version's release tag)
  --toolkit-version <x>    pin @miragon/slidev-toolkit to <x> (default: ${TOOLKIT_VERSION})
  --validator-version <x>  pin @miragon/slidev-validator to <x> (default: ${VALIDATOR_VERSION})
  -v, --version            print the create-slidev-deck version
  -h, --help               show this help

Env:
  CREATE_DECK_SKELETON=<dir>   copy the skeleton from a local checkout instead of
                               fetching (development / offline).`

/** Detect the package manager the initializer was launched with (npm create / pnpm create / …). */
function packageManager() {
  const name = (process.env.npm_config_user_agent ?? '').split('/')[0]
  return ['pnpm', 'yarn', 'bun'].includes(name) ? name : 'npm'
}

/** Fetch (or locally copy) the template repo into a scratch dir; return its path. */
async function fetchSkeleton(ref) {
  const local = process.env.CREATE_DECK_SKELETON
  const scratch = await mkdtemp(join(tmpdir(), 'create-slidev-deck-'))
  if (!local) {
    await downloadTemplate(`github:${REPO}#${ref}`, { dir: scratch, force: true })
    return scratch
  }
  // Local mode brings the copy whitelist plus the manifests we read to build the
  // package.json (giget's full download already contains them).
  const src = resolve(local)
  for (const rel of [...SKELETON, ...MANIFESTS]) {
    const from = join(src, rel)
    if (existsSync(from)) {
      await mkdir(dirname(join(scratch, rel)), { recursive: true })
      await cp(from, join(scratch, rel), { recursive: true })
    }
  }
  return scratch
}

/** Turn a target directory into a valid, lowercase npm package name. */
function deckNameFrom(dir) {
  return basename(dir).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'my-deck'
}

/** Build the standalone deck package.json from the fetched skeleton's manifests. */
function buildPackageJson(scratch, deckName, toolkitVersion, validatorVersion) {
  const readManifest = (rel) => JSON.parse(readFileSync(join(scratch, rel), 'utf8'))
  const deckPkg = readManifest('deck/package.json')
  const portlessVersion = deckPkg.devDependencies?.portless
  if (!portlessVersion) throw new Error('Reference deck/package.json is missing devDependency portless')
  const pkg = {
    name: deckName,
    type: 'module',
    private: true,
    scripts: {
      dev: 'portless',
      'dev:app': 'slidev deck/slides.md --port ${PORT:-3030} --remote --bind 127.0.0.1',
      build: 'slidev build deck/slides.md --out ../dist',
      export: 'slidev export deck/slides.md',
      // The validator ships as its own bin; rendered mode boots Slidev + Chromium
      // (pulled transitively via the validator), source mode is fast and CI-safe.
      verify: 'slidev-validator --rendered',
      'verify:ci': 'slidev-validator --rendered',
      'verify:source': 'slidev-validator',
    },
    dependencies: { '@miragon/slidev-toolkit': toolkitVersion, ...deckPkg.dependencies },
    devDependencies: { '@miragon/slidev-validator': validatorVersion, portless: portlessVersion },
  }
  return JSON.stringify(pkg, null, 2) + '\n'
}

/** Exit unless `target` is absent or an empty directory. Returns whether it already exists. */
async function ensureEmptyTarget(target) {
  if (!existsSync(target)) return false
  const refuse = (why) => {
    console.error(`Refusing to scaffold: ${target} ${why}.`)
    process.exit(1)
  }
  if (!statSync(target).isDirectory()) refuse('exists and is not a directory')
  if ((await readdir(target)).length > 0) refuse('exists and is not empty')
  return true
}

/** Copy each whitelisted skeleton path into the target. */
async function copySkeleton(scratch, target, ref) {
  for (const rel of SKELETON) {
    const from = join(scratch, rel)
    if (!existsSync(from)) throw new Error(`Skeleton is missing ${rel} (ref ${ref}).`)
    const to = join(target, rel)
    await mkdir(dirname(to), { recursive: true })
    await cp(from, to, { recursive: true })
  }
}

/** Undo a half-written target so a retry is not blocked by the empty-dir guard. */
async function rollback(target, preexisting) {
  if (!preexisting) return rm(target, { recursive: true, force: true })
  for (const entry of await readdir(target).catch(() => [])) {
    await rm(join(target, entry), { recursive: true, force: true })
  }
}

/** Assemble the deck in `target`: skeleton, prune, then the generated overlay. */
async function layDownDeck({ scratch, target, deckName, toolkitVersion, validatorVersion, ref, preexisting }) {
  try {
    await mkdir(target, { recursive: true })
    await copySkeleton(scratch, target, ref)
    for (const rel of PRUNE) await rm(join(target, rel), { force: true })

    const packageJson = buildPackageJson(scratch, deckName, toolkitVersion, validatorVersion)
    await writeFile(join(target, 'package.json'), packageJson)
    const portlessJson = JSON.stringify({ name: deckName, script: 'dev:app' }, null, 2) + '\n'
    await writeFile(join(target, 'portless.json'), portlessJson)
    await writeFile(join(target, 'slidev-validator.config.mjs'), STARTER_VALIDATOR_CONFIG)
    await cp(join(HERE, '..', 'templates', 'README.md'), join(target, 'README.md'))
  } catch (err) {
    await rollback(target, preexisting)
    throw err
  }
}

function printNextSteps(dir) {
  const pm = packageManager()
  console.log(`
Done. Your deck is ready in ${dir}

Next steps:
  cd ${dir}
  ${pm} install
  npx portless service install   # one-time per machine: HTTPS proxy for the .localhost dev URL
  ${pm} run dev                  # serves at https://${deckNameFrom(dir)}.localhost

Build with '${pm} run build', check brand guardrails with '${pm} run verify'.`)
}

async function main() {
  const opts = parseCliArgs(process.argv.slice(2))
  if (opts.version) {
    console.log(SELF.version)
    return
  }
  if (opts.help || !opts.target) {
    console.log(USAGE)
    process.exit(opts.help ? 0 : 1)
  }

  const target = resolve(opts.target)
  const preexisting = await ensureEmptyTarget(target)
  const ref = opts.ref ?? `create-slidev-deck-v${SELF.version}`
  const toolkitVersion = opts.toolkitVersion ?? TOOLKIT_VERSION
  const validatorVersion = opts.validatorVersion ?? VALIDATOR_VERSION
  const deckName = deckNameFrom(target)

  const source = process.env.CREATE_DECK_SKELETON ? 'local checkout' : `${REPO}#${ref}`
  console.log(`Scaffolding ${deckName} from ${source} ...`)

  const scratch = await fetchSkeleton(ref)
  try {
    await layDownDeck({ scratch, target, deckName, toolkitVersion, validatorVersion, ref, preexisting })
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }

  printNextSteps(opts.target)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
