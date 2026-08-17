<script setup lang="ts">
/**
 * excalidraw — Slide centered on a hand-drawn `.excalidraw.svg`.
 *
 * Full mode (default): the diagram fills the width in a branded white card, with
 * an optional caption below. Split mode (`side`): the diagram sits framed on the
 * given side and the slot becomes a content column on the other side.
 *
 * Frontmatter props:
 *   title    — slide title (h2-level)
 *   eyebrow  — uppercase kicker
 *   accent   — "blue" | "green" | "mixed" (default blue)
 *   diagram  — served URL path to the .excalidraw.svg, resolved base-aware
 *   alt      — alt text for the diagram image
 *   side     — split layout: "left" | "right" places the diagram on that side
 *              and the slot becomes the content column on the other side.
 *   ratio    — diagram/content column ratio in split mode (default "1/1")
 *   height   — CSS height for the framed diagram card in split mode (default
 *              "22rem"; ignored in full mode, where the card fills the slide)
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
    alt?: string
    side?: 'left' | 'right'
    ratio?: string
    height?: string
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue', ratio: '1/1', height: '22rem' },
)

const title = computed(() => props.frontmatter?.title as string | undefined)
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)

function withBase(path?: string) {
  if (!path) return path
  if (/^https?:\/\//.test(path)) return path
  return import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}
const imageSrc = computed(() => withBase(props.diagram))
</script>

<template>
  <div class="excalidraw-layout" :style="{ '--ex-grad': gradientVar, '--ex-accent': accentVar }">
    <div class="excalidraw-inner">
      <header v-if="title || eyebrow" class="excalidraw-head">
        <span class="excalidraw-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="excalidraw-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="excalidraw-title">{{ title }}</h2>
      </header>

      <template v-if="!side">
        <DiagramFrame class="excalidraw-canvas" padding="generous">
          <img v-if="imageSrc" :src="imageSrc" :alt="alt" class="excalidraw-img" />
        </DiagramFrame>

        <div v-if="$slots.default" class="excalidraw-caption">
          <slot />
        </div>
      </template>

      <SplitView v-else class="excalidraw-split" :ratio="ratio" :reverse="side === 'right'" align="center">
        <template #visual>
          <DiagramFrame class="excalidraw-canvas excalidraw-canvas--split" padding="generous" :height="height">
            <img v-if="imageSrc" :src="imageSrc" :alt="alt" class="excalidraw-img" />
          </DiagramFrame>
        </template>
        <div class="excalidraw-body mg-diagram-body" :style="{ '--mg-body-grad': gradientVar, '--mg-body-accent': accentVar }">
          <slot />
        </div>
      </SplitView>
    </div>
  </div>
</template>

<style scoped>
.excalidraw-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.excalidraw-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 78rem;
  margin: 0 auto;
  padding: 2.5rem 4rem;
  display: flex;
  flex-direction: column;
}

.excalidraw-head {
  flex: 0 0 auto;
  margin-bottom: 1.25rem;
}
.excalidraw-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--ex-grad);
  margin-bottom: 0.9rem;
}
.excalidraw-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ex-accent);
  margin-bottom: 0.55rem;
}
.excalidraw-title {
  font-size: clamp(1.7rem, 2.7vw, 2.2rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.excalidraw-canvas {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}
.excalidraw-split {
  flex: 1 1 auto;
  min-height: 0;
  align-content: center;
}
.excalidraw-canvas--split {
  width: 100%;
}
.excalidraw-img {
  max-width: 100%;
  max-height: 100%;
  height: auto;
}

.excalidraw-caption {
  flex: 0 0 auto;
  margin-top: 1rem;
  font-size: 0.95rem;
  color: var(--miragon-text-muted);
  text-align: center;
}
.excalidraw-caption :deep(p) {
  margin: 0;
  line-height: 1.5;
}
.excalidraw-caption :deep(a) {
  color: var(--ex-accent);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}
.excalidraw-caption :deep(:not(pre) > code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}
</style>
