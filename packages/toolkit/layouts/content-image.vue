<script setup lang="ts">
/**
 * content-image — content slide with a side image (STATIC world, no shader).
 *
 * Two-column layout: an image on one side, the content (heading + body) on
 * the other. The same pattern as a typical "We are X, but who are you?"
 * slide: a visual anchor + a short narrative or list. Use whenever you want
 * a visual to accompany prose.
 *
 * Frontmatter props:
 *   title      — slide title (h2-level)
 *   eyebrow    — uppercase kicker
 *   accent     — "blue" | "green" | "mixed" (default blue)
 *   image      — served URL path to the image (e.g. /resources/02-content/team.jpg)
 *   imageAlt   — alt text for accessibility (default "")
 *   side       — "left" | "right" (default "left") — which side the image is on
 * Slot:
 *   default    — free Markdown body (lead, bullets, numbered steps, …)
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    image?: string
    imageAlt?: string
    side?: 'left' | 'right'
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue', side: 'left', imageAlt: '' },
)

const title = computed(() => props.frontmatter?.title as string | undefined)
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)

// Base-Pfad respektieren (GitHub Pages baut unter /<repo>/). Runtime-Strings
// werden von Vite NICHT umgeschrieben — daher manuell mit BASE_URL auflösen.
// Gleiche Logik wie in person.vue.
function withBase(path?: string) {
  if (!path) return path
  if (/^https?:\/\//.test(path)) return path
  return import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}
const imageSrc = computed(() => withBase(props.image))
</script>

<template>
  <div
    class="ci-layout"
    :class="[`image-${side}`]"
    :style="{ '--ci-grad': gradientVar, '--ci-accent': accentVar }"
  >
    <div class="ci-inner">
      <div class="ci-image">
        <img v-if="image" :src="imageSrc" :alt="imageAlt" />
      </div>

      <div class="ci-content">
        <span class="ci-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="ci-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="ci-title">{{ title }}</h2>
        <div class="ci-body"><slot /></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ci-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.ci-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 74rem;
  margin: 0 auto;
  padding: 3rem 4rem;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 3rem;
  align-items: center;
}
.image-right .ci-inner {
  grid-template-columns: 1.1fr 1fr;
}
.image-right .ci-image {
  order: 2;
}
.image-right .ci-content {
  order: 1;
}

.ci-image {
  display: flex;
  justify-content: center;
  align-items: center;
}
.ci-image img {
  width: 100%;
  max-height: 26rem;
  object-fit: cover;
  border-radius: 1.1rem;
  box-shadow: 0 12px 30px rgba(51, 93, 229, 0.18);
  background: var(--miragon-white);
}

.ci-content {
  display: flex;
  flex-direction: column;
}
.ci-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--ci-grad);
  margin-bottom: 1rem;
}
.ci-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ci-accent);
  margin-bottom: 0.6rem;
}
.ci-title {
  font-size: clamp(1.75rem, 2.6vw, 2rem);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 1.25rem;
}
.ci-body :deep(p) {
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--miragon-text-secondary);
  margin: 0 0 0.85rem;
}
.ci-body :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}

/* Bullets with accent marker (same pattern as the `content` layout). */
.ci-body :deep(ul) {
  list-style: none;
  padding: 0;
  margin: 0;
}
.ci-body :deep(li) {
  position: relative;
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--miragon-text-secondary);
  padding-left: 1.6rem;
  margin: 0 0 0.6rem;
}
.ci-body :deep(li)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 0.18rem;
  background: var(--ci-grad);
}
</style>
