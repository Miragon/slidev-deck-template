<script setup lang="ts">
/**
 * Two jobs in one layer: the safety net under the navigation, and the editor.
 *
 * Safety net. The patched shortcuts only cover key presses. A direct URL, the
 * goto dialog, a click on an overview card and the browser's back button all
 * change the slide without going through them, so a watcher moves on from a
 * switched-off slide in the direction of travel. It runs `immediate`, because
 * without that a deck opened directly on a switched-off slide just sits there
 * behind the cover. The one frame where the slide is still visible is hidden by
 * an opaque cover.
 *
 * Both must be inert while printing. `GlobalTop` is rendered by
 * `PrintSlideClick` as well, and a watcher that navigates during
 * `slidev export --per-slide` makes the export time out waiting for a slide
 * element that is no longer there.
 */
import { useNav } from '@slidev/client'
import { computed, onMounted, ref, watch } from 'vue'
import {
  dirty,
  drift,
  editable,
  editorOpen,
  hiddenCount,
  hiddenIds,
  initFromSlides,
  isHidden,
  isSlideOff,
  ensureLoaded,
  ready,
  save,
  saveError,
  saveState,
  slideChapter,
  slideId,
  slideTitle,
  speaker,
  toggle,
} from './state'

const nav = useNav()

initFromSlides(nav.slides.value)
onMounted(ensureLoaded)

const currentIds = computed(() => nav.slides.value.map(route => slideId(route)).filter(Boolean) as string[])
const currentIsOff = computed(() => ready.value && !nav.isPrintMode.value && isSlideOff(nav.slides.value, nav.currentSlideNo.value))

/**
 * Editing means the play view with the controls on screen. The presenter window
 * is presenting even when the editor is unlocked, so it keeps skipping - you
 * rehearse the cut you are going to hold.
 *
 * MUST be declared before the watcher below: that watcher runs `immediate`, so
 * its callback reads `editing.value` during setup. A `const` declared after it
 * is in the temporal dead zone and throws `Cannot access 'editing' before
 * initialization` - which crashes GlobalTop's setup on the browser exporter
 * (/export), where the watcher fires with `ready` already true, so every slide
 * fails to render and the PPTX/PDF capture freezes on the first slide.
 */
const editing = computed(() => editable.value && nav.isPlaying.value)

watch([() => nav.currentSlideNo.value, ready], ([no, isReady]) => {
  // While editing, navigation stays exactly as it is. Skipping here would make
  // a switched-off slide unreachable: you could never walk back onto it to turn
  // it on again. The red frame says what is off; `npm run dev` does the skipping.
  if (!isReady || editing.value || nav.isPrintMode.value)
    return
  if (!isSlideOff(nav.slides.value, no))
    return
  const step = nav.navDirection.value >= 0 ? 1 : -1
  let target = no + step
  while (target >= 1 && target <= nav.slides.value.length && isSlideOff(nav.slides.value, target))
    target += step
  if (target >= 1 && target <= nav.slides.value.length)
    nav.go(target)
}, { flush: 'post', immediate: true })

const currentId = computed(() => slideId(nav.slides.value[nav.currentSlideNo.value - 1]))
const onCount = computed(() => nav.slides.value.length - hiddenCount.value)

/**
 * The quick way: switch the slide you are looking at on or off without opening
 * the panel. It writes the profile straight away, because a single deliberate
 * click should not need a second one to stick.
 *
 * Toggling the current slide off does NOT jump away: the watcher only reacts to
 * a change of slide, so you keep looking at what you just switched off and can
 * undo it. The skip happens the next time you navigate onto it.
 */
async function toggleCurrent() {
  if (!currentId.value)
    return
  toggle(currentId.value)
  await save(currentIds.value)
}

const chapters = computed(() => {
  const groups: { name: string, slides: { no: number, id: string, title: string, off: boolean }[] }[] = []
  for (const route of nav.slides.value) {
    const id = slideId(route)
    if (!id)
      continue
    const name = slideChapter(route)
    let group = groups.at(-1)
    if (!group || group.name !== name) {
      group = { name, slides: [] }
      groups.push(group)
    }
    group.slides.push({ no: route.no, id, title: slideTitle(route), off: isHidden(id) })
  }
  return groups
})

const changes = computed(() => drift(currentIds.value))

/**
 * The slides that appeared since this profile was last saved, by name.
 *
 * A count alone leaves the speaker to hunt for them. With stamped ids "new"
 * finally means new - a retitled slide keeps its id and no longer shows up here
 * - so the list is worth acting on directly.
 */
const addedSlides = computed(() => {
  const added = new Set(changes.value.added)
  return nav.slides.value
    .filter(route => added.has(slideId(route) ?? ''))
    .map(route => ({ no: route.no, title: slideTitle(route), chapter: slideChapter(route) }))
})

function hideAllNew() {
  const next = new Set(hiddenIds.value)
  for (const id of changes.value.added)
    next.add(id)
  hiddenIds.value = next
  dirty.value = true
}

/**
 * The same news in the presenting view, where there is no panel to open.
 *
 * Only in dev (the state endpoint is what tells us there is drift at all), only
 * when something actually changed, and it takes itself off screen again: this
 * window is the one the room looks at.
 */
const noticeDismissed = ref(false)
const showNotice = computed(() =>
  ready.value
  && !editing.value
  && !nav.isPrintMode.value
  && !noticeDismissed.value
  && !!speaker.value
  && changes.value.added.length > 0,
)
watch(showNotice, (visible) => {
  if (visible)
    setTimeout(() => { noticeDismissed.value = true }, 12000)
})

function toggleChapter(name: string, off: boolean) {
  const next = new Set(hiddenIds.value)
  for (const group of chapters.value) {
    if (group.name !== name)
      continue
    for (const slide of group.slides)
      off ? next.add(slide.id) : next.delete(slide.id)
  }
  hiddenIds.value = next
}

function goTo(no: number) {
  editorOpen.value = false
  nav.go(no)
}
</script>

<template>
  <!-- presenting: cover the frame between landing on a switched-off slide and moving on -->
  <div v-if="currentIsOff && !editing" class="sp-veil" data-testid="speaker-profiles-veil" />

  <!-- presenting: the deck grew since this profile was last saved -->
  <div v-if="showNotice" class="sp-notice" data-testid="speaker-profiles-notice">
    <strong>{{ changes.added.length }} new slide(s)</strong> since your last selection, switched on.
    Review them with <code>npm run dev:profile</code>.
    <button class="sp-notice-close" title="Dismiss" @click="noticeDismissed = true">
      ×
    </button>
  </div>

  <template v-if="editing && !nav.isPrintMode.value">
    <!-- editing: the slide stays readable, but it is unmistakably off -->
    <div v-if="currentIsOff" class="sp-off-frame" data-testid="speaker-profiles-off-frame">
      <span class="sp-off-badge">OFF</span>
    </div>

    <div v-if="!editorOpen" class="sp-cluster">
      <button
        class="sp-chip"
        :class="{ 'sp-chip-on': currentIsOff }"
        :disabled="!currentId || saveState === 'saving'"
        :title="currentIsOff ? 'Put this slide back into your deck' : 'Drop this slide from your deck'"
        data-testid="speaker-profiles-toggle-current"
        @click="toggleCurrent"
      >
        <span class="sp-chip-dot" />
        {{ currentIsOff ? 'Show this slide' : 'Hide this slide' }}
      </button>
      <button class="sp-chip sp-chip-quiet" title="Speaker profile" @click="editorOpen = true">
        {{ speaker }} · {{ onCount }}/{{ nav.slides.value.length }}
      </button>
    </div>

    <div v-if="editorOpen" class="sp-panel" data-testid="speaker-profiles-editor">
      <header class="sp-head">
        <div>
          <strong>Speaker profile: {{ speaker }}</strong>
          <div class="sp-sub">
            {{ nav.slides.value.length - hiddenCount }} of {{ nav.slides.value.length }} slides on
          </div>
        </div>
        <div class="sp-actions">
          <span v-if="dirty && saveState !== 'saving'" class="sp-note sp-warn">unsaved</span>
          <span v-if="saveState === 'saving'" class="sp-note">saving…</span>
          <span v-else-if="saveState === 'saved'" class="sp-note sp-ok">saved</span>
          <span v-else-if="saveState === 'error'" class="sp-note sp-err">{{ saveError }}</span>
          <button class="sp-btn sp-primary" @click="save(currentIds)">
            Save profile
          </button>
          <button class="sp-btn" @click="editorOpen = false">
            Close
          </button>
        </div>
      </header>

      <div v-if="changes.added.length" class="sp-drift">
        <div class="sp-drift-head">
          <span>
            {{ changes.added.length }} new slide(s) since your last change.
            New slides are on by default.
          </span>
          <button v-if="changes.added.length" class="sp-btn" @click="hideAllNew">
            Hide all new
          </button>
        </div>
        <ul v-if="addedSlides.length" class="sp-drift-list">
          <li v-for="slide in addedSlides" :key="slide.no">
            <button class="sp-link" @click="goTo(slide.no)">{{ slide.no }}</button>
            <span class="sp-drift-chapter">{{ slide.chapter }}</span>
            {{ slide.title }}
          </li>
        </ul>
      </div>

      <div class="sp-body">
        <section v-for="group in chapters" :key="group.name" class="sp-chapter">
          <div class="sp-chapter-head">
            <span>{{ group.name }}</span>
            <span class="sp-chapter-actions">
              <button class="sp-link" @click="toggleChapter(group.name, false)">all on</button>
              <button class="sp-link" @click="toggleChapter(group.name, true)">all off</button>
            </span>
          </div>
          <label
            v-for="slide in group.slides"
            :key="slide.id"
            class="sp-row"
            :class="{ 'sp-row-off': slide.off, 'sp-row-current': slide.no === nav.currentSlideNo.value }"
          >
            <input type="checkbox" :checked="!slide.off" @change="toggle(slide.id)">
            <span class="sp-no" @click.prevent="goTo(slide.no)">{{ slide.no }}</span>
            <span class="sp-title">{{ slide.title }}</span>
          </label>
        </section>
      </div>
    </div>
  </template>
</template>

<style>
.sp-veil {
  position: absolute;
  inset: 0;
  z-index: 2000;
  background: var(--slidev-theme-background, #fff);
}

.sp-off-frame {
  position: absolute;
  inset: 0;
  z-index: 1900;
  pointer-events: none;
  border: 4px solid rgba(255, 107, 107, 0.85);
}

.sp-off-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.2rem 0.6rem;
  font: 700 0.7rem/1.4 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.16em;
  color: #fff;
  background: rgba(255, 107, 107, 0.92);
}

.sp-cluster {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  z-index: 2100;
  display: flex;
  gap: 0.4rem;
}

.sp-chip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.75rem;
  font: 0.78rem/1.2 ui-sans-serif, system-ui, sans-serif;
  color: #f4f4f6;
  background: rgba(20, 20, 28, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  cursor: pointer;
}

.sp-chip:disabled { opacity: 0.45; cursor: default; }
.sp-chip-quiet { opacity: 0.8; }

.sp-chip-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: #ff6b6b;
}

.sp-chip-on .sp-chip-dot { background: #00e676; }

.sp-cluster button, .sp-panel, .sp-panel * {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}

.sp-panel {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  color: #ececf1;
  background: rgba(14, 14, 20, 0.97);
}

.sp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.sp-sub { font-size: 0.78rem; opacity: 0.65; }
.sp-actions { display: flex; align-items: center; gap: 0.5rem; }
.sp-note { font-size: 0.75rem; opacity: 0.75; }
.sp-ok { color: #00e676; }
.sp-err { color: #ff6b6b; max-width: 22rem; }
.sp-warn { color: #ffd479; }

.sp-btn {
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
  color: inherit;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0.35rem;
  cursor: pointer;
}

.sp-primary { background: #335de5; border-color: #335de5; }

.sp-drift {
  padding: 0.55rem 1.2rem;
  font-size: 0.78rem;
  color: #ffd479;
  background: rgba(255, 212, 121, 0.09);
  border-bottom: 1px solid rgba(255, 212, 121, 0.2);
}

.sp-drift-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sp-drift-list {
  max-height: 7.5rem;
  margin: 0.4rem 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.sp-drift-list li {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.1rem 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sp-drift-chapter { opacity: 0.6; }

.sp-notice {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  z-index: 2100;
  max-width: 26rem;
  padding: 0.6rem 2.2rem 0.6rem 0.9rem;
  font: 0.78rem/1.45 ui-sans-serif, system-ui, sans-serif;
  color: #f4f4f6;
  background: rgba(20, 20, 28, 0.9);
  border: 1px solid rgba(255, 212, 121, 0.35);
  border-radius: 0.5rem;
}

.sp-notice code {
  padding: 0.05rem 0.3rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
}

.sp-notice-close {
  position: absolute;
  top: 0.15rem;
  right: 0.35rem;
  padding: 0.1rem 0.3rem;
  font-size: 1rem;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
  opacity: 0.6;
}

.sp-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.6rem 1.2rem 2rem;
  columns: 2;
  column-gap: 2.5rem;
}

.sp-chapter { break-inside: avoid-column; margin-bottom: 1.1rem; }

.sp-chapter-head {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.55;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sp-chapter-actions { display: flex; gap: 0.6rem; }

.sp-link {
  color: inherit;
  background: none;
  border: 0;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.sp-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.16rem 0;
  font-size: 0.82rem;
  cursor: pointer;
}

.sp-row-off .sp-title { opacity: 0.38; text-decoration: line-through; }
.sp-row-current { background: rgba(51, 93, 229, 0.22); border-radius: 0.25rem; }
.sp-no { min-width: 2.1rem; font-variant-numeric: tabular-nums; opacity: 0.5; text-align: right; }
.sp-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
