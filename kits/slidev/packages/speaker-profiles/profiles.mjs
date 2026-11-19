/**
 * Reading and writing the per-speaker profile files.
 *
 * One file per speaker, never a shared one: two speakers changing their
 * selection touch disjoint files, so git cannot put them in conflict. Arrays
 * are written sorted so diffs stay minimal. There is deliberately no
 * `updatedAt` field: it would be the one line that changes on every write and
 * would turn "same person, two machines, different slides" into a guaranteed
 * conflict carrying no information. Git already records the timestamp.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const PROFILE_DIR = '.slidev-profiles'
export const SCHEMA_VERSION = 1

const RE_SAFE_NAME = /^[a-z0-9][a-z0-9_-]*$/i

/** Walk up from the deck root looking for the profile directory, then the repo root. */
export function findProfilesRoot(startDir) {
  let dir = startDir
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, PROFILE_DIR)))
      return dir
    const parent = dirname(dir)
    if (parent === dir)
      break
    dir = parent
  }
  dir = startDir
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, '.git')))
      return dir
    const parent = dirname(dir)
    if (parent === dir)
      break
    dir = parent
  }
  return startDir
}

export function profilePath(root, speaker) {
  return join(root, PROFILE_DIR, `${speaker}.json`)
}

export function listProfiles(root) {
  const dir = join(root, PROFILE_DIR)
  if (!existsSync(dir))
    return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.slice(0, -5))
    .sort()
}

/**
 * Which speaker are we? `SLIDEV_PROFILE` wins so CI and one-off builds can be
 * explicit. Otherwise a local, gitignored `.slidev-profiles/.current`.
 * Deliberately NOT `git config user.name`: that is a GitHub handle here and it
 * differs per machine.
 */
export function resolveSpeaker(root, { allowCurrentFile = true } = {}) {
  const fromEnv = process.env.SLIDEV_PROFILE?.trim()
  // `none` switches the addon off for tools that drive the deck slide by slide
  // (the validator, screenshot runs): the skip logic would navigate away from
  // the slide they are waiting for and they would time out.
  if (fromEnv === 'none')
    return undefined
  if (fromEnv)
    return fromEnv
  if (!allowCurrentFile)
    return undefined
  const currentFile = join(root, PROFILE_DIR, '.current')
  if (existsSync(currentFile)) {
    const name = readFileSync(currentFile, 'utf-8').trim()
    if (name)
      return name
  }
  return undefined
}

/** Is there a .current that we are deliberately ignoring? Used for a clear log line. */
export function hasCurrentFile(root) {
  return existsSync(join(root, PROFILE_DIR, '.current'))
}

export function isValidName(name) {
  return typeof name === 'string' && RE_SAFE_NAME.test(name) && name.length <= 64
}

export function readProfile(root, speaker) {
  const file = profilePath(root, speaker)
  if (!existsSync(file))
    return { schemaVersion: SCHEMA_VERSION, speaker, hidden: [], order: null, knownIds: [] }
  const raw = JSON.parse(readFileSync(file, 'utf-8'))
  return {
    schemaVersion: raw.schemaVersion ?? SCHEMA_VERSION,
    speaker,
    hidden: Array.isArray(raw.hidden) ? raw.hidden : [],
    order: raw.order ?? null,
    knownIds: Array.isArray(raw.knownIds) ? raw.knownIds : [],
  }
}

export function writeProfile(root, speaker, profile) {
  const dir = join(root, PROFILE_DIR)
  if (!existsSync(dir))
    mkdirSync(dir, { recursive: true })
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    speaker,
    hidden: [...new Set(profile.hidden ?? [])].sort(),
    order: profile.order ?? null,
    knownIds: [...new Set(profile.knownIds ?? [])].sort(),
  }
  writeFileSync(profilePath(root, speaker), `${JSON.stringify(payload, null, 2)}\n`, 'utf-8')
  return payload
}
