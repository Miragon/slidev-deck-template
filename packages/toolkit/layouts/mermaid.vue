<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue' },
)

const title = computed(() => props.frontmatter?.title as string | undefined)
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)
</script>

<template>
  <div class="mermaid-layout" :style="{ '--mm-grad': gradientVar, '--mm-accent': accentVar }">
    <div class="mermaid-inner">
      <header v-if="title || eyebrow" class="mermaid-head">
        <span class="mermaid-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="mermaid-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="mermaid-title">{{ title }}</h2>
      </header>

      <div class="mermaid-canvas">
        <slot />
      </div>

      <div v-if="$slots.caption" class="mermaid-caption">
        <slot name="caption" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mermaid-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.mermaid-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 78rem;
  margin: 0 auto;
  padding: 2.5rem 4rem;
  display: flex;
  flex-direction: column;
}

.mermaid-head {
  flex: 0 0 auto;
  margin-bottom: 1.25rem;
}
.mermaid-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--mm-grad);
  margin-bottom: 0.9rem;
}
.mermaid-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--mm-accent);
  margin-bottom: 0.55rem;
}
.mermaid-title {
  font-size: clamp(1.7rem, 2.7vw, 2.2rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.mermaid-canvas {
  flex: 1 1 auto;
  min-height: 0;
  background: var(--miragon-white);
  border: 1px solid #E5E7EB;
  border-radius: 1.1rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mermaid-canvas :deep(.mermaid),
.mermaid-canvas :deep(.mermaid-svg-wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.mermaid-canvas :deep(svg) {
  max-width: 100%;
  max-height: 100%;
  height: auto;
}

.mermaid-caption {
  flex: 0 0 auto;
  margin-top: 1rem;
  font-size: 0.95rem;
  color: var(--miragon-text-muted);
  text-align: center;
}
.mermaid-caption :deep(p) {
  margin: 0;
  line-height: 1.5;
}
.mermaid-caption :deep(:not(pre) > code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}
</style>
