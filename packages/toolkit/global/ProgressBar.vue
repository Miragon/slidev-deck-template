<script setup lang="ts">
/**
 * ProgressBar — dünne Fortschritts-Stepper-Bar (globales Chrome).
 *
 * Implementierung, die vom globalen Layer `global-top.vue` (Theme-Root) auf
 * jeder Slide gerendert wird. Liegt bewusst in `global/` (nicht `components/`):
 * `components/` sind autoren-aufrufbare Tags (<Card> …), dies ist Chrome, das
 * Slidev automatisch injiziert.
 *
 * Rendert einen schmalen Gradient-Balken am oberen Rand, dessen Breite dem
 * Deck-Fortschritt (currentPage / total) entspricht.
 *
 * Regeln:
 *   - Rein visuelles Overlay: transparenter Rest, `pointer-events: none`,
 *     verdeckt niemals Slide-Inhalt (nur der Verlauf malt Pixel).
 *   - Ausgeblendet auf den animierten Brand-Momenten (cover/closing) und dem
 *     Kapiteltrenner (section), damit diese Voll-Bild-Slides ruhig bleiben.
 *   - Das aktuelle Layout MUSS über useNav() gelesen werden — `$frontmatter`
 *     aus useSlideContext() ist in globalen Komponenten NICHT reaktiv und
 *     liefert veraltete Werte.
 */
import { computed } from 'vue'
import { useNav } from '@slidev/client'

const { currentPage, total, slides } = useNav()

// Deck-Fortschritt in Prozent (0..100).
const progress = computed(() =>
  total.value ? (currentPage.value / total.value) * 100 : 0,
)

// Layouts, auf denen die Bar ausgeblendet wird (siehe ChapterFooter.vue —
// bewusst dieselbe Menge, damit Chrome konsistent verschwindet).
const HIDDEN_LAYOUTS = ['cover', 'closing', 'section']
const isHidden = computed(() => {
  const layout = (slides.value?.[currentPage.value - 1] as any)?.meta?.slide
    ?.frontmatter?.layout
  return HIDDEN_LAYOUTS.includes(layout)
})
</script>

<template>
  <div
    v-if="!isHidden"
    class="miragon-progress"
    :style="{ width: progress + '%' }"
    aria-hidden="true"
  ></div>
</template>

<style scoped>
.miragon-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  z-index: 50;
  /* Verlauf aus Brand-Tokens (Blau -> Grün), keine hardcoded Hex. */
  background: linear-gradient(
    90deg,
    var(--miragon-blue) 0%,
    var(--miragon-green) 100%
  );
  border-top-right-radius: 2px;
  border-bottom-right-radius: 2px;
  pointer-events: none;
  transition: width 0.3s ease;
}
</style>
