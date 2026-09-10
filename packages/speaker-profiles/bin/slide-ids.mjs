#!/usr/bin/env node
/**
 * Every slide carries a stable id, and nobody has to think about it.
 *
 * A profile addresses slides by the `id:` in their frontmatter, so the id has to
 * hold still: derived from a title or a position it would move the moment
 * somebody retitles a slide, inserts one above it or renumbers a chapter file,
 * and the speaker's selection would then point at a slide they never chose.
 *
 *   slide-ids --stamp    # give every unstamped slide an id
 *   slide-ids --check    # fail if one is missing, malformed or duplicated
 *   slide-ids            # list the deck with its ids
 *
 * **You normally do not need `--stamp`.** Registering the addon is enough: the
 * dev server stamps new slides when it starts, whatever the script that started
 * it is called. Use it for a deck whose parked files no entry imports (`--also`),
 * for a `predev` hook if you want the stamping to be explicit, or to fix a deck
 * that `--check` has just failed on.
 *
 * Put `--check` in CI. Never stamp in a build: a build must not mutate its own
 * sources.
 *
 * The id is `s-` plus 8 hex characters. Short enough to stay readable in a
 * frontmatter block and in a profile's `hidden` list, random so that two
 * branches adding a slide at the same time can never pick the same one.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { RE_ID, collectSlides, stampSlides } from '../stamp.mjs'

const USAGE = `slide-ids - stable ids for the slides of a Slidev deck

  slide-ids [--check | --stamp] [options]

  --stamp            write an id into every slide that has none
  --check            exit 1 if an id is missing, malformed or duplicated
  (neither)          list the deck with its ids

  --entry <file>     the deck entry (default: slides.md, else deck/slides.md)
  --also <glob>      additionally parse files no entry imports, relative to the
                     deck root; repeatable. Supports * and **. Use it when the
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
const also = options.also
const rel = file => path.relative(process.cwd(), file)
const where = row => `${rel(row.file)}:${row.start + 1}`
const name = row => row.title || '(untitled)'

if (options.mode === 'stamp') {
  const { stamped, unwritable, total, skipped, reason, files } = await stampSlides({ entry, also })
  if (unwritable.length) {
    for (const row of unwritable)
      console.error(`FAIL: ${where(row)} has no writable frontmatter block (style: ${row.style})`)
    process.exit(1)
  }
  if (skipped) {
    console.error(reason === 'busy'
      ? 'slide ids: another stamping run holds the lock, nothing written'
      : `slide ids: could not take the stamping lock (${reason}), nothing written`)
    process.exit(1)
  }
  if (!stamped.length) {
    console.log(`slide ids: ${total} slides, all stamped`)
  }
  else {
    for (const row of stamped)
      console.log(`  + ${row.id}  ${where(row)}  ${name(row)}`)
    console.log(`slide ids: stamped ${stamped.length} slide(s) in ${files} file(s)`)
  }
}
else {
  const { rows } = await collectSlides({ entry, also })

  if (options.mode === 'check') {
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
  else {
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
}
