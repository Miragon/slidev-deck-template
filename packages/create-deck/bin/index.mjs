#!/usr/bin/env node
// Scaffold a lean Miragon Slidev deck.
//
// Emits ONLY what a deck needs: the shared skeleton (deck/, .claude/, CLAUDE.md,
// verify/, .npmrc, .gitignore, the two CI workflows) plus a small overlay (a
// standalone package.json + a deck-focused README). The toolkit is NOT vendored:
// it is added as an exact-pinned npm dependency and consumed via the theme.
//
// Reproducibility: the skeleton is fetched from this template repo pinned to the
// tag that matches THIS package's version, so a given create-slidev-deck version
// always emits an identical deck. `--ref` and `--toolkit-version` override.

import { existsSync, readFileSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { downloadTemplate } from 'giget'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = 'Miragon/slidev-deck-template'
const SELF = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

// The toolkit version baked into the generated package.json: this package's own
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

// Skeleton files that must not survive into a standalone deck. The deck's own
// workspace sub-manifest is replaced by the generated root package.json below.
const PRUNE = ['deck/package.json']

function parseArgs(argv) {
  const opts = { target: undefined, ref: undefined, toolkitVersion: undefined }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--ref') opts.ref = argv[++i]
    else if (a === '--toolkit-version') opts.toolkitVersion = argv[++i]
    else if (a === '-h' || a === '--help') opts.help = true
    else if (!a.startsWith('-') && !opts.target) opts.target = a
    else throw new Error(`Unknown argument: ${a}`)
  }
  return opts
}

const USAGE = `Usage: npm create @miragon/slidev-deck@latest <dir> [options]

  <dir>                    target directory for the new deck (must be empty)

Options:
  --ref <tag|sha|branch>   skeleton source ref (default: this version's release tag)
  --toolkit-version <x>    pin @miragon/slidev-toolkit to <x> (default: ${TOOLKIT_VERSION})
  -h, --help               show this help

Env:
  CREATE_DECK_SKELETON=<dir>   copy the skeleton from a local checkout instead of
                               fetching (development / offline).`

async function isEmptyDir(dir) {
  if (!existsSync(dir)) return true
  return (await readdir(dir)).length === 0
}

/** Fetch (or locally copy) the template repo into a scratch dir; return its path. */
async function fetchSkeleton(ref) {
  const local = process.env.CREATE_DECK_SKELETON
  const scratch = await mkdtemp(join(tmpdir(), 'create-slidev-deck-'))
  if (local) {
    const src = resolve(local)
    for (const rel of SKELETON) {
      if (existsSync(join(src, rel))) {
        await mkdir(dirname(join(scratch, rel)), { recursive: true })
        await cp(join(src, rel), join(scratch, rel), { recursive: true })
      }
    }
    return scratch
  }
  await downloadTemplate(`github:${REPO}#${ref}`, { dir: scratch, force: true })
  return scratch
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help || !opts.target) {
    console.log(USAGE)
    process.exit(opts.help ? 0 : 1)
  }

  const target = resolve(opts.target)
  if (!(await isEmptyDir(target))) {
    console.error(`Refusing to scaffold: ${target} exists and is not empty.`)
    process.exit(1)
  }

  const ref = opts.ref ?? `create-slidev-deck-v${SELF.version}`
  const toolkitVersion = opts.toolkitVersion ?? TOOLKIT_VERSION
  const deckName = basename(target).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'my-deck'

  const source = process.env.CREATE_DECK_SKELETON ? 'local checkout' : `${REPO}#${ref}`
  console.log(`Scaffolding ${deckName} from ${source} ...`)

  const scratch = await fetchSkeleton(ref)
  try {
    await mkdir(target, { recursive: true })

    // 1. Skeleton: copy the whitelist verbatim.
    for (const rel of SKELETON) {
      const from = join(scratch, rel)
      if (!existsSync(from)) {
        console.error(`Skeleton is missing ${rel} (ref ${ref}). Aborting.`)
        process.exit(1)
      }
      const to = join(target, rel)
      await mkdir(dirname(to), { recursive: true })
      await cp(from, to, { recursive: true })
    }
    for (const rel of PRUNE) await rm(join(target, rel), { force: true })

    // 2. Overlay: the standalone package.json + deck README, with placeholders
    //    filled. The template is named `deck-package.json` (not `package.json`) so
    //    the Pin Check CI does not scan its `__TOOLKIT_VERSION__` placeholder.
    const pkg = (await readFile(join(HERE, '..', 'templates', 'deck-package.json'), 'utf8'))
      .replaceAll('__DECK_NAME__', deckName)
      .replaceAll('__TOOLKIT_VERSION__', toolkitVersion)
    await writeFile(join(target, 'package.json'), pkg)
    await cp(join(HERE, '..', 'templates', 'README.md'), join(target, 'README.md'))
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }

  console.log(`
Done. Your deck is ready in ${opts.target}

Next steps:
  cd ${opts.target}
  npm install
  npm run dev

Build with 'npm run build', check brand guardrails with 'npm run verify'.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
