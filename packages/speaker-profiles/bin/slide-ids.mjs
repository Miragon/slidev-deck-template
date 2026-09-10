#!/usr/bin/env node
/**
 * Every slide carries a stable id, and nobody has to think about it.
 *
 * The speaker profiles in .slidev-profiles/ address slides by id. An id derived
 * from a slide's title or position moves the moment somebody retitles a slide,
 * inserts one above it or renumbers a chapter file, and the speaker's selection
 * then points at a slide they never chose. So the id is a random token written
 * into the slide's frontmatter, and this command is what writes it:
 *
 *   slide-ids --stamp    # give every unstamped slide an id
 *   slide-ids --check    # fail if one is missing, malformed or duplicated
 *   slide-ids            # list the deck with its ids
 *
 * Wire `--stamp` into whatever starts the dev server and `--check` into verify
 * and CI, and a slide gets its id from being looked at once. Builds should only
 * ever check: a build must not mutate its own sources.
 *
 * The id is `s-` plus 8 hex characters. Short enough to stay readable in a
 * frontmatter block and in a profile's `hidden` list, random so that two
 * branches adding a slide at the same time can never pick the same one.
 */
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { injectPreparserExtensionLoader, load } from '@slidev/parser/fs'
import { walkMarkdownFiles } from '../identity.mjs'
import { findProfilesRoot, listProfiles, readProfile } from '../profiles.mjs'

const ID_PREFIX = 's-'
const RE_ID = /^s-[0-9a-f]{8}$/

const USAGE = `slide-ids - stable ids for the slides of a Slidev deck

  slide-ids [--check | --stamp] [options]

  --stamp            write an id into every slide that has none
  --check            exit 1 if an id is missing, malformed or duplicated
  (neither)          list the deck with its ids

  --entry <file>     the deck entry (default: slides.md, else deck/slides.md)
  --also <glob>      additionally parse files no entry imports, relative to the
                     deck root; repeatable. Supports * and **/. Use it when the
                     deck parks a chapter by removing its src: line, so the
                     parked file keeps its ids instead of coming back as new
                     slides for every speaker.
  --help
`

function parseArgs(argv) {
  const options = { mode: 'list', entry: undefined, also: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--stamp')
      options.mode = 'stamp'
    else if (arg === '--check')
      options.mode = 'check'
    else if (arg === '--entry')
      options.entry = argv[++i]
    else if (arg === '--also')
      options.also.push(argv[++i])
    else if (arg === '--help' || arg === '-h')
      options.help = true
    else
      throw new Error(`unknown argument "${arg}"`)
  }
  return options
}

let options
try {
  options = parseArgs(process.argv.slice(2))
}
catch (error) {
  console.error(`${error.message}\n\n${USAGE}`)
  process.exit(2)
}

if (options.help) {
  console.log(USAGE)
  process.exit(0)
}

/**
 * Where the deck is. Slidev's own default is `slides.md` next to you, which is
 * right when the scripts live in the deck's own workspace; `deck/slides.md`
 * covers the repo that keeps the deck in a subfolder. Anything else says so
 * with --entry.
 */
function resolveEntry(explicit) {
  if (explicit)
    return path.resolve(explicit)
  for (const candidate of ['slides.md', path.join('deck', 'slides.md')]) {
    if (existsSync(path.resolve(candidate)))
      return path.resolve(candidate)
  }
  console.error(`no deck entry found (looked for slides.md and deck/slides.md). Pass --entry <file>.\n\n${USAGE}`)
  process.exit(2)
}

const entry = resolveEntry(options.entry)
const userRoot = path.dirname(entry)
const profilesRoot = findProfilesRoot(userRoot)
const rel = file => path.relative(process.cwd(), file)

/** `chapter/*` and `chapter/**\/*.md` style patterns. Only * and **\/ are special. */
function globToRegExp(pattern) {
  let body = ''
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        i++
        if (pattern[i + 1] === '/') {
          i++
          body += '(?:.*/)?'
        }
        else {
          body += '.*'
        }
      }
      else {
        body += '[^/]*'
      }
    }
    else if ('.+^${}()|[]\\'.includes(char)) {
      body += `\\${char}`
    }
    else {
      body += char
    }
  }
  return new RegExp(`^${body}$`)
}

/**
 * The entry, plus whatever --also asks for.
 *
 * A deck can park a chapter by taking its `src:` line out, and then no entry
 * reaches the file any more. Parsing only what the entry imports would leave
 * those slides unstamped, and the day the chapter comes back every speaker who
 * had made a selection in it loses it. A parked file is loaded as its own entry:
 * Slidev reads its first frontmatter block as headmatter, which changes nothing
 * about where its slides start.
 */
function deckEntries() {
  if (!options.also.length)
    return [entry]
  const patterns = options.also.map(globToRegExp)
  const extra = walkMarkdownFiles(userRoot)
    .filter((file) => {
      const relative = path.relative(userRoot, file).split(path.sep).join('/')
      return file !== entry && patterns.some(re => re.test(relative))
    })
  return [entry, ...extra]
}

/**
 * The deck's own preparsers are deliberately not loaded, and one of ours is.
 *
 * Not loaded: the speaker-profiles preparser, because here the frontmatter IS
 * the question ("does this slide have an id yet?") and its fallback id
 * derivation would only paper over the gap this command exists to close. Nor any
 * preparser the deck itself installs, so a slide that a variant switch or a
 * feature flag would drop is stamped too rather than depending on the
 * environment this happens to run in.
 *
 * Loaded: an extension that strips `hide` before Slidev acts on it. Slidev drops
 * a hidden slide while parsing, so it would never reach this command - and
 * `hide` is how a deck parks content it means to bring back. Unstamped, every
 * parked slide would return as a new slide for every speaker the day the line is
 * deleted. Stripping it is in-memory only: the file keeps its `hide: true` and
 * simply also gets an `id:`.
 */
injectPreparserExtensionLoader(async () => [{
  name: 'slide-ids:reveal-hidden',
  transformSlide(_content, frontmatter) {
    delete frontmatter.hide
    delete frontmatter.disabled
    return undefined
  },
}])

const parsed = []
for (const file of deckEntries()) {
  parsed.push(await load(
    { userRoot, roots: [userRoot], allowedRoots: [profilesRoot, userRoot] },
    file,
    undefined,
    'dev',
  ))
}

/**
 * One row per slide, anchored to where it really lives.
 *
 * `slide.source` is the slide as written; `slide.frontmatter` is that merged
 * with the frontmatter of the `src:` wrapper that imported it. The wrapper is an
 * import instruction, not a slide, so it is the source we read and the source we
 * write - an `id:` on a wrapper would merge over every slide of the imported
 * file and give them all the same one. `source.start` is the line index of the
 * `---` that opens the slide's frontmatter, which is exactly where the new
 * `id:` line goes.
 */
const rows = []
const seenAnchor = new Set()
for (const data of parsed) {
  for (const slide of data.slides) {
    const source = slide.source ?? slide
    const file = source.filepath
    if (!file)
      continue
    // A file can be reached twice, once through the entry and once as its own.
    // File plus starting line is what makes a slide one slide.
    const anchor = `${file}:${source.start}`
    if (seenAnchor.has(anchor))
      continue
    seenAnchor.add(anchor)
    const frontmatter = source.frontmatter ?? slide.frontmatter ?? {}
    rows.push({
      file,
      start: source.start,
      style: source.frontmatterStyle,
      title: (slide.title ?? '').trim(),
      id: typeof frontmatter.id === 'string' ? frontmatter.id.trim() : '',
    })
  }
}
rows.sort((a, b) => a.file === b.file ? a.start - b.start : a.file.localeCompare(b.file))

const where = row => `${rel(row.file)}:${row.start + 1}`
const name = row => row.title || '(untitled)'

function mintId(taken) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = ID_PREFIX + randomBytes(4).toString('hex')
    if (!taken.has(candidate)) {
      taken.add(candidate)
      return candidate
    }
  }
  throw new Error('could not mint a free slide id')
}

/**
 * Ids already spoken for. The deck is the obvious half; the profiles are the
 * other one. A slide that was deleted still lives on in some speaker's `hidden`
 * list (deliberately, it may come back on another branch), and handing its id to
 * a new slide would switch that slide off for them out of nowhere.
 */
function takenIds() {
  const taken = new Set(rows.map(row => row.id).filter(Boolean))
  for (const speaker of listProfiles(profilesRoot)) {
    const profile = readProfile(profilesRoot, speaker)
    for (const id of [...profile.hidden, ...profile.knownIds])
      taken.add(id)
  }
  return taken
}

function stamp() {
  const taken = takenIds()
  const todo = rows.filter(row => !row.id)
  const unwritable = todo.filter(row => row.style !== 'frontmatter')
  if (unwritable.length) {
    for (const row of unwritable)
      console.error(`FAIL: ${where(row)} has no writable frontmatter block (style: ${row.style})`)
    process.exit(1)
  }
  if (!todo.length) {
    console.log(`slide ids: ${rows.length} slides, all stamped`)
    return
  }

  // Bottom up per file: every insertion shifts the line numbers below it.
  const byFile = new Map()
  for (const row of todo)
    byFile.set(row.file, [...(byFile.get(row.file) ?? []), row])

  for (const [file, slides] of byFile) {
    const raw = readFileSync(file, 'utf-8')
    const eol = raw.includes('\r\n') ? '\r\n' : '\n'
    const lines = raw.split(/\r?\n/)
    for (const row of [...slides].sort((a, b) => b.start - a.start)) {
      row.id = mintId(taken)
      lines.splice(row.start + 1, 0, `id: ${row.id}`)
    }
    writeFileSync(file, lines.join(eol), 'utf-8')
  }

  for (const row of todo)
    console.log(`  + ${row.id}  ${where(row)}  ${name(row)}`)
  console.log(`slide ids: stamped ${todo.length} slide(s) in ${byFile.size} file(s)`)
}

function check() {
  const missing = rows.filter(row => !row.id)
  const malformed = rows.filter(row => row.id && !RE_ID.test(row.id))
  const byId = new Map()
  for (const row of rows.filter(row => row.id))
    byId.set(row.id, [...(byId.get(row.id) ?? []), row])
  const duplicates = [...byId.entries()].filter(([, list]) => list.length > 1)

  for (const row of missing)
    console.error(`FAIL: no id on "${name(row)}" (${where(row)})`)
  for (const row of malformed)
    console.error(`FAIL: id "${row.id}" is not of the form s-xxxxxxxx (${where(row)})`)
  for (const [id, list] of duplicates)
    console.error(`FAIL: id "${id}" used by ${list.length} slides: ${list.map(where).join(', ')}`)

  if (missing.length || malformed.length || duplicates.length) {
    console.error('\nRun `slide-ids --stamp` to give every slide an id.')
    process.exit(1)
  }
  console.log(`slide ids: ${rows.length} slides, ${byId.size} distinct ids, all stamped`)
}

function list() {
  let file = null
  for (const row of rows) {
    if (row.file !== file) {
      file = row.file
      console.log(`\n${rel(file)}`)
    }
    console.log(`  ${(row.id || '(none)').padEnd(12)}  ${name(row)}`)
  }
  console.log(`\n${rows.length} slides`)
}

if (options.mode === 'stamp')
  stamp()
else if (options.mode === 'check')
  check()
else
  list()
