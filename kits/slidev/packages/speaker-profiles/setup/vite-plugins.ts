/**
 * The dev-only half of the addon: the write path for the editor overlay, and
 * giving new slides their ids.
 *
 * A built SPA has no file system, so the endpoint simply does not exist there
 * and the overlay never turns editable. That is the gate: in the deployed deck
 * and in the presentation itself there is no UI to mis-click, only the skip
 * logic. Editing is unlocked with SLIDEV_PROFILE_EDIT=1.
 *
 * Stamping lives here rather than in an npm hook because a deck can have any
 * number of ways to start a dev server - the two developer trainings have one
 * script per chapter, eight and nine of them - and a `predev` hook would have to
 * be repeated in each and would be forgotten in one. Every one of them boots
 * this plugin.
 */
import { findProfilesRoot, isValidName, listProfiles, readProfile, resolveSpeaker, writeProfile } from '../profiles.mjs'
import { hasProfilesDir, stampSlides } from '../stamp.mjs'

const BASE = '/@speaker-profiles'

function json(res: any, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: any) => {
      body += chunk
      if (body.length > 1_000_000)
        reject(new Error('payload too large'))
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

/**
 * Give the slides that have none an id, once, when the server starts.
 *
 * Deliberately quiet about the cases where it must not act:
 *
 * - `SLIDEV_PROFILE=none` switches the addon off, and tools that boot a dev
 *   server to drive the deck (the validator, a screenshot run) set it. They must
 *   not come back to a modified working tree.
 * - `SLIDEV_SPEAKER_PROFILES_NO_STAMP=1` is the opt-out for anyone who wants the
 *   dev server to keep its hands off the sources. `slide-ids --stamp` still does
 *   it on demand.
 * - No `.slidev-profiles/` directory means nobody is using profiles here.
 *
 * It never throws. A read-only checkout or a lost race is worth a warning, not a
 * dev server that refuses to start - and `slide-ids --check` in CI is what
 * actually guarantees the deck on main is stamped.
 *
 * The ids land a moment after the first parse, so Vite reloads once. That only
 * happens when there is something to stamp, which is the run right after
 * somebody wrote a slide.
 */
async function stampOnce(entry: string, profilesRoot: string) {
  if (process.env.SLIDEV_PROFILE?.trim() === 'none')
    return
  if (process.env.SLIDEV_SPEAKER_PROFILES_NO_STAMP === '1')
    return
  if (!hasProfilesDir(profilesRoot))
    return
  try {
    const { stamped, unwritable, skipped } = await stampSlides({ entry })
    if (unwritable.length)
      console.warn(`[speaker-profiles] ${unwritable.length} slide(s) have no writable frontmatter block and stay unstamped`)
    else if (stamped.length)
      console.log(`[speaker-profiles] stamped ${stamped.length} new slide(s) with an id`)
    else if (skipped)
      console.log('[speaker-profiles] another run is stamping, skipped')
  }
  catch (error: any) {
    console.warn(`[speaker-profiles] could not stamp slide ids: ${error?.message ?? error}`)
  }
}

export default function (options: any) {
  const userRoot = options.userRoot as string
  const profilesRoot = findProfilesRoot(userRoot)
  const editable = process.env.SLIDEV_PROFILE_EDIT === '1'

  return {
    name: 'speaker-profiles:server',
    apply: 'serve' as const,
    configureServer(server: any) {
      // Not awaited: the server must come up regardless, and the file writes
      // reach the client through Vite's watcher like any other edit.
      void stampOnce(options.entry as string, profilesRoot)

      server.middlewares.use(`${BASE}/state`, (_req: any, res: any) => {
        const speaker = resolveSpeaker(profilesRoot)
        json(res, 200, {
          editable,
          speaker: speaker ?? null,
          profiles: listProfiles(profilesRoot),
          profile: speaker ? readProfile(profilesRoot, speaker) : null,
        })
      })

      server.middlewares.use(`${BASE}/save`, async (req: any, res: any) => {
        if (req.method !== 'POST')
          return json(res, 405, { error: 'POST only' })
        if (!editable)
          return json(res, 403, { error: 'editing is locked. Restart with SLIDEV_PROFILE_EDIT=1' })
        try {
          const payload = JSON.parse(await readBody(req))
          const speaker = String(payload.speaker ?? '').trim()
          if (!isValidName(speaker))
            return json(res, 400, { error: `invalid profile name "${speaker}"` })
          const written = writeProfile(profilesRoot, speaker, {
            hidden: payload.hidden ?? [],
            order: payload.order ?? null,
            knownIds: payload.knownIds ?? [],
          })
          console.log(`[speaker-profiles] saved ${speaker}.json (${written.hidden.length} off)`)
          return json(res, 200, { ok: true, profile: written })
        }
        catch (error: any) {
          return json(res, 400, { error: String(error?.message ?? error) })
        }
      })
    },
  }
}
