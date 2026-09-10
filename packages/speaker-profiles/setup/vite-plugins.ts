/**
 * The dev-only write path for the editor overlay.
 *
 * A built SPA has no file system, so this endpoint simply does not exist there
 * and the overlay never turns editable. That is the gate: in the deployed deck
 * and in the presentation itself there is no UI to mis-click, only the skip
 * logic. Editing is unlocked with SLIDEV_PROFILE_EDIT=1.
 */
import { findProfilesRoot, isValidName, listProfiles, readProfile, resolveSpeaker, writeProfile } from '../profiles.mjs'

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

export default function (options: any) {
  const userRoot = options.userRoot as string
  const profilesRoot = findProfilesRoot(userRoot)
  const editable = process.env.SLIDEV_PROFILE_EDIT === '1'

  return {
    name: 'speaker-profiles:server',
    apply: 'serve' as const,
    configureServer(server: any) {
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
