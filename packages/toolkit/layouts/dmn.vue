<script setup lang="ts">
/**
 * dmn — Slide centered on a DMN decision table (STATIC world, no Mesh shader).
 *
 * Renders a .dmn file as a decision table via `slidev-addon-dmn`, with an
 * optional title/eyebrow header above and an optional caption below. The
 * decision table is the focal point. The sibling of the `bpmn` archetype: BPMN
 * models the process, DMN models the decisions inside it.
 *
 * Requires: `slidev-addon-dmn` must be listed in the slides.md frontmatter
 * `addons:` block. The component used is `<DmnTable>`, registered automatically
 * by the addon (it also ships `<DmnDrd>` for the requirement diagram and
 * `<DmnModeler>` for an editor, not used here).
 *
 * Frontmatter props:
 *   title           — slide title (h2-level)
 *   eyebrow         — uppercase kicker
 *   accent          — "blue" | "green" | "mixed" (default blue)
 *   diagram         — served URL path to the .dmn file, resolved base-aware
 *                     (e.g. "/resources/04-diagrams/approval.dmn")
 *   height          — CSS height for the table canvas (default "360px")
 *   decisionId      — which decision to show when the file holds several (optional)
 *   fontSize        — table font size (default "15px")
 *   showAnnotations — show the trailing annotations column (default false)
 * Slot:
 *   default  — optional caption / explanatory line below the table
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    diagram?: string
    height?: string
    decisionId?: string
    fontSize?: string
    showAnnotations?: boolean
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue', height: '360px', fontSize: '15px', showAnnotations: false },
)

const title = computed(() => props.frontmatter?.title as string | undefined)
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)

// Base-Pfad respektieren (Deploys bauen ggf. unter /<repo>/). Runtime-Strings
// werden von Vite NICHT umgeschrieben — daher manuell mit BASE_URL auflösen.
// Gleiche Logik wie in bpmn.vue / person.vue / content-image.vue.
function withBase(path?: string) {
  if (!path) return path
  if (/^https?:\/\//.test(path)) return path
  return import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}
const diagramSrc = computed(() => withBase(props.diagram))
</script>

<template>
  <div class="dmn-layout" :style="{ '--dm-grad': gradientVar, '--dm-accent': accentVar }">
    <div class="dmn-inner">
      <header v-if="title || eyebrow" class="dmn-head">
        <span class="dmn-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="dmn-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="dmn-title">{{ title }}</h2>
      </header>

      <div class="dmn-canvas">
        <DmnTable
          v-if="diagram"
          :dmnFilePath="diagramSrc"
          width="100%"
          :height="height"
          :decisionId="decisionId"
          :fontSize="fontSize"
          :showAnnotations="showAnnotations"
        />
      </div>

      <div v-if="$slots.default" class="dmn-caption">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dmn-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.dmn-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 78rem;
  margin: 0 auto;
  padding: 2.5rem 4rem;
  display: flex;
  flex-direction: column;
}

.dmn-head {
  flex: 0 0 auto;
  margin-bottom: 1.25rem;
}
.dmn-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--dm-grad);
  margin-bottom: 0.9rem;
}
.dmn-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dm-accent);
  margin-bottom: 0.55rem;
}
.dmn-title {
  font-size: clamp(1.7rem, 2.7vw, 2.2rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.dmn-canvas {
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
/* dmn-js ships its own decision-table CSS (imported by the addon). We keep that
   rendering intact and only frame it in the branded card above, exactly like the
   bpmn archetype frames bpmn-js. */

.dmn-caption {
  flex: 0 0 auto;
  margin-top: 1rem;
  font-size: 0.95rem;
  color: var(--miragon-text-muted);
  text-align: center;
}
.dmn-caption :deep(p) {
  margin: 0;
  line-height: 1.5;
}
.dmn-caption :deep(code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}
</style>
