/**
 * Slide identity, shared by the preparser and the dev server.
 *
 * The id of a slide is the `id:` in its frontmatter, written there once by
 * the `slide-ids` command and never touched again. It survives a retitle, a
 * move within the chapter and a move to another chapter, which is what a
 * speaker's selection needs: nothing about the slide's content or position can
 * make a profile point at the wrong slide.
 *
 * Everything below the first step is a fallback for the seconds between writing
 * a new slide and `slide-ids --stamp` running.
 * It is derived from file plus title, so it is stable enough to work with and
 * fragile enough that `slide-ids --check` refuses to let it reach main.
 *
 * Resolution chain, in order:
 *   1. an explicit `id:` in the slide frontmatter (the normal case)
 *   2. `<file-slug>/<title-slug>` plus `~n` for the 2nd, 3rd ... occurrence
 *   3. `<file-slug>/untitled~n` when a slide has no title at all
 *
 * `transformSlide` does not receive the file path, so the file is identified by
 * hashing the raw lines Slidev hands to `transformRawLines` and looking the
 * hash up in an index of the deck's markdown files. That keeps Slidev in charge
 * of splitting slides, which is the fragile part we do not want to re-implement.
 */
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, relative, sep } from 'node:path'

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'public', 'resources', '.slidev'])

/**
 * Folder names that only say "slides live in here" and carry no meaning of
 * their own. Dropped from the front of a label so the useful part leads.
 */
const CONTAINER_DIRS = new Set(['chapter', 'chapters', 'content', 'contents', 'slides', 'pages', 'src'])

/**
 * The label a slide's file contributes to the editor's grouping.
 *
 * Deliberately NOT the file name. A deck is free to call every one of its files
 * `slides.md` and tell them apart by folder (both developer trainings do), and
 * a basename would then collapse the whole deck into one group. The folder path
 * is what actually says where a slide sits, at any nesting depth:
 *
 *   chapter/03-bpmn-foundations/03-bpmn-foundations.md -> 03-bpmn-foundations
 *   content/1-fundamentals/01-about-miragon/slides.md  -> 1-fundamentals/01-about-miragon
 *   slides.md                                          -> slides
 */
export function chapterLabel(root, file) {
  const segments = relative(root, file).split(sep)
  const dirs = segments.slice(0, -1)
  if (!dirs.length)
    return basename(file, extname(file))
  const trimmed = CONTAINER_DIRS.has(dirs[0]) ? dirs.slice(1) : dirs
  return (trimmed.length ? trimmed : dirs).join('/')
}

export function normalise(text) {
  return text.split(/\r?\n/).join('\n')
}

export function hashContent(text) {
  return createHash('sha1').update(normalise(text)).digest('hex')
}

/** Every markdown file under the deck, absolute paths, in a stable order. */
export function walkMarkdownFiles(root) {
  const found = []
  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir)
    }
    catch {
      return
    }
    for (const entry of entries.sort()) {
      if (SKIP_DIRS.has(entry) || entry.startsWith('.'))
        continue
      const full = join(dir, entry)
      let stat
      try {
        stat = statSync(full)
      }
      catch {
        continue
      }
      if (stat.isDirectory())
        walk(full)
      else if (extname(entry) === '.md')
        found.push(full)
    }
  }
  walk(root)
  return found
}

/** Map sha1(file content) -> chapter label, for every markdown file under the deck. */
export function indexMarkdownFiles(root) {
  const index = new Map()
  for (const file of walkMarkdownFiles(root)) {
    try {
      index.set(hashContent(readFileSync(file, 'utf-8')), chapterLabel(root, file))
    }
    catch {
      // unreadable file, skip
    }
  }
  return index
}

const RE_HEADING = /^\s{0,3}#{1,6}\s+(.+?)\s*$/m

export function titleOf(content, frontmatter) {
  if (typeof frontmatter?.title === 'string' && frontmatter.title.trim())
    return frontmatter.title.trim()
  const heading = content.match(RE_HEADING)
  if (heading)
    return heading[1].replace(/\*\*/g, '').replace(/`/g, '').trim()
  return ''
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled'
}

/**
 * Stateful id assigner for one load pass. `startFile` is called once per
 * markdown file (from `transformRawLines`), `next` once per slide of that file.
 */
export function createIdAssigner(fileIndex) {
  let fileSlug = 'unknown'
  let counters = new Map()

  return {
    startFile(rawLines) {
      fileSlug = fileIndex.get(hashContent(rawLines.join('\n'))) ?? 'unknown'
      counters = new Map()
    },
    /**
     * Which chapter file we are in. The id no longer says, so the editor's
     * grouping asks here and the preparser hands the answer to the client.
     */
    file() {
      return fileSlug
    },
    next(content, frontmatter) {
      if (typeof frontmatter?.id === 'string' && frontmatter.id.trim())
        return frontmatter.id.trim()
      const slug = slugify(titleOf(content, frontmatter))
      const n = (counters.get(slug) ?? 0) + 1
      counters.set(slug, n)
      return n === 1 ? `${fileSlug}/${slug}` : `${fileSlug}/${slug}~${n}`
    },
  }
}
