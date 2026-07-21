<script setup lang="ts">
/**
 * showcase — interactive feature explorer (STATIC world, no shader).
 *
 * A row of clickable cards; one is active at a time. Click any card to switch
 * the active item; the detail panel below cross-fades to the new content.
 * Demonstrates Vue reactivity, CSS transitions, and Vue components living
 * inside a slide — beyond static Markdown.
 *
 * Items are passed as a YAML array via frontmatter; the layout iterates and
 * the user clicks to explore. Default state: first item active.
 *
 * Frontmatter props:
 *   title    — slide title (h2-level)
 *   eyebrow  — uppercase kicker
 *   accent   — "blue" | "green" | "mixed" (default mixed)
 *   items    — array of `{ label, body }` objects (recommended: 3–4 cards)
 */
import { computed, ref, watch } from 'vue'

interface Item {
  label: string
  body: string
}

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    items?: Item[]
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'mixed', items: () => [] },
)

const title = computed(() => props.frontmatter?.title as string | undefined)
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)

const selected = ref(0)
const activeItem = computed(() => props.items[selected.value])

// Defensive: clamp selection if the items list shrinks below the current
// index (e.g. when the slide is re-entered with a different array).
watch(
  () => props.items.length,
  (len) => {
    if (selected.value >= len) selected.value = 0
  },
)
</script>

<template>
  <div class="showcase-layout" :style="{ '--sc-grad': gradientVar, '--sc-accent': accentVar }">
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
          @click="selected = i"
        >
          <span class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="card-label">{{ item.label }}</span>
        </button>
      </div>

      <div class="showcase-detail">
        <transition name="fade-detail" mode="out-in">
          <p :key="selected" class="detail-body">{{ activeItem?.body }}</p>
        </transition>
      </div>

      <p class="showcase-hint" aria-hidden="true">Click a card to switch.</p>
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
  margin-bottom: 1.75rem;
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
.showcase-card.is-active .card-index {
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
