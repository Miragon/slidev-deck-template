<script setup lang="ts">
/**
 * content — Workhorse-Inhaltsslide (STATISCHE Welt, KEIN Mesh-Shader).
 *
 * Der Alltags-Archetyp: ein Titel oben, darunter freier Body (Bullets,
 * <v-clicks>, kleine Karten). Folgt der hero/person-Bildsprache: heller Grund,
 * großzügige Typografie, ein einziger sparsamer Gradient-Akzent (Balken +
 * Bullet-Marker). Strukturelle Visualisierung statt dekoriertem Text —
 * Aufzählungen bekommen einen klaren Akzent-Marker (kein Emoji).
 *
 * Frontmatter-Props:
 *   title    — Slide-Titel (h2-Ebene; optional, sonst nur Body)
 *   eyebrow  — kleine Überzeile (optional)
 *   accent   — "blue" | "green" | "mixed" — Gradient-Akzent (default blue)
 * Slot: default = Body aus Markdown (max. 5 Bullets · max. 1 Verschachtelung).
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    // Slidev reicht das volle Frontmatter-Objekt als `frontmatter`-Prop durch.
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue' },
)

// `title` ist ein RESERVIERTES Slidev-Frontmatter-Feld (TOC/Nav) und wird NICHT
// als eigener Prop durchgereicht (FRONTMATTER_FIELDS). Daher aus dem
// mitgelieferten `frontmatter`-Objekt lesen, damit `title:` in slides.md wie
// dokumentiert funktioniert.
const title = computed(() => props.frontmatter?.title as string | undefined)

// Token reaktiv (siehe hero.vue) — alle Werte aus theme.css, keine Hex.
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)
</script>

<template>
  <div
    class="content-layout"
    :style="{ '--c-grad': gradientVar, '--c-accent': accentVar }"
  >
    <div class="content-inner">
      <header v-if="title || eyebrow" class="content-head">
        <span class="content-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="content-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="content-title">{{ title }}</h2>
      </header>

      <div class="content-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.content-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 68rem;
  margin: 0 auto;
  padding: 1.75rem 5rem 2rem;
  display: flex;
  flex-direction: column;
}

/* --- Kopf: Balken + Eyebrow + Titel (wie hero, kompakter) ----------------- */
.content-head {
  flex: 0 0 auto;
  margin-bottom: 1.5rem;
}
.content-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--c-grad);
  margin-bottom: 0.75rem;
}
.content-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-accent);
  margin-bottom: 0.75rem;
}
.content-title {
  font-size: clamp(2rem, 3.4vw, 2.9rem);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--miragon-text-primary);
  margin: 0;
}

/* --- Body: freier Markdown-Inhalt ----------------------------------------- */
.content-body {
  flex: 1 1 auto;
  min-height: 0;
}
.content-body :deep(p) {
  font-size: 1.2rem;
  line-height: 1.6;
  color: var(--miragon-text-secondary);
  margin: 0 0 1rem;
  max-width: 48rem;
}

/* Aufzählungen: klarer Akzent-Marker (CSS-Quadrat, kein Emoji). */
.content-body :deep(ul) {
  list-style: none;
  padding: 0;
  margin: 0;
}
.content-body :deep(li) {
  position: relative;
  font-size: 1.25rem;
  line-height: 1.5;
  color: var(--miragon-text-secondary);
  padding-left: 2rem;
  margin: 0 0 1.1rem;
  max-width: 50rem;
}
.content-body :deep(li)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.5em;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 0.2rem;
  background: var(--c-grad);
}
/* Eine Verschachtelungsebene: dezenter, kleinerer Marker. */
.content-body :deep(li ul) {
  margin-top: 0.8rem;
}
.content-body :deep(li li) {
  font-size: 1.05rem;
  color: var(--miragon-text-muted);
  margin-bottom: 0.6rem;
}
.content-body :deep(li li)::before {
  top: 0.55em;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--c-accent);
}

.content-body :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}
.content-body :deep(a) {
  color: var(--c-accent);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}
.content-body :deep(code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}
</style>
