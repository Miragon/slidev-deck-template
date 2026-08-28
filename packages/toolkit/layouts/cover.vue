<script setup lang="ts">
/**
 * cover — animierte Titelseite.
 * Mesh-Shader als Vollbild-Hintergrund (z0), Content darüber (z2).
 * Slots: default = Titel/Subtitle (aus Markdown). Frontmatter-Props:
 *   eyebrow  — kleine Überzeile (z. B. "Q2 Review")
 *   footer   — Footer-Text rechts (z. B. Name · Datum)
 */
defineProps<{
  eyebrow?: string
  footer?: string
}>()

// Brand-Asset reist mit dem Theme: statischer Import, von Vite gebundlet und
// base-aware. Das Deck erbt das Logo aus dem Theme, ohne es selbst zu duplizieren.
//
// WEISSE Variante, nicht die grüne: dieses Layout liegt auf dem animierten
// Mesh, dessen Farbstopps selbst Grün enthalten (#00E676, #00C853). Die grüne
// Wortmarke stand dort stellenweise bei 1.55:1 gegen den Hintergrund. Die CI
// schreibt für dunklen/farbigen Grund und Fotos ohnehin Weiß vor.
// Die Datei ist der unveränderte offizielle Vektor (miragon-logo-weiss.svg).
import logoSrc from '../assets/logo-white.svg'
function onLogoError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <div class="cover-layout">
    <BrandMeshBackground />

    <div class="cover-content">
      <div v-if="eyebrow" class="cover-eyebrow">{{ eyebrow }}</div>
      <div class="cover-body">
        <slot />
      </div>
    </div>

    <div class="cover-footer">
      <img :src="logoSrc" alt="Miragon" class="cover-logo" @error="onLogoError" />
      <span v-if="footer" class="cover-footer-text">{{ footer }}</span>
    </div>
  </div>
</template>

<style scoped>
.cover-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: var(--miragon-white);
  /* Brand-Gradient als unterste Ebene: greift, falls BrandMeshBackground (WebGL) gar nicht
     mountet (PDF/headless ohne GPU) — so nie Weiß, immer der Miragon-Verlauf.
     BrandMeshBackground liegt mit position:absolute darüber und verdeckt ihn live. */
  background: var(--miragon-mesh-fallback);
}

.cover-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 4rem;
  max-width: 56rem;
}

.cover-eyebrow {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--miragon-green);
  margin-bottom: 1.25rem;
}

/* Titel: weiß, sehr fett, aufrecht.
   BEWUSST NICHT kursiv: fonts.css liefert Geist nur mit font-style: normal,
   einen echten Kursivschnitt gibt es also gar nicht. `font-style: italic`
   erzeugt hier nur eine synthetische Schrägstellung, die der Browser
   errechnet und die die Buchstabenformen verzerrt. Die nach vorn geneigte
   Markenanmutung trägt ohnehin die Wortmarke im Fuß. */
.cover-body :deep(h1) {
  font-size: 3.6rem;
  line-height: 1.05;
  font-weight: 900;
  color: var(--miragon-white);
  margin: 0;
  text-shadow: 0 2px 24px color-mix(in srgb, var(--miragon-mesh-navy) 35%, transparent);
}

.cover-body :deep(p) {
  font-size: 1.4rem;
  font-weight: 400;
  color: color-mix(in srgb, var(--miragon-white) 88%, transparent);
  margin-top: 1.25rem;
  max-width: 42rem;
}

.cover-body :deep(a) {
  /* Weiß, nicht grün: auf dem Mesh liegen grüne Farbstopps, und die CI erlaubt
     pro Motiv nur ein, zwei grüne Akzente. Der eine Grün-Akzent ist der
     Eyebrow. Die Unterstreichung trägt hier die Link-Affordanz. */
  color: var(--miragon-white);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.cover-footer {
  position: absolute;
  z-index: 2;
  bottom: 2rem;
  left: 4rem;
  right: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cover-logo { height: 1.75rem; }

.cover-footer-text {
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--miragon-white) 70%, transparent);
}
</style>
