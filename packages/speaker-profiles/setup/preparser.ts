/**
 * One state, two uses: the profile file decides what the speaker presents and
 * what the export contains.
 *
 * `hide: true` is evaluated while parsing, so a hidden slide never reaches the
 * client. That is exactly what we want for build and export, and exactly what
 * we do NOT want in dev, where the editor has to list the switched-off slides
 * so they can be switched back on. So:
 *
 *   dev   -> inject `data-profile-off`, keep the slide. The runtime skips it.
 *   build -> set `hide: true`. The slide is gone from the bundle and the PDF.
 *
 * Author intent is untouchable: a slide that already carries `hide: true` in
 * the markdown (a backup slide for the Q&A) is the author's decision, not the
 * speaker's. The addon never lists it and never changes it. It does carry an
 * id, though - `slide-ids --stamp` covers hidden slides as well, so that
 * deleting the `hide: true` line one day brings the slide back with the
 * identity it always had rather than as a new slide for everybody.
 *
 * Frontmatter keys are handed to the layout as props and unknown ones fall
 * through onto the layout's root element, so the injected keys are named
 * `data-*`: they land in the DOM as valid data attributes instead of stray
 * ones, and they are handy when debugging a slide. An authored `id:` is read
 * and then removed for the same reason.
 */
import { createIdAssigner, indexMarkdownFiles } from '../identity.mjs'
import { findProfilesRoot, hasCurrentFile, readProfile, resolveSpeaker } from '../profiles.mjs'

export default function ({ filepath, mode }: { filepath: string, headmatter: Record<string, unknown>, mode?: string }) {
  const userRoot = filepath.replace(/[\\/][^\\/]+$/, '')
  const profilesRoot = findProfilesRoot(userRoot)
  const isDev = mode === 'dev'

  // A local `.current` picks the profile while working on the deck, but it must
  // never quietly filter a build: someone would deploy a deck with slides
  // missing and not notice. Build and export take SLIDEV_PROFILE and nothing
  // else, so filtering a release is always a deliberate act.
  const speaker = resolveSpeaker(profilesRoot, { allowCurrentFile: isDev })
  if (!speaker && !isDev && hasCurrentFile(profilesRoot))
    console.log('[speaker-profiles] .slidev-profiles/.current is ignored outside dev - pass SLIDEV_PROFILE=<name> to filter a build')

  // Dev keeps every slide so the editor can show them. Build and export drop them.
  const shouldHide = process.env.SLIDEV_PROFILE_HIDE === '1' || !isDev

  const profile = speaker ? readProfile(profilesRoot, speaker) : undefined
  const hidden = new Set<string>(profile?.hidden ?? [])

  if (speaker)
    console.log(`[speaker-profiles] profile "${speaker}": ${hidden.size} slide(s) off, ${shouldHide ? 'removed from this build' : 'skipped at runtime'}`)
  else
    console.log(`[speaker-profiles] no profile selected (${isDev ? 'set SLIDEV_PROFILE or .slidev-profiles/.current' : 'set SLIDEV_PROFILE'}) - showing the full deck`)

  const assigner = createIdAssigner(indexMarkdownFiles(userRoot))

  return [{
    name: 'speaker-profiles',
    transformRawLines(lines: string[]) {
      assigner.startFile(lines)
    },
    transformSlide(content: string, frontmatter: any) {
      // author intent, not ours to touch
      if (frontmatter.hide === true || frontmatter.disabled === true)
        return undefined

      // A `src:` slide is an import wrapper, not a slide. Slidev merges its
      // frontmatter over EVERY imported slide (`{...slide, ...override}`, the
      // override wins), so anything injected here would clobber the ids of the
      // whole chapter. Leave it alone and let the imported slides speak.
      if (frontmatter.src)
        return undefined

      const id = assigner.next(content, frontmatter)
      delete frontmatter.id
      frontmatter['data-profile-id'] = id
      // A stamped id says nothing about where the slide lives, so the chapter
      // travels separately. The editor groups by it.
      frontmatter['data-profile-chapter'] = assigner.file()

      if (hidden.has(id)) {
        if (shouldHide)
          frontmatter.hide = true
        else
          frontmatter['data-profile-off'] = true
      }
      return undefined
    },
  }]
}
