/**
 * Giving slides their ids: the part the CLI and the dev server share.
 *
 * A profile addresses slides by the `id:` in their frontmatter, so the id has
 * to hold still. An id derived from a slide's title or position moves the
 * moment somebody retitles a slide, inserts one above it or renumbers a chapter
 * file, and the speaker's selection then points at a slide they never chose.
 *
 * `bin/slide-ids.mjs` calls this from a script; `setup/vite-plugins.ts` calls it
 * once when a dev server starts, so that a deck needs no npm wiring at all to
 * keep new slides stamped - which matters for the decks that have one dev script
 * per chapter, where a `predev` hook would have to be repeated eight times and
 * would be forgotten once.
 */
import { randomBytes } from 'node:crypto'
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { injectPreparserExtensionLoader, load } from '@slidev/parser/fs'
import { walkMarkdownFiles } from './identity.mjs'
import { PROFILE_DIR, findProfilesRoot, listProfiles, readProfile } from './profiles.mjs'

export const ID_PREFIX = 's-'
export const RE_ID = /^s-[0-9a-f]{8}$/

/** `chapter/*` and `chapter/**\/*.md` style patterns. Only `*` and `**` are special. */
export function globToRegExp(pattern) {
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
 * The entry, plus whatever `also` asks for.
 *
 * A deck can park a chapter by taking its `src:` line out, and then no entry
 * reaches the file any more. Parsing only what the entry imports would leave
 * those slides unstamped, and the day the chapter comes back every speaker who
 * had made a selection in it loses it. A parked file is loaded as its own entry:
 * Slidev reads its first frontmatter block as headmatter, which changes nothing
 * about where its slides start.
 */
function deckEntries(entry, userRoot, also) {
  if (!also.length)
    return [entry]
  const patterns = also.map(globToRegExp)
  const extra = walkMarkdownFiles(userRoot).filter((file) => {
    const relative = path.relative(userRoot, file).split(path.sep).join('/')
    return file !== entry && patterns.some(re => re.test(relative))
  })
  return [entry, ...extra]
}

/**
 * Every slide of the deck, anchored to where it really lives.
 *
 * `slide.source` is the slide as written; `slide.frontmatter` is that merged
 * with the frontmatter of the `src:` wrapper that imported it. The wrapper is an
 * import instruction, not a slide, so it is the source we read and the source we
 * write - an `id:` on a wrapper would merge over every slide of the imported
 * file and give them all the same one. `source.start` is the line index of the
 * `---` that opens the slide's frontmatter, which is exactly where a new `id:`
 * line goes.
 *
 * The deck's own preparsers are deliberately not loaded, and one of ours is.
 * Not loaded: this addon's preparser, because here the frontmatter IS the
 * question and its fallback id derivation would paper over the gap; nor any
 * preparser the deck installs, so a slide that a variant switch would drop is
 * stamped too instead of depending on the environment this runs in. Loaded: an
 * extension that strips `hide` before Slidev acts on it, because Slidev drops a
 * hidden slide while parsing and `hide` is how a deck parks content it means to
 * bring back. Stripping it is in-memory only: the file keeps its `hide: true`
 * and simply also gets an `id:`.
 */
export async function collectSlides({ entry, also = [] }) {
  const userRoot = path.dirname(entry)
  const profilesRoot = findProfilesRoot(userRoot)

  injectPreparserExtensionLoader(async () => [{
    name: 'slide-ids:reveal-hidden',
    transformSlide(_content, frontmatter) {
      delete frontmatter.hide
      delete frontmatter.disabled
      return undefined
    },
  }])

  const rows = []
  const seenAnchor = new Set()
  for (const file of deckEntries(entry, userRoot, also)) {
    const data = await load(
      { userRoot, roots: [userRoot], allowedRoots: [profilesRoot, userRoot] },
      file,
      undefined,
      'dev',
    )
    for (const slide of data.slides) {
      const source = slide.source ?? slide
      if (!source.filepath)
        continue
      // A file can be reached twice, once through the entry and once as its own.
      // File plus starting line is what makes a slide one slide.
      const anchor = `${source.filepath}:${source.start}`
      if (seenAnchor.has(anchor))
        continue
      seenAnchor.add(anchor)
      const frontmatter = source.frontmatter ?? slide.frontmatter ?? {}
      rows.push({
        file: source.filepath,
        start: source.start,
        style: source.frontmatterStyle,
        title: (slide.title ?? '').trim(),
        id: typeof frontmatter.id === 'string' ? frontmatter.id.trim() : '',
      })
    }
  }
  rows.sort((a, b) => a.file === b.file ? a.start - b.start : a.file.localeCompare(b.file))
  return { rows, userRoot, profilesRoot }
}

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
function takenIds(rows, profilesRoot) {
  const taken = new Set(rows.map(row => row.id).filter(Boolean))
  for (const speaker of listProfiles(profilesRoot)) {
    const profile = readProfile(profilesRoot, speaker)
    for (const id of [...profile.hidden, ...profile.knownIds])
      taken.add(id)
  }
  return taken
}

const LOCK_NAME = '.stamp.lock'
const LOCK_STALE_MS = 60_000

/**
 * One stamping run at a time.
 *
 * Decks with a dev script per chapter are meant to be run several at once, and
 * two servers starting together on a deck that has unstamped slides would both
 * mint ids and both write. The loser of that race would hold ids in memory that
 * are not the ones on disk. Whoever does not get the lock skips: by the time it
 * matters the other run has written the ids, and stamping is idempotent anyway.
 */
function withLock(profilesRoot, fn) {
  const dir = path.join(profilesRoot, PROFILE_DIR)
  const lock = path.join(dir, LOCK_NAME)
  // The very first stamp of a deck runs before anyone has made a profile, so
  // the directory the lock lives in may not exist yet. Creating it is not a
  // side effect: stamping IS the deck opting in, and the profiles land here.
  try {
    mkdirSync(dir, { recursive: true })
  }
  catch {
    // read-only, or a file in the way. The open below reports it properly.
  }
  let handle
  try {
    handle = openSync(lock, 'wx')
  }
  catch (error) {
    if (error?.code !== 'EEXIST')
      return { skipped: true, reason: error?.code ?? 'unknown', stamped: [], total: 0 }
    // A lock left behind by a killed process must not block the deck forever.
    try {
      if (Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS)
        unlinkSync(lock)
      handle = openSync(lock, 'wx')
    }
    catch {
      return { skipped: true, reason: 'busy', stamped: [], total: 0 }
    }
  }
  try {
    return fn()
  }
  finally {
    try {
      closeSync(handle)
      unlinkSync(lock)
    }
    catch {
      // best effort: a stale lock is cleared by the next run
    }
  }
}

/**
 * Write an id into every slide that has none.
 *
 * Returns what it did rather than printing, so the CLI can be chatty and the dev
 * server can be a single line.
 */
export async function stampSlides({ entry, also = [] }) {
  const { rows, profilesRoot } = await collectSlides({ entry, also })
  const todo = rows.filter(row => !row.id)
  const unwritable = todo.filter(row => row.style !== 'frontmatter')
  if (unwritable.length)
    return { rows, stamped: [], unwritable, total: rows.length }
  if (!todo.length)
    return { rows, stamped: [], unwritable: [], total: rows.length }

  const result = withLock(profilesRoot, () => {
    const taken = takenIds(rows, profilesRoot)
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
    return { skipped: false, stamped: todo, files: byFile.size }
  })

  return { rows, unwritable: [], total: rows.length, ...result }
}

/** Is there a profile directory at all? Nothing here makes sense without one. */
export function hasProfilesDir(profilesRoot) {
  return existsSync(path.join(profilesRoot, PROFILE_DIR))
}
