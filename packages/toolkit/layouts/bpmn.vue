<script setup lang="ts">
/**
 * bpmn — Slide centered on a BPMN diagram (STATIC world, no Mesh shader).
 *
 * Renders a .bpmn file from `slidev-addon-bpmn` in one of three modes,
 * with an optional title/eyebrow header above and an optional caption below.
 * The diagram is the focal point.
 *
 * Requires: `slidev-addon-bpmn` must be listed in the slides.md frontmatter
 * `addons:` block. The addon auto-registers all three components used here.
 *
 * Frontmatter props:
 *   title    — slide title (h2-level)
 *   eyebrow  — uppercase kicker
 *   accent   — "blue" | "green" | "mixed" (default blue)
 *   diagram  — served URL path to the .bpmn file, resolved base-aware
 *              (e.g. "/resources/05-diagrams/recruitment.bpmn")
 *   height   — CSS height for the BPMN canvas (default "380px")
 *   mode     — render mode (default "token"):
 *                "static"  → <Bpmn>                (still image, no interaction)
 *                "token"   → <BpmnTokenSimulation>  (playable token flow, default)
 *                "modeler" → <BpmnModeler>          (editable modeler canvas)
 *   engine   — "camunda7" | "zeebe"  (modeler mode only, optional)
 *              Mounts an engine-specific properties panel in the modeler's
 *              fullscreen "Edit" view. Omit for a panel-less modeler.
 *   tokenSimulation — run the token simulation inside the modeler (modeler mode)
 *   transactionBoundaries — overlay Camunda 7 transaction boundaries in the
 *              modeler's fullscreen "Edit" view (modeler mode, requires
 *              engine="camunda7"; ignored otherwise)
 *   side     — split layout: "left" | "right" places the diagram on that side
 *              and the slot becomes the content column on the other side.
 *              Omit for the default full-width diagram with a caption below.
 *   ratio    — diagram/content column ratio in split mode (default "1/1")
 * Slot:
 *   default  — full mode: optional caption below the diagram.
 *              split mode: the content column beside the diagram (bullets,
 *              <StepList>, <Card> …), styled like a content slide.
 */
import { computed } from 'vue'
import DiagramFrame from '../components/DiagramFrame.vue'
import SplitView from '../components/SplitView.vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    diagram?: string
    height?: string
    mode?: 'static' | 'token' | 'modeler'
    engine?: 'camunda7' | 'zeebe'
    tokenSimulation?: boolean
    transactionBoundaries?: boolean
    side?: 'left' | 'right'
    ratio?: string
    frontmatter?: Record<string, unknown>
  }>(),
  {
    accent: 'blue',
    height: '380px',
    mode: 'token',
    tokenSimulation: false,
    transactionBoundaries: false,
    ratio: '1/1',
  },
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

      <template v-if="!side">
        <DiagramFrame class="bpmn-canvas" padding="compact">
          <template v-if="diagram">
            <!-- All three addon components share the same
                 bpmnFilePath / width / height signature. -->
            <Bpmn v-if="mode === 'static'" :bpmnFilePath="diagramSrc" width="100%" :height="height" />
            <BpmnModeler
              v-else-if="mode === 'modeler'"
              :bpmnFilePath="diagramSrc"
              :engine="engine"
              :tokenSimulation="tokenSimulation"
              :transactionBoundaries="transactionBoundaries"
              width="100%"
              :height="height"
            />
            <BpmnTokenSimulation v-else :bpmnFilePath="diagramSrc" width="100%" :height="height" />
          </template>
        </DiagramFrame>

        <div v-if="$slots.default" class="bpmn-caption">
          <slot />
        </div>
      </template>

      <SplitView v-else class="bpmn-split" :ratio="ratio" :reverse="side === 'right'" align="center">
        <template #visual>
          <DiagramFrame class="bpmn-canvas bpmn-canvas--split" padding="compact" :height="height">
            <template v-if="diagram">
              <Bpmn v-if="mode === 'static'" :bpmnFilePath="diagramSrc" width="100%" :height="height" />
              <BpmnModeler
                v-else-if="mode === 'modeler'"
                :bpmnFilePath="diagramSrc"
                :engine="engine"
                :tokenSimulation="tokenSimulation"
                :transactionBoundaries="transactionBoundaries"
                width="100%"
                :height="height"
              />
              <BpmnTokenSimulation v-else :bpmnFilePath="diagramSrc" width="100%" :height="height" />
            </template>
          </DiagramFrame>
        </template>
        <div class="bpmn-body mg-diagram-body" :style="{ '--mg-body-grad': gradientVar, '--mg-body-accent': accentVar }">
          <slot />
        </div>
      </SplitView>
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
  width: 100%;
}

.bpmn-split {
  flex: 1 1 auto;
  min-height: 0;
  align-content: center;
}
.bpmn-canvas--split {
  width: 100%;
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
.bpmn-caption :deep(a) {
  color: var(--bp-accent);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}
.bpmn-caption :deep(:not(pre) > code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}
</style>
