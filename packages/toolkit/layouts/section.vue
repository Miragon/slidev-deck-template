<script setup lang="ts">
/**
 * section — Kapiteltrenner (STATISCHE Welt, KEIN Mesh-Shader).
 *
 * Strukturiert das Deck: markiert den Beginn eines neuen Kapitels. Ruhig wie
 * `hero`, aber mit einer großen, halbtransparenten Index-Ziffer als
 * Orientierungsanker im Hintergrund. Heller Grund, viel Weißraum, ein einziger
 * Gradient-Akzent.
 *
 * Slots: default = Kapiteltitel (h1) + optionaler Einzeiler (p) aus Markdown.
 * Frontmatter-Props:
 *   index    — Kapitelnummer als String (z. B. "01"); rendert als Ghost-Ziffer
 *   eyebrow  — kleine Überzeile (z. B. "Chapter")
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

// Token reaktiv (siehe hero.vue) — alle Werte aus theme.css, keine Hex.
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)
</script>

<template>
  <div
    class="section-layout"
    :style="{ '--s-grad': gradientVar, '--s-accent': accentVar }"
  >
    <span v-if="index" class="section-ghost" aria-hidden="true">{{ index }}</span>

    <div class="section-content">
      <span class="section-bar" aria-hidden="true"></span>
      <div v-if="eyebrow" class="section-eyebrow">{{ eyebrow }}</div>
      <div class="section-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: center;
}

/* Große Ghost-Ziffer als Hintergrund-Anker — rein dekorativ, sehr dezent.
   BEWUSST kein background-clip:text-Gradient (headless Chromium beim PDF-Export
   rendert clip-Schrift unsichtbar, vgl. hero.vue) — solide Akzentfarbe mit
   geringer Deckkraft ist exportsicher. */
.section-ghost {
  position: absolute;
  z-index: 0;
  right: 4rem;
  bottom: 1.5rem;
  font-size: 24rem;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--s-accent);
  opacity: 0.07;
  user-select: none;
  pointer-events: none;
}

.section-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 60rem;
  padding: 0 5rem;
  display: flex;
  flex-direction: column;
}

.section-bar {
  width: 4.5rem;
  height: 0.4rem;
  border-radius: 999px;
  background: var(--s-grad);
  margin-bottom: 2rem;
}
.section-eyebrow {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--s-accent);
  margin-bottom: 1.25rem;
}

.section-body :deep(h1) {
  font-size: clamp(2.8rem, 5vw, 4.2rem);
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--miragon-text-primary);
  margin: 0;
}
.section-body :deep(h1 strong) {
  font-weight: 800;
  color: var(--s-accent);
}
.section-body :deep(p) {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--miragon-text-muted);
  margin: 1.75rem 0 0;
  max-width: 38rem;
}
</style>
