<script setup lang="ts">
/**
 * showcase — interactive feature explorer (STATIC world, no shader).
 *
 * A row of cards, one active at a time; the detail panel below cross-fades to
 * the active item. The active card is Slidev's per-slide click counter, so a
 * card click and advancing the slide (arrow keys / space) are the same action.
 *
 * Frontmatter props:
 *   title    — slide title (h2-level)
 *   eyebrow  — uppercase kicker
 *   accent   — "blue" | "green" | "mixed" (default mixed)
 *   items    — array of `{ label, body, icon? }` objects (recommended: 3–4 cards).
 *              `body` is a string (one paragraph) or a string array (bullet list).
 *              `icon` is an optional Iconify class (e.g. "i-carbon-chip") that
 *              replaces the card's numbered index; write it literally so UnoCSS
 *              picks it up. It takes the accent colour, like the index.
 *   hint     — navigation footer, hidden by default. `true` for the standard
 *              line, or a string for your own.
 *   gap      — CSS length for the space between the card row and the detail
 *              panel below. Default "1rem" (matches the gap between cards).
 */
import { computed, onUnmounted, watch } from 'vue'
import { useNav, useSlideContext } from '@slidev/client'

interface Item {
  label: string
  body: string | string[]
  icon?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    items?: Item[]
    hint?: boolean | string
    gap?: string
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'mixed', items: () => [], hint: false, gap: '1rem' },
)

const title = computed(() => props.frontmatter?.title as string | undefined)
const hintText = computed(() =>
  props.hint === true
    ? 'Click a card or press the arrow keys to switch.'
    : typeof props.hint === 'string' && props.hint.trim()
      ? props.hint
      : null,
)
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)

const { $clicks, $clicksContext } = useSlideContext()
const { currentPage, go } = useNav()

// Register `items.length - 1` click steps so the slide only advances past the
// last card, without the author declaring `clicks:` in frontmatter.
const steps = computed(() => Math.max(0, props.items.length - 1))
const CLICK_KEY = Symbol('showcase')
watch(steps, (max) => $clicksContext.register(CLICK_KEY, { delta: 0, max }), { immediate: true })
onUnmounted(() => $clicksContext.unregister(CLICK_KEY))

const selected = computed(() => Math.min(Math.max($clicks.value, 0), steps.value))
const activeItem = computed(() => props.items[selected.value])

// Frontmatter values are plain strings, not compiled by Slidev, so render the
// allowed inline Markdown ourselves (code, links, bold, italic). HTML-safe:
// escape first, then mark up (mirrors Figure.vue's caption).
function inline(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
}

// Route the card click through Slidev's own nav so mouse and keyboard share one
// state. Blur afterwards: a focused card button swallows the arrow keys, which
// would otherwise stop slide navigation until the user clicked away.
function select(i: number, e: MouseEvent) {
  go(currentPage.value, i)
  ;(e.currentTarget as HTMLElement | null)?.blur()
}
</script>

<template>
  <div class="showcase-layout" :style="{ '--sc-grad': gradientVar, '--sc-accent': accentVar, '--sc-gap': gap }">
    <div class="showcase-inner">
      <header v-if="title || eyebrow" class="showcase-head">
        <span class="showcase-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="showcase-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="showcase-title">{{ title }}</h2>
      </header>

      <div class="showcase-grid" :class="`cols-${items.length}`">
        <button
          v-for="(item, i) in items"
          :key="i"
          type="button"
          class="showcase-card"
          :class="{ 'is-active': i === selected }"
          @click="select(i, $event)"
        >
          <span v-if="item.icon" class="card-icon" :class="item.icon" aria-hidden="true"></span>
          <span v-else class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="card-label">{{ item.label }}</span>
        </button>
      </div>

      <div class="showcase-detail">
        <transition name="fade-detail" mode="out-in">
          <ul v-if="Array.isArray(activeItem?.body)" :key="selected" class="detail-list">
            <li v-for="(line, li) in activeItem.body" :key="li" v-html="inline(line)"></li>
          </ul>
          <p v-else :key="selected" class="detail-body" v-html="inline(activeItem?.body ?? '')"></p>
        </transition>
      </div>

      <p v-if="hintText" class="showcase-hint" aria-hidden="true">{{ hintText }}</p>
    </div>
  </div>
</template>

<style scoped>
.showcase-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.showcase-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: 3rem 4rem 2.5rem;
  display: flex;
  flex-direction: column;
}

.showcase-head {
  flex: 0 0 auto;
  margin-bottom: 2rem;
}
.showcase-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--sc-grad);
  margin-bottom: 1rem;
}
.showcase-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--sc-accent);
  margin-bottom: 0.6rem;
}
.showcase-title {
  font-size: clamp(1.7rem, 2.7vw, 2.2rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.showcase-grid {
  flex: 0 0 auto;
  display: grid;
  gap: 1rem;
  margin-bottom: var(--sc-gap);
}
.showcase-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
.showcase-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
.showcase-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }

.showcase-card {
  position: relative;
  text-align: left;
  cursor: pointer;
  background: var(--miragon-white);
  border: 1px solid #E5E7EB;
  border-radius: 1rem;
  padding: 1.1rem 1.2rem 1.2rem;
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
  font: inherit;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition:
    transform 320ms cubic-bezier(0.2, 0.7, 0.2, 1),
    box-shadow 320ms cubic-bezier(0.2, 0.7, 0.2, 1),
    border-color 320ms cubic-bezier(0.2, 0.7, 0.2, 1),
    opacity 320ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.showcase-card:focus-visible {
  outline: 2px solid var(--sc-accent);
  outline-offset: 3px;
}
.showcase-card:hover {
  transform: translateY(-2px);
}

.card-index {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--miragon-text-muted);
  transition: color 320ms ease;
}

.card-icon {
  font-size: 1.6rem;
  color: var(--miragon-text-muted);
  transition: color 320ms ease;
}
.card-label {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--miragon-text-primary);
  letter-spacing: -0.005em;
}

.showcase-card.is-active {
  transform: translateY(-4px) scale(1.02);
  border-color: var(--sc-accent);
  box-shadow: 0 16px 36px rgba(51, 93, 229, 0.18);
}
.showcase-card.is-active .card-index,
.showcase-card.is-active .card-icon {
  color: var(--sc-accent);
}
.showcase-card:not(.is-active) {
  opacity: 0.55;
}

.showcase-detail {
  flex: 1 1 auto;
  min-height: 5rem;
  background: var(--miragon-white);
  border: 1px solid #E5E7EB;
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
  display: flex;
  align-items: center;
  position: relative;
}
.detail-body {
  font-size: 1.1rem;
  line-height: 1.55;
  color: var(--miragon-text-secondary);
  margin: 0;
}

.showcase-detail :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}
.showcase-detail :deep(em) {
  font-style: italic;
}
.showcase-detail :deep(a) {
  color: var(--miragon-blue);
  text-decoration: underline;
  text-underline-offset: 0.15em;
  font-weight: 600;
}
.showcase-detail :deep(code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}

.detail-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.detail-list li {
  position: relative;
  font-size: 1.1rem;
  line-height: 1.55;
  color: var(--miragon-text-secondary);
  padding-left: 1.75rem;
}
.detail-list li + li {
  margin-top: 0.55rem;
}
.detail-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.52em;
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 0.2rem;
  background: var(--sc-grad);
}

/* Cross-fade for the detail panel content when the user picks another card. */
.fade-detail-enter-active,
.fade-detail-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}
.fade-detail-enter-from,
.fade-detail-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.showcase-hint {
  flex: 0 0 auto;
  margin: 0.9rem 0 0;
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--miragon-text-muted);
  text-align: center;
}
</style>
