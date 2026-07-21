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
import logoSrc from '../assets/logo.svg'
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
  background: linear-gradient(125deg, #335DE5 0%, #1a1a4e 35%, #0d0d2b 55%, #00C853 100%);
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

/* Schlussaussage: weiß, kursiv, sehr fett — spiegelt cover. */
.closing-body :deep(h1) {
  font-size: 3.6rem;
  line-height: 1.05;
  font-weight: 900;
  font-style: italic;
  color: var(--miragon-white);
  margin: 0;
  text-shadow: 0 2px 24px rgba(13, 13, 43, 0.35);
}

.closing-body :deep(p) {
  font-size: 1.4rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.88);
  margin-top: 1.25rem;
  max-width: 42rem;
}

.closing-body :deep(a) {
  color: var(--miragon-green);
  text-decoration: none;
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

.closing-logo { height: 1.75rem; opacity: 0.95; }

.closing-contact {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--miragon-green);
}
.closing-footer-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}
</style>
