<script setup lang="ts">
/**
 * window — Slide centered on one framed window with tabs (code or diagrams).
 *
 * The window holds one or several tabs from the DEFAULT slot: each code fence
 * and each other component is one tab, in source order. Several tabs show a
 * tab bar in the window's header; the active tab is Slidev's per-slide click
 * counter, so a tab click and advancing the slide (arrow keys / space) are the
 * same action.
 *
 * Frontmatter props:
 *   title    — slide title (h2-level)
 *   eyebrow  — uppercase kicker
 *   accent   — "blue" | "green" | "mixed" (default blue)
 *   tabs     — array of `{ label, icon?, caption?, lang? }`, one per tab in
 *              source order:
 *              `label`   — the tab's name in the header
 *              `icon`    — Lucide Iconify class before the label, or false for
 *                          none. Default: by tab kind, see TAB_ICONS.
 *              `caption` — line below the window while this tab is active;
 *                          inline Markdown (bold, italic, code, links)
 *              `lang`    — language badge on the right of the header while
 *                          this tab is active (e.g. "kotlin")
 * Slots:
 *   default     — the tabs: code fences, <Figure>, a mermaid fence, or a
 *                 diagram from slidev-addon-diagram-js (<Bpmn>, <DmnTable>, ...).
 *                 Anything but a code fence is centred as a visual.
 *   ::lead::    — optional text above the window, for the whole slide
 *   ::caption:: — optional caption below the window for every tab without a
 *                 `caption` of its own
 */
import { Fragment, cloneVNode, computed, onUnmounted, useSlots, watch, type VNode } from 'vue'
import { useNav, useSlideContext } from '@slidev/client'
import { inlineMarkdown } from '../utils/inlineMarkdown'

interface Tab {
  label?: string
  icon?: string | false
  caption?: string
  lang?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    tabs?: Tab[]
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue', tabs: () => [] },
)

const title = computed(() => props.frontmatter?.title as string | undefined)
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
const panes = computed(() => componentVNodes(slots.default?.() ?? []))
const hasTabBar = computed(() => panes.value.length > 1)

const CODE_COMPONENTS = ['CodeBlockWrapper', 'ShikiMagicMove']
// Matched by component-name prefix, so the viewer, simulation and modeler of
// one notation share an icon. Names are slidev-addon-diagram-js' public API.
const TAB_ICONS: [prefix: string, icon: string][] = [
  ['Bpmn', 'i-lucide-workflow'],
  ['Dmn', 'i-lucide-table'],
  ['TeamTopologies', 'i-lucide-users'],
  ['WardleyMap', 'i-lucide-map'],
  ['EventStorming', 'i-lucide-sticky-note'],
]

function componentName(node: VNode) {
  const type = node.type as { __name?: string; name?: string }
  return type.__name ?? type.name ?? ''
}
function isVisual(node: VNode) {
  return !CODE_COMPONENTS.includes(componentName(node))
}
function defaultIcon(node: VNode) {
  if (!isVisual(node)) return 'i-lucide-file-code'
  const name = componentName(node)
  return TAB_ICONS.find(([prefix]) => name.startsWith(prefix))?.[1] ?? 'i-lucide-file-image'
}
// A diagram whose height defaults to "auto" (the slidev-addon-diagram-js
// viewers) would grow past the window, so it fills the window instead, unless
// the author set a height. One with a fixed default, such as <DmnSimulate>,
// keeps it; a <Figure> sizes itself.
function fitted(node: VNode) {
  const heightProp = (node.type as { props?: { height?: { default?: unknown } } }).props?.height
  const growsUnbounded = heightProp?.default === 'auto' && node.props?.height == null
  return isVisual(node) && growsUnbounded ? cloneVNode(node, { height: '100%' }) : node
}

function iconFor(i: number) {
  const icon = props.tabs[i]?.icon
  if (icon === false) return undefined
  return icon ?? defaultIcon(panes.value[i])
}
function labelFor(i: number) {
  return props.tabs[i]?.label ?? (hasTabBar.value ? String(i + 1) : undefined)
}

const { $clicks, $clicksContext } = useSlideContext()
const { currentPage, go } = useNav()

// Register `panes.length - 1` click steps so the slide only advances past the
// last tab, without the author declaring `clicks:` in frontmatter.
const steps = computed(() => Math.max(0, panes.value.length - 1))
const CLICK_KEY = Symbol('window')
watch(steps, (max) => $clicksContext.register(CLICK_KEY, { delta: 0, max }), { immediate: true })
onUnmounted(() => $clicksContext.unregister(CLICK_KEY))

const selected = computed(() => Math.min(Math.max($clicks.value, 0), steps.value))
const activeLang = computed(() => props.tabs[selected.value]?.lang)

// Every caption sits in one grid cell, so the area keeps the height of the
// tallest one and nothing jumps when the tab changes.
const captions = computed(() =>
  panes.value.map((_, i) => props.tabs[i]?.caption).map((caption) => (caption ? inlineMarkdown(caption) : undefined)),
)
const hasCaptionArea = computed(() => !!slots.caption || captions.value.some(Boolean))
const showsSharedCaption = computed(() => !captions.value[selected.value])

// Route the tab click through Slidev's own nav so mouse and keyboard share one
// state. Blur afterwards: a focused tab swallows the arrow keys.
function select(i: number, e: MouseEvent) {
  go(currentPage.value, i)
  ;(e.currentTarget as HTMLElement | null)?.blur()
}
</script>

<template>
  <div class="window-layout" :style="{ '--wd-grad': gradientVar, '--wd-accent': accentVar }">
    <div class="window-inner">
      <header v-if="title || eyebrow" class="window-head">
        <span class="window-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="window-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="window-title">{{ title }}</h2>
      </header>

      <div v-if="$slots.lead" class="window-lead">
        <slot name="lead" />
      </div>

      <div class="window-frame">
        <div v-if="hasTabBar || labelFor(0) || activeLang" class="window-tab-bar">
          <template v-if="hasTabBar">
            <button
              v-for="(_, i) in panes"
              :key="i"
              type="button"
              class="window-tab"
              :class="{ 'is-active': i === selected }"
              @click="select(i, $event)"
            >
              <span v-if="iconFor(i)" class="window-tab-icon" :class="iconFor(i)" aria-hidden="true"></span>
              {{ labelFor(i) }}
            </button>
          </template>
          <span v-else-if="labelFor(0)" class="window-file">
            <span v-if="iconFor(0)" class="window-tab-icon" :class="iconFor(0)" aria-hidden="true"></span>
            {{ labelFor(0) }}
          </span>
          <span class="window-tab-spacer" aria-hidden="true"></span>
          <span v-if="activeLang" class="window-lang">{{ activeLang }}</span>
        </div>
        <div class="window-panes">
          <div
            v-for="(pane, i) in panes"
            :key="i"
            class="window-pane"
            :class="{ 'is-active': i === selected, 'is-visual': isVisual(pane) }"
            :aria-hidden="i !== selected"
          >
            <component :is="fitted(pane)" />
          </div>
        </div>
      </div>

      <div v-if="hasCaptionArea" class="window-caption">
        <template v-for="(caption, i) in captions" :key="i">
          <p
            v-if="caption"
            class="window-caption-cell"
            :class="{ 'is-active': i === selected }"
            :aria-hidden="i !== selected"
            v-html="caption"
          ></p>
        </template>
        <div
          v-if="$slots.caption"
          class="window-caption-cell"
          :class="{ 'is-active': showsSharedCaption }"
          :aria-hidden="!showsSharedCaption"
        >
          <slot name="caption" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.window-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.window-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 78rem;
  margin: 0 auto;
  padding: 2.5rem 4rem;
  display: flex;
  flex-direction: column;
}

.window-head {
  flex: 0 0 auto;
  margin-bottom: 1.25rem;
}
.window-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--wd-grad);
  margin-bottom: 0.9rem;
}
.window-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--wd-accent);
  margin-bottom: 0.55rem;
}
.window-title {
  font-size: clamp(1.7rem, 2.7vw, 2.2rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.window-lead {
  flex: 0 0 auto;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  line-height: 1.55;
  color: var(--miragon-text-secondary);
}
.window-lead :deep(p) {
  margin: 0;
}
.window-lead :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}

.window-frame {
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
.window-tab-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
  padding: 0 0.9rem 0 0;
  background: var(--miragon-gray-bg);
  border-bottom: 1px solid var(--miragon-border);
}
.window-tab-spacer {
  flex: 1 1 auto;
}
.window-tab,
.window-file {
  font-family: var(--miragon-font-mono);
  font-size: 0.78rem;
  color: var(--miragon-text-muted);
  padding: 0.6rem 0.7rem;
}
.window-tab,
.window-file {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.window-tab-icon {
  flex: 0 0 auto;
  width: 0.95rem;
  height: 0.95rem;
}
.window-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.window-tab.is-active {
  color: var(--miragon-text-primary);
  font-weight: 600;
  background: var(--miragon-white);
  border-bottom-color: var(--wd-accent);
}
.window-tab:focus-visible {
  outline: 2px solid var(--wd-accent);
  outline-offset: -2px;
}
.window-lang {
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

/* Alle Tabs liegen im selben Grid-Feld: das Fenster behält beim Tab-Wechsel
   seine Größe, sichtbar ist nur der aktive. */
.window-panes {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  padding: 0.4rem 0;
}
.window-pane {
  grid-area: 1 / 1;
  min-width: 0;
  visibility: hidden;
}
.window-pane.is-active {
  visibility: visible;
}
/* A visual taller than the window overflows downwards and is clipped there,
   never over the tab bar. */
.window-pane.is-visual {
  display: flex;
  align-items: safe center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
  padding: 1rem 2rem;
}
/* Shiki-Fence: Rahmen aus code.css zurücksetzen, das Fenster besitzt ihn. */
.window-pane :deep(.slidev-code) {
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  padding-block: 0.5rem;
  background: transparent;
}

.window-caption {
  flex: 0 0 auto;
  display: grid;
  margin-top: 1rem;
  font-size: 0.95rem;
  color: var(--miragon-text-muted);
  text-align: center;
}
.window-caption-cell {
  grid-area: 1 / 1;
  margin: 0;
  line-height: 1.5;
  visibility: hidden;
}
.window-caption-cell.is-active {
  visibility: visible;
}
.window-caption :deep(p) {
  margin: 0;
  line-height: 1.5;
}
.window-caption :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}
.window-lead :deep(a),
.window-caption :deep(a) {
  color: var(--wd-accent);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}
.window-lead :deep(:not(pre) > code),
.window-caption :deep(:not(pre) > code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}

@media (prefers-reduced-motion: reduce) {
  .window-tab {
    transition: none;
  }
}
</style>
