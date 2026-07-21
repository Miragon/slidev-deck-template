<script setup lang="ts">
/**
 * Agenda — the red thread at the chapter level (STATIC world, no shader).
 *
 * A clickable stepper across the deck's chapters (numbered dots strung on one
 * continuous line, chapter labels centred above each dot); below it, the slides
 * of the selected chapter render as LIVE miniature previews (the same mechanism
 * the Slidev overview uses, not iframes or screenshots) and auto-fit the
 * remaining space, shrinking as a chapter holds more slides. Clicking a chapter
 * switches the preview; clicking a mini jumps to that slide. Because chapters
 * and slides are read from the live deck, the agenda updates itself.
 *
 * Chapters are discovered automatically: every `layout: section` slide starts a
 * chapter, and the slides up to the next section belong to it.
 *
 * Frontmatter / props:
 *   eyebrow — uppercase kicker (default "Agenda")
 *   title   — optional h2-level title
 *   accent  — "blue" | "green" | "mixed" (default mixed)
 */
import { computed, ref, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useNav } from '@slidev/client'
// The `.ts` extension is required for Vite to resolve these deep imports (the
// @slidev/client `exports` map is `"./*": "./*"`, which adds no extension), but
// tsc/Volar reject it without `allowImportingTsExtensions`; suppress there.
// @ts-ignore - .ts extension needed for Vite resolution, not for type-checking
import { createFixedClicks } from '@slidev/client/composables/useClicks.ts'
// @ts-ignore - .ts extension needed for Vite resolution, not for type-checking
import { CLICKS_MAX } from '@slidev/client/constants.ts'
import SlideContainer from '@slidev/client/internals/SlideContainer.vue'
import SlideWrapper from '@slidev/client/internals/SlideWrapper.vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    accent?: 'blue' | 'green' | 'mixed'
  }>(),
  { eyebrow: 'Agenda', accent: 'mixed' },
)

const { slides, go, currentPage } = useNav()

const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)

// Markdown bold (** **) survives into the auto-extracted title; strip it.
function clean(s?: string) {
  return (s ?? '').replace(/\*\*/g, '').trim()
}

interface Chapter {
  no: number
  eyebrow: string
  title: string
  routes: any[]
}

// Walk the deck once: each `layout: section` slide opens a chapter, every slide
// after it (until the next section) belongs to that chapter. Slides before the
// first section (cover, this agenda) are intentionally ignored.
const chapters = computed<Chapter[]>(() => {
  const out: Chapter[] = []
  // slides.value is typed loosely (SlideRoute's deep types don't resolve in the
  // editor), so annotate as any[] to read .meta/.no without TS2339.
  for (const route of slides.value as any[]) {
    const fm = route.meta?.slide?.frontmatter ?? {}
    if (fm.layout === 'section') {
      const n = out.length + 1
      out.push({
        no: route.no,
        eyebrow: clean(fm.eyebrow) || `Chapter ${n}`,
        title: clean(route.meta?.slide?.title) || clean(fm.eyebrow) || `Chapter ${n}`,
        routes: [route],
      })
    } else if (out.length) {
      out[out.length - 1].routes.push(route)
    }
  }
  return out
})

const selected = ref(0)

// Keep the selection valid and follow the live position: if the deck is on a
// slide that lives inside a chapter, preselect that chapter.
watch(
  [chapters, currentPage],
  ([chs, page]) => {
    if (selected.value >= chs.length) selected.value = 0
    const idx = chs.findIndex(
      (c, i) => page >= c.no && (i === chs.length - 1 || page < chs[i + 1].no),
    )
    if (idx >= 0) selected.value = idx
  },
  { immediate: true },
)

const activeChapter = computed(() => chapters.value[selected.value])

// A chapter of up to MAX_MINIS slides renders cleanly in the available height.
// ALL slides are always rendered, but the mini size is computed as if the
// chapter held at most MAX_MINIS: so the frame size never shrinks below the
// clean 21-slide size, and any slides past that simply extend below the fold,
// reachable by scrolling the preview.
const MAX_MINIS = 21

// Above five chapters the single row of labels crowds. Stagger them above/below
// the line (chapter 1 above, 2 below, ...) so each label only neighbours the one
// two steps away, which roughly doubles its horizontal breathing room.
const alternate = computed(() => chapters.value.length > 5)

// Geometry of the connecting thread: dots are centred in their equal columns,
// so the line runs from the first dot centre to the last, and the coloured fill
// reaches the selected dot.
const trackLeft = computed(() => `${50 / chapters.value.length}%`)
const trackWidth = computed(() => `${((chapters.value.length - 1) * 100) / chapters.value.length}%`)
const fillWidth = computed(() => `${(selected.value * 100) / chapters.value.length}%`)

// A mini renders at fixed clicks (fully revealed). Cache one context per route.
const clicksCtx = new WeakMap<object, ReturnType<typeof createFixedClicks>>()
function ctxFor(route: any) {
  if (!clicksCtx.has(route)) clicksCtx.set(route, createFixedClicks(route, CLICKS_MAX))
  return clicksCtx.get(route)!
}

// Auto-fit the minis into whatever space is left below the stepper: measure the
// stage, then pick the largest mini width whose grid (N items, 16:9) still fits
// both the width and the remaining height. More slides => more rows => smaller.
const stage = ref<HTMLElement | null>(null)
const { width: stageW, height: stageH } = useElementSize(stage)
const GAP = 16
const ASPECT = 16 / 9
const MAX_W = 320

const miniWidth = computed(() => {
  // Size as if the chapter held at most MAX_MINIS slides, so the frame never
  // shrinks below the clean 21-slide size; extra slides scroll below the fold.
  const n = Math.min(activeChapter.value?.routes.length ?? 0, MAX_MINIS)
  const W = stageW.value
  const H = stageH.value
  if (!n || W < 1 || H < 1) return 200
  let best = 0
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const w = (W - (cols - 1) * GAP) / cols
    const totalH = rows * (w / ASPECT) + (rows - 1) * GAP
    if (totalH <= H && w > best) best = w
  }
  if (!best) best = (W - (n - 1) * GAP) / n // never larger than one row across
  return Math.max(96, Math.min(best, MAX_W))
})

// After a click, drop focus off the <button> back to the document, otherwise the
// focused button swallows Slidev's arrow-key navigation and the next-slide key
// stops working until the user clicks the slide again.
function selectChapter(i: number, ev: MouseEvent) {
  selected.value = i
  ;(ev.currentTarget as HTMLElement | null)?.blur()
}
function openSlide(no: number, ev: MouseEvent) {
  ;(ev.currentTarget as HTMLElement | null)?.blur()
  go(no)
}
</script>

<template>
  <div class="agenda-layout" :style="{ '--ag-grad': gradientVar, '--ag-accent': accentVar }">
    <div class="agenda-inner">
      <header class="agenda-head">
        <span class="agenda-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="agenda-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="agenda-title">{{ title }}</h2>
      </header>

      <!-- Stepper: labels centred above numbered dots strung on one line. -->
      <nav class="agenda-stepper" :class="{ 'is-alternating': alternate }" aria-label="Chapters">
        <div class="track" aria-hidden="true">
          <span class="track-line" :style="{ left: trackLeft, width: trackWidth }"></span>
          <span class="track-fill" :style="{ left: trackLeft, width: fillWidth }"></span>
        </div>
        <button
          v-for="(ch, i) in chapters"
          :key="ch.no"
          type="button"
          class="step"
          :class="{ 'is-active': i === selected, 'is-done': i < selected, 'label-below': alternate && i % 2 === 1 }"
          @click="selectChapter(i, $event)"
        >
          <span class="step-meta">
            <span class="step-eyebrow">{{ ch.eyebrow }}</span>
            <span class="step-label">{{ ch.title }}</span>
          </span>
          <span class="step-dot"><span class="step-num">{{ i + 1 }}</span></span>
        </button>
      </nav>

      <!-- Preview: the selected chapter's slides as live miniatures, auto-fit. -->
      <div class="agenda-preview">
        <div ref="stage" class="preview-stage">
          <transition name="fade-preview" mode="out-in">
            <div :key="selected" class="preview-row">
              <button
                v-for="route in activeChapter?.routes"
                :key="route.no"
                type="button"
                class="mini"
                :style="{ width: `${miniWidth}px` }"
                :title="`Go to slide ${route.no}`"
                @click="openSlide(route.no, $event)"
              >
                <SlideContainer :width="miniWidth" class="mini-frame">
                  <SlideWrapper :clicks-context="ctxFor(route)" :route="route" render-context="overview" />
                </SlideContainer>
                <span class="mini-no">{{ route.no }}</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agenda-layout {
  /* Declared so the custom properties resolve statically (linter + fallback);
     the inline :style binding on this element overrides them at runtime. */
  --ag-grad: var(--miragon-gradient-mixed);
  --ag-accent: var(--miragon-blue);
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}
.agenda-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 76rem;
  margin: 0 auto;
  padding: 2.4rem 3.6rem 2.1rem;
  display: flex;
  flex-direction: column;
}

.agenda-head {
  flex: 0 0 auto;
  margin-bottom: 1.4rem;
}
.agenda-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--ag-grad);
  margin-bottom: 0.85rem;
}
.agenda-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ag-accent);
  margin-bottom: 0.5rem;
}
.agenda-title {
  font-size: clamp(1.6rem, 2.6vw, 2.1rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

/* ---- Stepper ------------------------------------------------------------ */
.agenda-stepper {
  position: relative;
  flex: 0 0 auto;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  align-items: end;
  margin-bottom: 1.5rem;
}
/* the one continuous thread, drawn through the dot centres */
.track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1.1rem; /* == dot radius, so the line runs through the dots */
  height: 0;
  z-index: 0;
}
.track-line,
.track-fill {
  position: absolute;
  top: -0.09rem;
  height: 0.18rem;
  border-radius: 999px;
}
.track-line { background: #E2E6F0; }
.track-fill { background: var(--ag-accent); transition: width 320ms cubic-bezier(0.2, 0.7, 0.2, 1); }

.step {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.7rem;
  text-align: center;
  background: none;
  border: 0;
  padding: 0 0.5rem;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.step-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  max-width: 100%;
}
.step-eyebrow {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--miragon-text-muted);
  white-space: nowrap;
}
.step-label {
  font-size: 1.04rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--miragon-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: color 280ms ease;
}
.step.is-active .step-label { color: var(--ag-accent); }

.step-dot {
  position: relative;
  z-index: 1;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--miragon-white);
  border: 2px solid #E2E6F0;
  box-shadow: 0 4px 12px rgba(51, 93, 229, 0.08);
  transition: transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1), border-color 280ms ease, background 280ms ease;
}
.step-num {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--miragon-text-muted);
  transition: color 280ms ease;
}
.step.is-done .step-dot { border-color: var(--ag-accent); }
.step.is-done .step-num { color: var(--ag-accent); }
/* Solid accent fill, not the mixed gradient: on a small circle the blue->green
   gradient muddies into an ugly green corner. Flat fill, border matches the fill
   so no inner ring (no inset sheen) shows through. */
.step.is-active .step-dot {
  background: var(--ag-accent);
  border-color: var(--ag-accent);
  box-shadow: 0 6px 16px rgba(51, 93, 229, 0.28);
  transform: scale(1.1);
}
.step.is-active .step-num { color: var(--miragon-white); }

/* ---- Alternating labels (only above five chapters) ---------------------- */
/* One label row crowds past five chapters, so stagger labels above/below the
   line. Each step becomes a grid with FIXED, EQUAL top and bottom zones and the
   dot in the centre row, so every dot lands dead centre on the one line no
   matter which side carries the label. Labels are single-line (nowrap), so a
   fixed zone always fits eyebrow + title. */
.agenda-stepper.is-alternating {
  align-items: stretch;
}
/* Only the dot stays in flow (a fixed 2.2rem, far under a 1fr column), so the
   columns remain strictly equal and the dots are evenly spaced. Each label is
   taken OUT of flow (absolute) and centred on its own dot, above for odd
   chapters and below for even ones, so a wide label can never widen its column
   and throw the spacing off. */
.agenda-stepper.is-alternating .step {
  position: relative;
  min-width: 0;
  height: 8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
}
.agenda-stepper.is-alternating .step-meta {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  bottom: calc(50% + 1.7rem);
}
.agenda-stepper.is-alternating .step.label-below .step-meta {
  top: calc(50% + 1.7rem);
  bottom: auto;
  /* Flip eyebrow/title so the title sits next to the line and "Kapitel 0X" stays
     on the outer edge, mirroring the row above. */
  flex-direction: column-reverse;
}
/* Labels are centred on their dot and same-level neighbours are two steps apart,
   so show them at full width instead of clipping to one column. */
.agenda-stepper.is-alternating .step-label {
  overflow: visible;
  text-overflow: clip;
  max-width: none;
}
/* The thread runs through the vertically centred dots. */
.agenda-stepper.is-alternating .track {
  top: 50%;
  bottom: auto;
}

/* ---- Preview ------------------------------------------------------------ */
.agenda-preview {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.preview-stage {
  flex: 1 1 auto;
  min-height: 0;
  /* Safety net: minis are sized to fit up to MAX_MINIS within this height, but
     if a capped chapter still overflows (short viewport), scroll to reach the
     rest rather than clip or shrink them further. */
  overflow-y: auto;
}
.preview-row {
  min-height: 100%;
  display: flex;
  flex-wrap: wrap;
  /* `safe` centers when the minis fit, but falls back to top-alignment once the
     chapter overflows, so the first row never lands above the scroll origin
     (where it would be unreachable). */
  align-content: safe center;
  justify-content: center;
  gap: 16px;
}
.mini {
  position: relative;
  display: block;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  border-radius: 0.7rem;
  transition: transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.mini:hover { transform: translateY(-4px); }
.mini-frame {
  border-radius: 0.7rem;
  overflow: hidden;
  border: 1px solid #E5E7EB;
  box-shadow: 0 10px 24px rgba(51, 93, 229, 0.12);
  pointer-events: none;
  transition: border-color 280ms ease, box-shadow 280ms ease;
}
.mini:hover .mini-frame,
.mini:focus-visible .mini-frame {
  border-color: var(--ag-accent);
  box-shadow: 0 16px 34px rgba(51, 93, 229, 0.2);
}
.mini-frame :deep(*) { user-select: none; }
.mini:focus-visible { outline: none; }
.mini-no {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  display: inline-grid;
  place-items: center;
  min-width: 1.05rem;
  height: 1.05rem;
  padding: 0 0.28rem;
  border-radius: 0.35rem;
  background: rgba(15, 23, 42, 0.72);
  color: var(--miragon-white);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.fade-preview-enter-active,
.fade-preview-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.fade-preview-enter-from,
.fade-preview-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
