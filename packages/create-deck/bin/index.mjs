#!/usr/bin/env node
// Scaffold a lean Miragon Slidev deck.
//
// Emits ONLY what a deck needs: the shared skeleton (deck/, .claude/, CLAUDE.md,
// verify/, .npmrc, .gitignore, the two CI workflows) plus a generated overlay (a
// standalone package.json + a deck-focused README). The toolkit is NOT vendored:
// it is added as an exact-pinned npm dependency and consumed via the theme.
//
// The generated package.json is DERIVED from the fetched skeleton's own manifests
// (deck/package.json for the Slidev runtime deps, the root package.json for the
// verify tooling), so the deck's versions are whatever the reference deck currently
// pins — kept current by the monorepo's Dependabot, nothing to hand-maintain here.
// Only the toolkit version comes from this package (the reference deck resolves it
// via a workspace symlink, so it has no version to read).
//
// Reproducibility: the skeleton is fetched from this template repo pinned to the
// tag that matches THIS package's version, so a given create-slidev-deck version
// always emits an identical deck. `--ref` and `--toolkit-version` override.

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

// The toolkit version written into the generated package.json: this package's own
// pinned @miragon/slidev-toolkit devDependency, so Dependabot keeps the default
// current and a given create-slidev-deck version emits a byte-identical deck.
const TOOLKIT_VERSION = SELF.devDependencies['@miragon/slidev-toolkit']

// Paths copied verbatim from the fetched skeleton into the new deck. Anything not
// listed (packages/, release-please*, pr-title.yml, LICENSE, netlify.toml, docs/)
// is intentionally left out — that is the whole point of the scaffold.
const SKELETON = [
  'deck',
  '.claude',
  'verify',
  'CLAUDE.md',
  '.npmrc',
  '.gitignore',
  '.github/workflows/build-and-deploy.yml',
  '.github/workflows/pin-check.yml',
]

// Skeleton files READ (not copied) to derive the generated package.json.
const MANIFESTS = ['package.json', 'deck/package.json']

// Skeleton files that must not survive into a standalone deck. The deck's own
// workspace sub-manifest is replaced by the generated root package.json below.
const PRUNE = ['deck/package.json']

// The verify tooling the generated deck needs, pulled (by name) from the root
// package.json's devDependencies so the versions track the reference repo.
const VERIFY_DEV_DEPS = ['@playwright/test', 'playwright-chromium']

/** Parse argv with node:util — it validates unknown options and missing values for us. */
function parseCliArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      ref: { type: 'string' },
      'toolkit-version': { type: 'string' },
      version: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  if (positionals.length > 1) throw new Error(`Unexpected argument: ${positionals[1]}`)
  return {
    target: positionals[0],
    ref: values.ref,
    toolkitVersion: values['toolkit-version'],
    version: values.version,
    help: values.help,
  }
}

const USAGE = `Usage: npm create @miragon/slidev-deck@latest <dir> [options]

  <dir>                    target directory for the new deck (must be empty)

Options:
  --ref <tag|sha|branch>   skeleton source ref (default: this version's release tag)
  --toolkit-version <x>    pin @miragon/slidev-toolkit to <x> (default: ${TOOLKIT_VERSION})
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

/** The verify tooling versions, read (by name) from the root package.json's devDependencies. */
function verifyDevDeps(rootPkg) {
  const deps = {}
  for (const name of VERIFY_DEV_DEPS) {
    const version = rootPkg.devDependencies?.[name]
    if (!version) throw new Error(`Root package.json is missing devDependency ${name}`)
    deps[name] = version
  }
  return deps
}

/** Build the standalone deck package.json from the fetched skeleton's manifests. */
function buildPackageJson(scratch, deckName, toolkitVersion) {
  const readManifest = (rel) => JSON.parse(readFileSync(join(scratch, rel), 'utf8'))
  const deckPkg = readManifest('deck/package.json')
  const rootPkg = readManifest('package.json')
  const pkg = {
    name: deckName,
    type: 'module',
    private: true,
    scripts: {
      dev: 'slidev deck/slides.md --open',
      build: 'slidev build deck/slides.md --out ../dist',
      export: 'slidev export deck/slides.md',
      verify: rootPkg.scripts.verify,
      'verify:source': rootPkg.scripts['verify:source'],
    },
    dependencies: { '@miragon/slidev-toolkit': toolkitVersion, ...deckPkg.dependencies },
    devDependencies: verifyDevDeps(rootPkg),
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
async function layDownDeck({ scratch, target, deckName, toolkitVersion, ref, preexisting }) {
  try {
    await mkdir(target, { recursive: true })
    await copySkeleton(scratch, target, ref)
    for (const rel of PRUNE) await rm(join(target, rel), { force: true })

    const packageJson = buildPackageJson(scratch, deckName, toolkitVersion)
    await writeFile(join(target, 'package.json'), packageJson)
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
  ${pm} run dev

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
  const deckName = deckNameFrom(target)

  const source = process.env.CREATE_DECK_SKELETON ? 'local checkout' : `${REPO}#${ref}`
  console.log(`Scaffolding ${deckName} from ${source} ...`)

  const scratch = await fetchSkeleton(ref)
  try {
    await layDownDeck({ scratch, target, deckName, toolkitVersion, ref, preexisting })
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }

  printNextSteps(opts.target)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
