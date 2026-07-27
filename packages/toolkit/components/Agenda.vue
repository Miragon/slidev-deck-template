<script setup lang="ts">
/**
 * Agenda — a clickable chapter stepper over the live deck.
 *
 * Chapters are discovered automatically: every `layout: section` slide opens a
 * chapter, the slides up to the next section belong to it. Up to six chapters the
 * rail is one row with each chapter's slides as live miniature previews below.
 * Past six the rail WRAPS into balanced rows and drops the previews, becoming a
 * static, top-aligned overview.
 *
 * Props: eyebrow (kicker, default "Agenda"), title (h2), accent (blue|green|mixed).
 */
import { computed, ref, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useNav } from '@slidev/client'
// The `.ts` extension is required for Vite to resolve these deep imports, but
// tsc/Volar reject it without `allowImportingTsExtensions`, so suppress there.
// @ts-ignore
import { createFixedClicks } from '@slidev/client/composables/useClicks.ts'
// @ts-ignore
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

const chapters = computed<Chapter[]>(() => {
  const out: Chapter[] = []
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

// Follow the live position: preselect the chapter holding the current slide.
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

// Mini size is computed as if a chapter held at most this many slides, so the
// frame never shrinks below the clean size; extra slides scroll below the fold.
const MAX_MINIS = 21

// Above five chapters one label row crowds, so stagger labels above/below the line.
const alternate = computed(() => chapters.value.length > 5)

// Past six chapters the labels no longer fit one row: wrap the dots into balanced
// rows (max five each) and drop the previews for a static, top-aligned overview.
const WRAP_THRESHOLD = 6
const MAX_PER_ROW = 5
const wrap = computed(() => chapters.value.length > WRAP_THRESHOLD)

interface StepRow { items: Chapter[]; start: number; cols: number }
// Balanced rows sharing one column count so dots align into a grid: 8->4+4, 7->4+3.
const rows = computed<StepRow[]>(() => {
  const chs = chapters.value
  const rowCount = Math.max(1, Math.ceil(chs.length / MAX_PER_ROW))
  const cols = Math.max(1, Math.ceil(chs.length / rowCount))
  const out: StepRow[] = []
  for (let i = 0; i < chs.length; i += cols) out.push({ items: chs.slice(i, i + cols), start: i, cols })
  return out
})

// The chapter holding the current slide (-1 before the first chapter).
const currentIndex = computed(() =>
  chapters.value.findIndex(
    (c, i) =>
      currentPage.value >= c.no &&
      (i === chapters.value.length - 1 || currentPage.value < chapters.value[i + 1].no),
  ),
)

// Per-row thread geometry: line through the row's dot centres, fill up to current.
function rowTrackLeft(row: StepRow) { return `${50 / row.cols}%` }
function rowTrackWidth(row: StepRow) { return `${((row.items.length - 1) * 100) / row.cols}%` }
function rowFillWidth(row: StepRow) {
  const seg = Math.max(0, Math.min(currentIndex.value - row.start, row.items.length - 1))
  return `${(seg * 100) / row.cols}%`
}

// Single-row thread geometry: line from first to last dot centre, fill to selected.
const trackLeft = computed(() => `${50 / chapters.value.length}%`)
const trackWidth = computed(() => `${((chapters.value.length - 1) * 100) / chapters.value.length}%`)
const fillWidth = computed(() => `${(selected.value * 100) / chapters.value.length}%`)

const clicksCtx = new WeakMap<object, ReturnType<typeof createFixedClicks>>()
function ctxFor(route: any) {
  if (!clicksCtx.has(route)) clicksCtx.set(route, createFixedClicks(route, CLICKS_MAX))
  return clicksCtx.get(route)!
}

// Pick the largest mini width whose grid (N items, 16:9) fits the leftover space.
const stage = ref<HTMLElement | null>(null)
const { width: stageW, height: stageH } = useElementSize(stage)
const GAP = 16
const ASPECT = 16 / 9
const MAX_W = 320

const miniWidth = computed(() => {
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
  if (!best) best = (W - (n - 1) * GAP) / n
  return Math.max(96, Math.min(best, MAX_W))
})

// Blur after a click so the button stops swallowing Slidev's arrow-key navigation.
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

      <!-- Many chapters: wrapped rows, top-aligned, static (no previews to navigate). -->
      <nav v-if="wrap" class="agenda-stepper is-wrap" aria-label="Chapters">
        <div v-for="(row, r) in rows" :key="r" class="stepper-row" :style="{ '--cols': row.cols }">
          <div class="track" aria-hidden="true">
            <span class="track-line" :style="{ left: rowTrackLeft(row), width: rowTrackWidth(row) }"></span>
            <span class="track-fill" :style="{ left: rowTrackLeft(row), width: rowFillWidth(row) }"></span>
          </div>
          <div
            v-for="(ch, i) in row.items"
            :key="ch.no"
            class="step is-static"
            :class="{ 'is-active': row.start + i === currentIndex, 'is-done': row.start + i < currentIndex }"
          >
            <span class="step-meta">
              <span class="step-eyebrow">{{ ch.eyebrow }}</span>
              <span class="step-label">{{ ch.title }}</span>
            </span>
            <span class="step-dot"><span class="step-num">{{ row.start + i + 1 }}</span></span>
          </div>
        </div>
      </nav>

      <!-- Up to six chapters: one clickable row that drives the previews below. -->
      <nav v-else class="agenda-stepper" :class="{ 'is-alternating': alternate }" aria-label="Chapters">
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

      <div v-if="!wrap" class="agenda-preview">
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
  /* Fallback for the linter; the inline :style binding overrides at runtime. */
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
/* Flat accent fill (a gradient muddies into green on a small circle). */
.step.is-active .step-dot {
  background: var(--ag-accent);
  border-color: var(--ag-accent);
  box-shadow: 0 6px 16px rgba(51, 93, 229, 0.28);
  transform: scale(1.1);
}
.step.is-active .step-num { color: var(--miragon-white); }

/* ---- Alternating labels (above five chapters) --------------------------- */
/* Dot stays in flow so columns stay equal; each label is absolute and centred on
   its dot, above for odd chapters and below for even, so a wide label can't widen
   its column. Labels are single-line, so the fixed zone always fits them. */
.agenda-stepper.is-alternating {
  align-items: stretch;
}
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
  flex-direction: column-reverse;
}
.agenda-stepper.is-alternating .step-label {
  overflow: visible;
  text-overflow: clip;
  max-width: none;
}
.agenda-stepper.is-alternating .track {
  top: 50%;
  bottom: auto;
}

/* ---- Wrapping rail (above six chapters, no previews) -------------------- */
/* Each row is its own grid with its own thread, so the line never bridges a wrap.
   Top-aligned to hug the head instead of floating in whitespace. */
.agenda-stepper.is-wrap {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 2.8rem;
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 0;
}
.is-wrap .step.is-static { cursor: default; }
.stepper-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  align-items: end;
}
/* Reserved height so two-line labels bottom-align and every dot lands on the line. */
.is-wrap .step-meta {
  min-height: 3.4rem;
  justify-content: flex-end;
}
.is-wrap .step-label {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.2;
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
  overflow-y: auto; /* scroll to reach the rest if a capped chapter overflows */
}
.preview-row {
  min-height: 100%;
  display: flex;
  flex-wrap: wrap;
  /* `safe` centers when minis fit, else top-aligns so the first row stays reachable. */
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
