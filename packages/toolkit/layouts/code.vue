<script setup lang="ts">
/**
 * code — Slide centered on one code window (framed on-brand).
 *
 * The window holds one or several code fences from the DEFAULT slot. Several
 * fences become file tabs in the window's header; the active tab is Slidev's
 * per-slide click counter, so a tab click and advancing the slide (arrow keys /
 * space) are the same action.
 *
 * Frontmatter props:
 *   title    — slide title (h2-level)
 *   eyebrow  — uppercase kicker
 *   accent   — "blue" | "green" | "mixed" (default blue)
 *   files    — array of file names, one per fence in source order. They label
 *              the tabs (several fences) or the header (one fence).
 *   lang     — language badge on the right of the window header (e.g. "kotlin")
 * Slots:
 *   default     — the code fence(s), each one a tab of the window
 *   ::lead::    — optional text above the window
 *   ::caption:: — optional caption below the window
 */
import { Fragment, computed, onUnmounted, useSlots, watch, type VNode } from 'vue'
import { useNav, useSlideContext } from '@slidev/client'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    files?: string[]
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue', files: () => [] },
)

const title = computed(() => props.frontmatter?.title as string | undefined)
const lang = computed(() => props.frontmatter?.lang as string | undefined)
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
// Textakzent ist immer das Marken-Blau. Grün erreicht auf hellem Grund keinen
// AA-Kontrast (#00E676 = 1.67:1) und bleibt deshalb Flächen- und
// Grafikakzent, getragen vom Gradient-Token.
const accentVar = 'var(--miragon-blue)'

// Slidev compiles each fence to a component; the whitespace between fences
// arrives as text nodes, which are not tabs.
const slots = useSlots()
function componentVNodes(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) =>
    node.type === Fragment ? componentVNodes(node.children as VNode[]) : typeof node.type === 'object' ? [node] : [],
  )
}
const fences = computed(() => componentVNodes(slots.default?.() ?? []))
const hasTabs = computed(() => fences.value.length > 1)

const { $clicks, $clicksContext } = useSlideContext()
const { currentPage, go } = useNav()

// Register `fences.length - 1` click steps so the slide only advances past the
// last tab, without the author declaring `clicks:` in frontmatter.
const steps = computed(() => Math.max(0, fences.value.length - 1))
const CLICK_KEY = Symbol('code')
watch(steps, (max) => $clicksContext.register(CLICK_KEY, { delta: 0, max }), { immediate: true })
onUnmounted(() => $clicksContext.unregister(CLICK_KEY))

const selected = computed(() => Math.min(Math.max($clicks.value, 0), steps.value))

// Route the tab click through Slidev's own nav so mouse and keyboard share one
// state. Blur afterwards: a focused tab swallows the arrow keys.
function select(i: number, e: MouseEvent) {
  go(currentPage.value, i)
  ;(e.currentTarget as HTMLElement | null)?.blur()
}
</script>

<template>
  <div class="code-layout" :style="{ '--cd-grad': gradientVar, '--cd-accent': accentVar }">
    <div class="code-inner">
      <header v-if="title || eyebrow" class="code-head">
        <span class="code-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="code-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="code-title">{{ title }}</h2>
      </header>

      <div v-if="$slots.lead" class="code-lead">
        <slot name="lead" />
      </div>

      <div class="code-window">
        <div v-if="hasTabs || files.length || lang" class="code-window-bar">
          <template v-if="hasTabs">
            <button
              v-for="(_, i) in fences"
              :key="i"
              type="button"
              class="code-tab"
              :class="{ 'is-active': i === selected }"
              @click="select(i, $event)"
            >
              {{ files[i] ?? i + 1 }}
            </button>
          </template>
          <span v-else-if="files.length" class="code-file">{{ files[0] }}</span>
          <span class="code-window-spacer" aria-hidden="true"></span>
          <span v-if="lang" class="code-lang">{{ lang }}</span>
        </div>
        <div class="code-panes">
          <div
            v-for="(fence, i) in fences"
            :key="i"
            class="code-pane"
            :class="{ 'is-active': i === selected }"
            :aria-hidden="i !== selected"
          >
            <component :is="fence" />
          </div>
        </div>
      </div>

      <div v-if="$slots.caption" class="code-caption">
        <slot name="caption" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.code-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 78rem;
  margin: 0 auto;
  padding: 2.5rem 4rem;
  display: flex;
  flex-direction: column;
}

.code-head {
  flex: 0 0 auto;
  margin-bottom: 1.25rem;
}
.code-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--cd-grad);
  margin-bottom: 0.9rem;
}
.code-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cd-accent);
  margin-bottom: 0.55rem;
}
.code-title {
  font-size: clamp(1.7rem, 2.7vw, 2.2rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.code-lead {
  flex: 0 0 auto;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  line-height: 1.55;
  color: var(--miragon-text-secondary);
}
.code-lead :deep(p) {
  margin: 0;
}
.code-lead :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}

.code-window {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0.6rem;
  border: 1px solid var(--miragon-border);
  background: var(--miragon-white);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--miragon-blue) 8%, transparent);
  overflow: hidden;
}
.code-window-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
  padding: 0 0.9rem 0 0.4rem;
  background: var(--miragon-gray-bg);
  border-bottom: 1px solid var(--miragon-border);
}
.code-window-spacer {
  flex: 1 1 auto;
}
.code-tab,
.code-file {
  font-family: var(--miragon-font-mono);
  font-size: 0.78rem;
  color: var(--miragon-text-muted);
  padding: 0.6rem 0.7rem;
}
.code-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.code-tab.is-active {
  color: var(--miragon-text-primary);
  font-weight: 600;
  background: var(--miragon-white);
  border-bottom-color: var(--cd-accent);
}
.code-tab:focus-visible {
  outline: 2px solid var(--cd-accent);
  outline-offset: -2px;
}
.code-lang {
  align-self: center;
  font-family: var(--miragon-font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--miragon-blue-dark);
  background: var(--miragon-blue-light);
  border-radius: 0.35rem;
  padding: 0.1rem 0.45rem;
}

/* Alle Fences liegen im selben Grid-Feld: das Fenster behält beim Tab-Wechsel
   seine Größe, sichtbar ist nur der aktive. */
.code-panes {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  padding: 0.4rem 0;
}
.code-pane {
  grid-area: 1 / 1;
  min-width: 0;
  visibility: hidden;
}
.code-pane.is-active {
  visibility: visible;
}
/* Shiki-Fence: Rahmen aus code.css zurücksetzen, das Fenster besitzt ihn. */
.code-pane :deep(.slidev-code) {
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  padding-block: 0.5rem;
  background: transparent;
}

.code-caption {
  flex: 0 0 auto;
  margin-top: 1rem;
  font-size: 0.95rem;
  color: var(--miragon-text-muted);
  text-align: center;
}
.code-caption :deep(p) {
  margin: 0;
  line-height: 1.5;
}
.code-lead :deep(a),
.code-caption :deep(a) {
  color: var(--cd-accent);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}
.code-lead :deep(:not(pre) > code),
.code-caption :deep(:not(pre) > code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}

@media (prefers-reduced-motion: reduce) {
  .code-tab {
    transition: none;
  }
}
</style>
