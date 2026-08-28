<script setup lang="ts">
/**
 * closing — animierte Abschlussseite (Gegenstück zu `cover`).
 *
 * Schließt das Deck mit demselben Brand-Moment, mit dem `cover` es öffnet:
 * Mesh-Shader als Vollbild-Hintergrund (z0), Content darüber (z2). Trägt die
 * Schlussaussage („Thank you", Call-to-Action) und Kontaktangaben.
 *
 * Slots: default = Schlussaussage (h1) + optionaler Satz (p) aus Markdown.
 * Frontmatter-Props:
 *   eyebrow  — kleine Überzeile (z. B. "Let's talk")
 *   contact  — Kontaktzeile rechts im Footer (z. B. "name@miragon.io")
 *   footer   — Footer-Text links neben dem Logo (optional)
 */
defineProps<{
  eyebrow?: string
  contact?: string
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
  ;(e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <div class="closing-layout">
    <BrandMeshBackground />

    <div class="closing-content">
      <div v-if="eyebrow" class="closing-eyebrow">{{ eyebrow }}</div>
      <div class="closing-body">
        <slot />
      </div>
    </div>

    <div class="closing-footer">
      <img :src="logoSrc" alt="Miragon" class="closing-logo" @error="onLogoError" />
      <span v-if="contact" class="closing-contact">{{ contact }}</span>
      <span v-else-if="footer" class="closing-footer-text">{{ footer }}</span>
    </div>
  </div>
</template>

<style scoped>
.closing-layout {
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

.closing-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 4rem;
  max-width: 56rem;
}

.closing-eyebrow {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--miragon-green);
  margin-bottom: 1.25rem;
}

/* Schlussaussage: weiß, sehr fett, aufrecht. Spiegelt cover, inklusive der
   Entscheidung gegen die Kursive (Begründung dort). */
.closing-body :deep(h1) {
  font-size: 3.6rem;
  line-height: 1.05;
  font-weight: 900;
  color: var(--miragon-white);
  margin: 0;
  text-shadow: 0 2px 24px color-mix(in srgb, var(--miragon-mesh-navy) 35%, transparent);
}

.closing-body :deep(p) {
  font-size: 1.4rem;
  font-weight: 400;
  color: color-mix(in srgb, var(--miragon-white) 88%, transparent);
  margin-top: 1.25rem;
  max-width: 42rem;
}

.closing-body :deep(a) {
  /* Weiß, nicht grün: auf dem Mesh liegen grüne Farbstopps, und die CI erlaubt
     pro Motiv nur ein, zwei grüne Akzente. Der eine Grün-Akzent ist der
     Eyebrow. Die Unterstreichung trägt hier die Link-Affordanz. */
  color: var(--miragon-white);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
/* Fokus (CI-Regel C3): Links auf dem Mesh brauchen einen eigenen Ring. Weiß
   statt Blau, weil der Grund hier dunkel und selbst blau/grün ist — der Ring
   muss sich vom Verlauf abheben, nicht in ihm verschwinden. Token, kein Hex. */
.closing-body :deep(a:focus-visible) {
  outline: 2px solid var(--miragon-white);
  outline-offset: 3px;
  border-radius: 0.25rem;
}

.closing-footer {
  position: absolute;
  z-index: 2;
  bottom: 2rem;
  left: 4rem;
  right: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.closing-logo { height: 1.75rem; }

.closing-contact {
  font-size: 0.95rem;
  font-weight: 600;
  /* Siehe Links oben: ein grüner Akzent pro Motiv, und der ist der Eyebrow. */
  color: var(--miragon-white);
}
.closing-footer-text {
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--miragon-white) 70%, transparent);
}
</style>
