<script setup lang="ts">
/**
 * dmn — Slide centered on a DMN decision (STATIC world, no Mesh shader).
 *
 * Renders a .dmn file from `slidev-addon-dmn` in one of four modes, with an
 * optional title/eyebrow header above and an optional caption below. The
 * decision is the focal point. The sibling of the `bpmn` archetype: BPMN models
 * the process, DMN models the decisions inside it — and like `bpmn`, the `mode`
 * prop dynamically controls which addon component is rendered.
 *
 * Requires: `slidev-addon-dmn` must be listed in the slides.md frontmatter
 * `addons:` block. The addon auto-registers all four components used here.
 *
 * Frontmatter props:
 *   title           — slide title (h2-level)
 *   eyebrow         — uppercase kicker
 *   accent          — "blue" | "green" | "mixed" (default blue)
 *   diagram         — served URL path to the .dmn file, resolved base-aware
 *                     (e.g. "/resources/04-diagrams/approval.dmn")
 *   height          — CSS height for the table/canvas (default "360px")
 *   mode            — render mode (default "table"):
 *                       "table"    → <DmnTable>     (static decision table, default)
 *                       "simulate" → <DmnSimulate>  (live input form; evaluate the
 *                                    decision and highlight the firing rule — DMN's
 *                                    answer to the bpmn "token" simulation. Ships a
 *                                    built-in Fullscreen button next to the form.)
 *                       "drd"      → <DmnDrd>        (static requirement diagram, the
 *                                    graphical view — bpmn's "static" equivalent)
 *                       "modeler"  → <DmnModeler>    (editable modeler canvas)
 *   decisionId      — which decision to show when the file holds several
 *                     (optional; "table" / "simulate" modes)
 *   fontSize        — table/diagram font size (default "15px";
 *                     "table" / "simulate" / "drd" modes)
 *   fullscreenFontSize — table font size once the simulation is blown up to the
 *                     full viewport (default "18px"; "simulate" mode — raise it so
 *                     the table reads from the back of the room)
 *   showAnnotations — show the trailing annotations column (default false;
 *                     "table" / "simulate" modes)
 *   showDrdButton   — show the built-in "View DRD" button (default false;
 *                     "table" / "simulate" modes)
 *   engine          — "camunda" — mounts the Camunda properties panel in the
 *                     modeler ("modeler" mode only; omit for a panel-less modeler)
 * Slot:
 *   default  — optional caption / explanatory line below the decision
 */
import { computed } from 'vue'
import DiagramFrame from '../components/DiagramFrame.vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    diagram?: string
    height?: string
    mode?: 'table' | 'simulate' | 'drd' | 'modeler'
    decisionId?: string
    fontSize?: string
    fullscreenFontSize?: string
    showAnnotations?: boolean
    showDrdButton?: boolean
    engine?: 'camunda'
    frontmatter?: Record<string, unknown>
  }>(),
  {
    accent: 'blue',
    height: '360px',
    mode: 'table',
    fontSize: '15px',
    fullscreenFontSize: '18px',
    showAnnotations: false,
    showDrdButton: false,
  },
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

      <DiagramFrame class="dmn-canvas" padding="compact">
        <template v-if="diagram">
          <!-- Each addon component takes the dmnFilePath / width / height
               signature; the extra props differ per mode (see prop docs). -->
          <DmnSimulate
            v-if="mode === 'simulate'"
            :dmnFilePath="diagramSrc"
            width="100%"
            :height="height"
            :decisionId="decisionId"
            :fontSize="fontSize"
            :fullscreenFontSize="fullscreenFontSize"
            :showAnnotations="showAnnotations"
            :showDrdButton="showDrdButton"
          />
          <DmnDrd
            v-else-if="mode === 'drd'"
            :dmnFilePath="diagramSrc"
            width="100%"
            :height="height"
            :fontSize="fontSize"
          />
          <DmnModeler
            v-else-if="mode === 'modeler'"
            :dmnFilePath="diagramSrc"
            :engine="engine"
            width="100%"
            :height="height"
          />
          <DmnTable
            v-else
            :dmnFilePath="diagramSrc"
            width="100%"
            :height="height"
            :decisionId="decisionId"
            :fontSize="fontSize"
            :showAnnotations="showAnnotations"
            :showDrdButton="showDrdButton"
          />
        </template>
      </DiagramFrame>

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
  width: 100%;
}
/* dmn-js ships its own decision-table CSS (imported by the addon). We keep that
   rendering intact and only frame it in the branded DiagramFrame card, exactly
   like the bpmn archetype frames bpmn-js. */

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
.dmn-caption :deep(a) {
  color: var(--dm-accent);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}
.dmn-caption :deep(:not(pre) > code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}
</style>
