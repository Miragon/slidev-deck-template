<script setup lang="ts">
/**
 * subsection — Unterkapitel-Trenner (STATISCHE Welt, KEIN Mesh-Shader).
 *
 * Der kleine Bruder von `section`: gliedert ein Kapitel INTERN, ohne im Agenda-
 * Rail ein eigenes Kapitel zu eröffnen (die Agenda zählt nur `layout: section`).
 * Optisch untergeordnet — kleinerer Titel, dezentere Ghost-Ziffer, eine
 * optionale Kapitel-Rückreferenz als Überzeile — damit klar bleibt: dies ist
 * eine Zwischenüberschrift, kein neues Kapitel.
 *
 * Die Agenda kann diese Trenner mit `<Agenda preview="subsections">` statt der
 * Einzelfolien als Kapitel-Vorschau rendern.
 *
 * Slots: default = Unterkapiteltitel (h1) + optionaler Einzeiler (p) aus Markdown.
 * Frontmatter-Props:
 *   index    — Nummer als String (z. B. "2.1"); rendert als Ghost-Ziffer
 *   eyebrow  — kleine Überzeile (z. B. das übergeordnete Kapitel)
 *   accent   — "blue" | "green" | "mixed" — Gradient-Akzent (default blue)
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    index?: string
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
  }>(),
  { accent: 'blue' },
)

// Token reaktiv (siehe section.vue) — alle Werte aus theme.css, keine Hex.
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)
</script>

<template>
  <div
    class="subsection-layout"
    :style="{ '--s-grad': gradientVar, '--s-accent': accentVar }"
  >
    <span v-if="index" class="subsection-ghost" aria-hidden="true">{{ index }}</span>

    <div class="subsection-content">
      <span class="subsection-bar" aria-hidden="true"></span>
      <div v-if="eyebrow" class="subsection-eyebrow">{{ eyebrow }}</div>
      <div class="subsection-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.subsection-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: center;
}

/* Ghost-Ziffer wie section, aber kleiner und dezenter — Unterkapitel ordnet sich
   dem Kapitel unter. Solide Akzentfarbe (exportsicher, vgl. section.vue). */
.subsection-ghost {
  position: absolute;
  z-index: 0;
  right: 4.5rem;
  bottom: 2rem;
  font-size: 20rem;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--s-accent);
  opacity: 0.06;
  user-select: none;
  pointer-events: none;
}

.subsection-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 60rem;
  padding: 0 5rem;
  display: flex;
  flex-direction: column;
}

.subsection-bar {
  width: 3rem;
  height: 0.3rem;
  border-radius: 999px;
  background: var(--s-grad);
  margin-bottom: 1.5rem;
}
.subsection-eyebrow {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--s-accent);
  margin-bottom: 1rem;
}

.subsection-body :deep(h1) {
  font-size: clamp(2rem, 3.6vw, 3rem);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--miragon-text-primary);
  margin: 0;
}
.subsection-body :deep(h1 strong) {
  font-weight: 800;
  color: var(--s-accent);
}
.subsection-body :deep(p) {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--miragon-text-muted);
  margin: 1.5rem 0 0;
  max-width: 38rem;
}
</style>
