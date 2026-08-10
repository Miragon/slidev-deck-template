<script setup lang="ts">
/**
 * CodeBlock — beschriftetes Code-„Fenster" in Miragon-CI.
 *
 * Rahmt einen Markdown-Code-Fence (im Default-Slot) mit einer weißen Brand-Card
 * (wie <Card>) und einer Kopfzeile aus optionalem Dateinamen (links) und
 * optionalem Sprach-Badge (rechts). Der Fence behält Shikis Syntax-Highlighting;
 * Rahmen und Zeilen-Hintergrund werden hier zurückgesetzt.
 *
 * Props:
 *   file        Dateiname/Pfad in der Kopfzeile (optional).
 *   lang        Sprach-Badge rechts in der Kopfzeile (optional, z. B. "md").
 *   size         CSS-Schriftgröße des Codes (z. B. "0.9rem"); ohne Angabe Standard.
 *   expandedSize CSS-Schriftgröße des Codes im Vollbild (Standard 1.25rem,
 *                mindestens die Inline-Größe); nur mit expandable relevant.
 *   hideHeader   Kopfzeile ausblenden, auch wenn file/lang gesetzt sind.
 *   expandable   Expand-Button (oben rechts, auf Hover), der das Fenster im
 *                Vollbild aufklappt; Esc oder Backdrop-Klick schließt.
 *
 * Nutzung (Fence auf eigenen Zeilen, Leerzeilen drumherum):
 *
 *   <CodeBlock file="deck/slides.md" lang="md" expandable>
 *
 *   ```md
 *   # Build decks like **code**
 *   ```
 *
 *   </CodeBlock>
 */
import { ref, watch, onUnmounted, computed } from 'vue'

const props = defineProps<{
  file?: string
  lang?: string
  size?: string
  expandedSize?: string
  hideHeader?: boolean
  expandable?: boolean
}>()

const showHeader = () => Boolean((props.file || props.lang) && !props.hideHeader)

// CSS-Variablen für Inline- und Vollbild-Schriftgröße nur setzen, wenn gesetzt.
const windowStyle = computed(() => {
  const s: Record<string, string> = {}
  if (props.size) s['--mg-code-size'] = props.size
  if (props.expandedSize) s['--mg-code-expanded-size'] = props.expandedSize
  return Object.keys(s).length ? s : undefined
})

const expanded = ref(false)
function collapse() {
  expanded.value = false
}
function toggle(e: MouseEvent) {
  expanded.value = !expanded.value
  ;(e.currentTarget as HTMLElement | null)?.blur()
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    collapse()
  }
}
watch(expanded, (open) => {
  if (open) window.addEventListener('keydown', onKey, true)
  else window.removeEventListener('keydown', onKey, true)
})
onUnmounted(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <Teleport to="body" :disabled="!expanded">
    <div class="mg-code" :class="{ 'mg-code--expanded': expanded }" @click.self="collapse">
      <div
        class="mg-code__window"
        :class="{ 'mg-code--sized': size }"
        :style="windowStyle"
      >
        <div
          v-if="showHeader() || expandable"
          class="mg-code__bar"
          :class="{ 'mg-code__bar--bare': !showHeader() }"
        >
          <span v-if="file" class="mg-code__file">{{ file }}</span>
          <span class="mg-code__bar-spacer" aria-hidden="true"></span>
          <span v-if="lang" class="mg-code__lang">{{ lang }}</span>
          <button
            v-if="expandable"
            type="button"
            class="mg-code__toggle"
            :aria-label="expanded ? 'Vollbild schließen' : 'Vollbild'"
            :title="expanded ? 'Vollbild schließen' : 'Vollbild'"
            @click="toggle"
          >
            <span class="mg-code__toggle-icon" :class="expanded ? 'i-carbon-minimize' : 'i-carbon-maximize'" aria-hidden="true"></span>
          </button>
        </div>
        <div class="mg-code__body"><slot /></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Wurzel: transparenter Block (nimmt durchgereichte Spacing-Klassen auf); das
   Kartenbild liegt auf .mg-code__window, damit die Wurzel im Vollbild zum
   Backdrop werden kann, ohne den Single-Root zu verdoppeln. */
.mg-code {
  position: relative;
}
.mg-code__window {
  position: relative;
  border-radius: 0.6rem;
  border: 1px solid #e5e7eb;
  background: var(--miragon-white);
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
  overflow: hidden;
}
.mg-code__bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem;
  background: var(--miragon-gray-light);
  border-bottom: 1px solid #e5e7eb;
}
.mg-code__bar-spacer {
  flex: 1 1 auto;
}
/* Ohne file/lang schwebt nur der Expand-Button oben rechts über dem Code. */
.mg-code__bar--bare {
  position: absolute;
  top: 0.35rem;
  right: 0.4rem;
  padding: 0;
  background: transparent;
  border-bottom: none;
  z-index: 2;
}
.mg-code__bar--bare .mg-code__bar-spacer {
  display: none;
}
.mg-code__file {
  font-family: var(--miragon-font-mono, ui-monospace, monospace);
  font-size: 0.78rem;
  color: var(--miragon-text-muted);
}
.mg-code__lang {
  font-family: var(--miragon-font-mono, ui-monospace, monospace);
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--miragon-blue-dark);
  background: var(--miragon-blue-light);
  border-radius: 0.35rem;
  padding: 0.1rem 0.45rem;
}
.mg-code__body {
  padding: 0.4rem 0.5rem;
}

.mg-code__toggle {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.85);
  color: var(--miragon-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.mg-code:hover .mg-code__toggle,
.mg-code__toggle:focus-visible {
  opacity: 1;
}
.mg-code__toggle:hover {
  color: var(--miragon-blue);
  border-color: var(--miragon-blue-warm);
  background: var(--miragon-white);
}
.mg-code__toggle-icon {
  display: block;
  font-size: 1.05rem;
}

/* Vollbild: an <body> teleportiert, daher außerhalb der Slide-Transform. */
.mg-code--expanded {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vh 4vw;
  background: rgba(13, 13, 43, 0.55);
  backdrop-filter: blur(2px);
  animation: mg-code-fade 0.16s ease;
}
@keyframes mg-code-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Flex-Spalte: Kopfzeile bleibt statisch oben, nur der Body scrollt. */
.mg-code--expanded .mg-code__window {
  display: flex;
  flex-direction: column;
  width: min(1100px, 92vw);
  max-height: 88vh;
  overflow: hidden;
  border-radius: 0.9rem;
  box-shadow: 0 24px 60px rgba(13, 13, 43, 0.45);
}
.mg-code--expanded .mg-code__bar {
  flex: 0 0 auto;
}
.mg-code--expanded .mg-code__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
.mg-code--expanded .mg-code__toggle {
  opacity: 1;
}
.mg-code--expanded .mg-code__body :deep(.slidev-code) {
  overflow: visible;
}
/* Kein scrollbar-width/-color: sonst ignoriert Chrome ::-webkit-scrollbar und
   fällt auf den (auf macOS ausgeblendeten) Overlay-Scrollbar zurück. */
.mg-code--expanded .mg-code__body::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.mg-code--expanded .mg-code__body::-webkit-scrollbar-track {
  background: transparent;
}
.mg-code--expanded .mg-code__body::-webkit-scrollbar-thumb {
  background: rgba(51, 93, 229, 0.3);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.mg-code--expanded .mg-code__body::-webkit-scrollbar-thumb:hover {
  background: rgba(51, 93, 229, 0.5);
}

.mg-code--expanded .mg-code__window :deep(.slidev-code) {
  font-size: var(--mg-code-expanded-size, max(1.25rem, var(--mg-code-size, 0px))) !important;
}

/* Shiki-Fence: Rahmen aus code.css zurücksetzen, die Komponente besitzt ihn. */
.mg-code__body :deep(.slidev-code) {
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  padding: 0.5rem 0.6rem;
  background: transparent;
}
.mg-code__body :deep(.slidev-code code) {
  background: transparent;
  padding: 0;
}
/* Slidev pinnt .slidev-code font-size mit !important, daher hier auch. */
.mg-code--sized :deep(.slidev-code) {
  font-size: var(--mg-code-size) !important;
}

/* Toggle nie im PDF-Export. */
:global(.print) .mg-code__toggle,
:global(.print-slide-container) .mg-code__toggle {
  display: none;
}
</style>
