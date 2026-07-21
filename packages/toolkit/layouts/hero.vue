<script setup lang="ts">
/**
 * hero — Hero-Statement (STATISCHE Welt, KEIN Mesh-Shader).
 *
 * Hebt EINE große Aussage hervor: einen Leitsatz, eine Kernthese, einen
 * Schlüsselmoment. Anders als `cover` (animierte Titelseite) lebt `hero` von
 * Ruhe: heller Grund, viel Weißraum, sehr große Typografie. Der einzige
 * bewegte Brand-Akzent ist ein statischer Gradient-Balken (sparsam).
 *
 * Diese Slide definiert die visuelle Sprache der statischen Welt, an der sich
 * person/content/compare später orientieren.
 *
 * Slots: default = Aussage (h1) + optionale Attribution/Quelle (p) aus Markdown.
 * Frontmatter-Props:
 *   eyebrow  — kleine Überzeile (optional)
 *   accent   — "blue" | "green" | "mixed" — wählt den Gradient-Akzent (default blue)
 *   align    — "left" | "center" — Ausrichtung (default left)
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    align?: 'left' | 'center'
  }>(),
  { accent: 'blue', align: 'left' },
)

// Abgeleitete Token reaktiv halten (computed), falls Slidev die Layout-Instanz
// über Slides hinweg wiederverwendet. Alle Werte zeigen auf theme.css-Variablen
// — keine hardcoded Hex.
//
// Gradient (Balken + Attributions-Strich) je nach Akzent.
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
// Eyebrow-Solidfarbe: Grün nur beim grünen Akzent (CI: Grün sparsam).
const eyebrowVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)
// Solidfarbe für das hervorgehobene Wort (**bold**). BEWUSST kein
// background-clip:text-Gradient: headless Chromium (PDF-Export via `npm run
// export`) kann die clip-Schrift unsichtbar rendern. Solide Akzentfarbe ist
// immer sichtbar und exportsicher; der Gradient lebt im Balken/Strich.
const emphasisVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)
</script>

<template>
  <div
    class="hero-layout"
    :class="[`is-${align}`]"
    :style="{
      '--hero-grad': gradientVar,
      '--hero-eyebrow': eyebrowVar,
      '--hero-emphasis': emphasisVar,
    }"
  >
    <div class="hero-content">
      <span class="hero-bar" aria-hidden="true"></span>
      <div v-if="eyebrow" class="hero-eyebrow">{{ eyebrow }}</div>
      <div class="hero-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: center;
}

.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 64rem;
  padding: 0 5rem;
  display: flex;
  flex-direction: column;
}

/* Gradient-Akzent: kurzer Balken über der Aussage (der einzige Brand-„Bewegungs"-Punkt). */
.hero-bar {
  width: 4.5rem;
  height: 0.4rem;
  border-radius: 999px;
  background: var(--hero-grad);
  margin-bottom: 2rem;
}

.hero-eyebrow {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--hero-eyebrow);
  margin-bottom: 1.5rem;
}

/* Aussage dominiert die Slide: sehr groß, dunkel, fett. */
.hero-body :deep(h1) {
  font-size: clamp(3rem, 5.4vw, 4.6rem);
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--miragon-text-primary);
  margin: 0;
}

/* Attribution / Quelle: dezent, mit Gradient-Strich davor. */
.hero-body :deep(p) {
  position: relative;
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--miragon-text-muted);
  margin: 2.25rem 0 0;
  padding-left: 3rem;
}

.hero-body :deep(p)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.7em;
  width: 2rem;
  height: 2px;
  background: var(--hero-grad);
}

/* Optionaler Brand-Akzent auf einzelnen Wörtern: **bold** im Statement bekommt
   die solide Akzentfarbe. Sparsam einsetzen (ein Schlüsselwort, nicht mehr). */
.hero-body :deep(h1 strong) {
  font-weight: 800;
  color: var(--hero-emphasis);
}

/* --- Ausrichtung ---------------------------------------------------------- */
.is-center {
  justify-content: center;
}
.is-center .hero-content {
  align-items: center;
  text-align: center;
  max-width: 56rem;
}
.is-center .hero-eyebrow {
  margin-bottom: 1.75rem;
}
.is-center .hero-body :deep(p) {
  padding-left: 0;
  padding-top: 2rem;
}
.is-center .hero-body :deep(p)::before {
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 2.5rem;
}
</style>
