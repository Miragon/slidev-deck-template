<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import { inlineMarkdown } from '../utils/inlineMarkdown'

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
 *
 * `alt` ist bewusst mit `''` vorbelegt (CI-Regel C4, Barrierefreiheit): ohne
 * Default renderte das <img> GANZ OHNE alt-Attribut, und Screenreader lesen
 * dann den Dateipfad vor. Leerer Alt-Text = "dekorativ, überspringen" — der
 * richtige Default, wenn die Aussage bereits in Titel/Caption steht.
 * Inhaltstragende Grafiken setzen `alt` explizit.
 *
 * Mit `steps` baut sich ein SVG über Klicks auf. Im SVG bekommt ein Element
 * oder eine Gruppe `data-step="n"` und bleibt bis Klick n verborgen
 * (Opacity wie `v-click`, kein Layout-Sprung); unmarkierte Elemente sind
 * immer sichtbar. `steps` registriert so viele Klicks auf der Folie, damit
 * `v-click="1"` … `v-click="n"` (z. B. in einer StepList) synchron läuft.
 * Dafür wird das SVG inline gerendert statt als <img>. Ohne `steps` ändert
 * sich nichts. Im PDF-Export erscheint die fertig aufgebaute Grafik.
 *   <Figure src="resources/05-testing/scopes.svg" alt="…" steps="3"></Figure>
 */
const props = withDefaults(
  defineProps<{
    title?: string
    caption?: string
    src?: string
    alt?: string
    maxHeight?: string
    steps?: number | string
  }>(),
  { maxHeight: '340px', alt: '' },
)

// Assets werden unter BASE_URL serviert (z. B. "/" lokal, "/<repo>/" auf GitHub
// Pages) — etwa Kapitel-Ressourcen unter /resources/<chapter>/<file>. Slash normalisieren.
const resolvedSrc = computed(() => {
  if (!props.src) return ''
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/${props.src.replace(/^\//, '')}`
})

const stepCount = Number(props.steps ?? 0)
const isStepped = stepCount > 0 && !!props.src
const svgMarkup = ref('')
const svgHost = shallowRef<HTMLElement>()

if (isStepped) {
  const { $clicks, $clicksContext } = useSlideContext()
  const CLICK_KEY = Symbol('figure-steps')
  $clicksContext.register(CLICK_KEY, { delta: 0, max: stepCount })
  onUnmounted(() => $clicksContext.unregister(CLICK_KEY))

  watch(resolvedSrc, async (url) => {
    svgMarkup.value = await (await fetch(url)).text()
  }, { immediate: true })

  watch([$clicks, svgMarkup], async () => {
    await nextTick()
    svgHost.value?.querySelectorAll<SVGElement>('[data-step]').forEach((element) => {
      element.classList.add('slidev-vclick-target')
      element.classList.toggle('slidev-vclick-hidden', Number(element.dataset.step) > $clicks.value)
    })
  }, { immediate: true })
}

const captionHtml = computed(() => (props.caption ? inlineMarkdown(props.caption) : ''))
</script>

<template>
  <div class="mg-figure">
    <div v-if="title" class="mg-figure__title">{{ title }}</div>
    <div class="mg-figure__media">
      <div
        v-if="isStepped"
        ref="svgHost"
        class="mg-figure__svg"
        :role="alt ? 'img' : undefined"
        :aria-label="alt || undefined"
        :aria-hidden="alt ? undefined : 'true'"
        :style="{ maxHeight }"
        v-html="svgMarkup"
      ></div>
      <img v-else-if="resolvedSrc" :src="resolvedSrc" :alt="alt" :style="{ maxHeight }" />
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
.mg-figure__svg {
  display: flex;
  justify-content: center;
  max-width: 100%;
}
.mg-figure__svg :deep(svg) {
  max-width: 100%;
  max-height: inherit;
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
.mg-figure__caption :deep(a) {
  color: var(--miragon-blue);
  text-decoration: underline;
  text-underline-offset: 0.15em;
  font-weight: 600;
}
.mg-figure__caption :deep(code) {
  font-family: var(--miragon-font-mono, ui-monospace, monospace);
  font-size: 0.92em;
}
</style>
