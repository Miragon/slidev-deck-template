<script setup lang="ts">
/**
 * bpmn — Slide centered on a BPMN diagram (STATIC world, no Mesh shader).
 *
 * Renders a .bpmn file with the token simulation from `slidev-addon-bpmn`,
 * with an optional title/eyebrow header above and an optional caption below.
 * The diagram is the focal point.
 *
 * Requires: `slidev-addon-bpmn` must be listed in the slides.md frontmatter
 * `addons:` block. The component used is `<BpmnTokenSimulation>`, registered
 * automatically by the addon.
 *
 * Frontmatter props:
 *   title    — slide title (h2-level)
 *   eyebrow  — uppercase kicker
 *   accent   — "blue" | "green" | "mixed" (default blue)
 *   diagram  — served URL path to the .bpmn file, resolved base-aware
 *              (e.g. "/resources/05-diagrams/recruitment.bpmn")
 *   height   — CSS height for the BPMN canvas (default "380px")
 * Slot:
 *   default  — optional caption / explanatory line below the diagram
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    diagram?: string
    height?: string
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue', height: '380px' },
)

const title = computed(() => props.frontmatter?.title as string | undefined)
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)

// Base-Pfad respektieren (GitHub Pages baut unter /<repo>/). Runtime-Strings
// werden von Vite NICHT umgeschrieben — daher manuell mit BASE_URL auflösen.
// Gleiche Logik wie in person.vue / content-image.vue.
function withBase(path?: string) {
  if (!path) return path
  if (/^https?:\/\//.test(path)) return path
  return import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}
const diagramSrc = computed(() => withBase(props.diagram))
</script>

<template>
  <div class="bpmn-layout" :style="{ '--bp-grad': gradientVar, '--bp-accent': accentVar }">
    <div class="bpmn-inner">
      <header v-if="title || eyebrow" class="bpmn-head">
        <span class="bpmn-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="bpmn-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="bpmn-title">{{ title }}</h2>
      </header>

      <div class="bpmn-canvas">
        <BpmnTokenSimulation
          v-if="diagram"
          :bpmnFilePath="diagramSrc"
          width="100%"
          :height="height"
        />
      </div>

      <div v-if="$slots.default" class="bpmn-caption">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.bpmn-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.bpmn-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 78rem;
  margin: 0 auto;
  padding: 2.5rem 4rem;
  display: flex;
  flex-direction: column;
}

.bpmn-head {
  flex: 0 0 auto;
  margin-bottom: 1.25rem;
}
.bpmn-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--bp-grad);
  margin-bottom: 0.9rem;
}
.bpmn-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--bp-accent);
  margin-bottom: 0.55rem;
}
.bpmn-title {
  font-size: clamp(1.7rem, 2.7vw, 2.2rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.bpmn-canvas {
  flex: 1 1 auto;
  min-height: 0;
  background: var(--miragon-white);
  border: 1px solid #E5E7EB;
  border-radius: 1.1rem;
  padding: 0.75rem;
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bpmn-caption {
  flex: 0 0 auto;
  margin-top: 1rem;
  font-size: 0.95rem;
  color: var(--miragon-text-muted);
  text-align: center;
}
.bpmn-caption :deep(p) {
  margin: 0;
  line-height: 1.5;
}
.bpmn-caption :deep(code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}
</style>
