<script setup lang="ts">
import { computed } from 'vue'

/**
 * Figure — beschriftete Diagramm-Spalte: Titel oben, Grafik (Slot) mittig,
 * Caption unten. Ersetzt die handgestylten text-center-<div>/<p>-Paare
 * (z. B. der VM/Container/Pod-Vergleich).
 *   <Figure title="Container" caption="Container teilen sich den **Host-Kernel**.">
 *   <svg …></svg>
 *   </Figure>
 * Die Caption versteht Inline-Markdown: **fett**, *kursiv*, `code`.
 *
 * Statt eines Slot-Visuals kann auch ein Public-Asset per `src` eingebunden
 * werden (z. B. eine .excalidraw.png). Der Pfad wird base-aware über
 * BASE_URL aufgelöst — KEIN Markdown-Bild verwenden: Slidev kompiliert ein
 * `![](…)` in einen Vite-Import, der bei Public-Assets den Build bricht.
 *   <Figure src="images/foo.excalidraw.png" alt="…" caption="…"></Figure>
 */
const props = withDefaults(
  defineProps<{
    title?: string
    caption?: string
    src?: string
    alt?: string
    maxHeight?: string
  }>(),
  { maxHeight: '340px' },
)

// Assets werden unter BASE_URL serviert (z. B. "/" lokal, "/<repo>/" auf GitHub
// Pages) — etwa Kapitel-Ressourcen unter /resources/<chapter>/<file>. Slash normalisieren.
const resolvedSrc = computed(() => {
  if (!props.src) return ''
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/${props.src.replace(/^\//, '')}`
})

// HTML-sicher: erst escapen, dann nur die erlaubten Inline-Marker zu Tags machen.
const captionHtml = computed(() => {
  if (!props.caption) return ''
  const escaped = props.caption
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
})
</script>

<template>
  <div class="mg-figure">
    <div v-if="title" class="mg-figure__title">{{ title }}</div>
    <div class="mg-figure__media">
      <img v-if="resolvedSrc" :src="resolvedSrc" :alt="alt" :style="{ maxHeight }" />
      <slot v-else />
    </div>
    <div v-if="caption" class="mg-figure__caption" v-html="captionHtml"></div>
  </div>
</template>

<style scoped>
.mg-figure {
  display: flex;
  flex-direction: column;
}
.mg-figure__title {
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  color: var(--miragon-text-primary);
  margin-bottom: 0.5rem;
}
.mg-figure__media {
  display: flex;
  justify-content: center;
}
.mg-figure__media img {
  max-width: 100%;
  height: auto;
}
.mg-figure__caption {
  text-align: center;
  color: var(--miragon-text-secondary);
  line-height: 1.4;
  font-size: 0.8rem;
  margin-top: 1.5rem;
}
.mg-figure__caption :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}
.mg-figure__caption :deep(em) {
  font-style: italic;
}
.mg-figure__caption :deep(code) {
  font-family: var(--miragon-font-mono, ui-monospace, monospace);
  font-size: 0.92em;
}
</style>
