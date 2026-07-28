<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '../components/DiagramFrame.vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    diagram?: string
    alt?: string
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue' },
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

      <DiagramFrame class="excalidraw-canvas" padding="generous">
        <img v-if="imageSrc" :src="imageSrc" :alt="alt" class="excalidraw-img" />
      </DiagramFrame>

      <div v-if="$slots.default" class="excalidraw-caption">
        <slot />
      </div>
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
