/**
 * The client-side truth while presenting and while editing.
 *
 * Initialised from the `data-profile-off` keys the preparser injected, then
 * owned by the editor: a toggle takes effect immediately (skip logic, greying
 * out) and is persisted to the profile file separately. That way editing does
 * not need a server restart per click, and the file stays the thing git tracks.
 */
import type { SlideRoute } from '@slidev/types'
import { computed, ref } from 'vue'

export const hiddenIds = ref<Set<string>>(new Set())
export const knownIds = ref<string[]>([])
export const speaker = ref<string | null>(null)
export const editable = ref(false)
export const editorOpen = ref(false)
export const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
/** Toggled but not written to the profile file yet. */
export const dirty = ref(false)
/**
 * True once we know where the selection comes from.
 *
 * `data-profile-off` is a snapshot from when the dev server parsed the deck, and
 * saving does not re-parse. So on a reload the frontmatter can be minutes out of
 * date, and the navigation watcher would skip slides the speaker has already
 * switched back on. Nothing navigates until the state endpoint has answered (or
 * failed, which is the built deck, where the selection is baked in anyway).
 */
export const ready = ref(false)
export const saveError = ref('')

let initialised = false

export function slideId(route?: SlideRoute): string | undefined {
  const value = (route?.meta?.slide?.frontmatter as any)?.['data-profile-id']
  return typeof value === 'string' ? value : undefined
}

export function slideTitle(route?: SlideRoute): string {
  return route?.meta?.slide?.title?.trim() || '(untitled)'
}

/**
 * Which chapter file a slide came from, for the editor's grouping.
 *
 * A stamped id (`s-29076475`) carries no chapter, so the preparser sends it
 * along separately. The slash form is the fallback id of a slide written since
 * the last stamp run.
 */
export function slideChapter(route?: SlideRoute): string {
  const frontmatter = route?.meta?.slide?.frontmatter as any
  const chapter = frontmatter?.['data-profile-chapter']
  if (typeof chapter === 'string' && chapter)
    return chapter
  const id = slideId(route)
  const slash = id?.indexOf('/') ?? -1
  return slash === -1 ? 'unknown' : id!.slice(0, slash)
}

export function initFromSlides(slides: SlideRoute[]) {
  if (initialised)
    return
  initialised = true
  const off = new Set<string>()
  for (const route of slides) {
    const id = slideId(route)
    if (id && (route.meta?.slide?.frontmatter as any)?.['data-profile-off'])
      off.add(id)
  }
  hiddenIds.value = off
  dirty.value = false
}

export function isHidden(id: string | undefined) {
  return !!id && hiddenIds.value.has(id)
}

export function isSlideOff(slides: SlideRoute[], no: number) {
  return isHidden(slideId(slides[no - 1]))
}

export function toggle(id: string) {
  const next = new Set(hiddenIds.value)
  if (next.has(id))
    next.delete(id)
  else
    next.add(id)
  hiddenIds.value = next
  dirty.value = true
}

export const hiddenCount = computed(() => hiddenIds.value.size)

/**
 * Drift against the profile's `knownIds`: unknown means visible, so a slide
 * added on main shows up for every speaker instead of silently disappearing.
 *
 * Only additions. A deck can be run in pieces - the developer trainings have a
 * separate entry per chapter - and "gone" would then mean "not in this chapter",
 * which is true and useless. Ids that vanished are never dropped from `hidden`
 * either: the slide may come back on another branch.
 */
export function drift(currentIds: string[]) {
  if (!knownIds.value.length)
    return { added: [] }
  const known = new Set(knownIds.value)
  return { added: currentIds.filter(id => !known.has(id)) }
}

/**
 * In dev the profile FILE is the truth, not the frontmatter.
 *
 * `data-profile-off` is decided while parsing, so it is a snapshot from the
 * moment the dev server started. Saving changes the file but does not re-parse
 * the deck, so after a reload the frontmatter is stale. Seeding the client from
 * it would show slides as on that were switched off minutes ago - and the next
 * save would write that stale picture back and quietly undo the earlier work.
 * So whenever the endpoint answers, its profile wins over the frontmatter.
 */
export async function loadServerState() {
  // A built deck has no dev server and therefore no endpoint. Asking anyway
  // costs every viewer a 404 on every load, and any tool that treats a failed
  // request as a defect reports it - the BPM training's hub check flagged all
  // 14 of its decks. The selection is baked into the frontmatter at build time,
  // which is all a built deck needs.
  if (!import.meta.env.DEV) {
    ready.value = true
    return
  }
  try {
    const res = await fetch('/@speaker-profiles/state')
    if (!res.ok)
      return
    const data = await res.json()
    editable.value = !!data.editable
    speaker.value = data.speaker ?? null
    knownIds.value = data.profile?.knownIds ?? []
    if (data.profile) {
      hiddenIds.value = new Set<string>(data.profile.hidden ?? [])
      dirty.value = false
    }
  }
  catch {
    // built deck: no dev server, no editing. The selection is already baked in,
    // and the frontmatter seeded by initFromSlides is all there is.
  }
  finally {
    ready.value = true
  }
}

let loading: Promise<void> | undefined

/**
 * `/overview/` is its own page and does not render GlobalTop, so nothing there
 * would ever fetch the profile and every card would look switched on. Any
 * consumer can call this; the fetch happens once per window.
 */
export function ensureLoaded() {
  loading ??= loadServerState()
  return loading
}

export async function save(currentIds: string[]) {
  if (!speaker.value)
    return
  saveState.value = 'saving'
  saveError.value = ''
  try {
    const res = await fetch('/@speaker-profiles/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        speaker: speaker.value,
        hidden: [...hiddenIds.value],
        order: null,
        // Additive, never a replacement. Saving from a single-chapter run must
        // not shrink what this profile has already seen, or every slide of the
        // other chapters would count as new the next time the whole deck runs.
        knownIds: [...new Set([...knownIds.value, ...currentIds])],
      }),
    })
    const data = await res.json()
    if (!res.ok)
      throw new Error(data?.error ?? `HTTP ${res.status}`)
    knownIds.value = data.profile.knownIds
    dirty.value = false
    saveState.value = 'saved'
    setTimeout(() => { if (saveState.value === 'saved') saveState.value = 'idle' }, 2000)
  }
  catch (error: any) {
    saveState.value = 'error'
    saveError.value = String(error?.message ?? error)
  }
}
