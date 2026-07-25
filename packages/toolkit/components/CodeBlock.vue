<script setup lang="ts">
/**
 * CodeBlock — beschriftetes Code-„Fenster" in Miragon-CI.
 *
 * Rahmt einen Markdown-Code-Fence (im Default-Slot) mit einer weißen Brand-Card
 * (wie <Card>: weiß, dünne Border, weicher blauer Schatten) und einer Kopfzeile
 * aus optionalem Dateinamen (links, Geist Mono, gedämpft) und optionalem
 * Sprach-Badge (rechts, blau — der einzige Brand-Akzent). Der eingebettete Fence
 * behält Shikis Syntax-Highlighting in Reinform; sein Rahmen und jeglicher
 * Zeilen-Hintergrund werden hier zurückgesetzt, damit die Komponente den Rahmen
 * besitzt und der Code klar auf Weiß steht.
 *
 * Props:
 *   file        Dateiname/Pfad in der Kopfzeile (optional).
 *   lang        Sprach-Badge rechts in der Kopfzeile (optional, z. B. "md").
 *   size        CSS-Schriftgröße des Codes (z. B. "0.9rem", "14px"); ohne
 *               Angabe die Standardgröße.
 *   hideHeader  Kopfzeile ausblenden, auch wenn file/lang gesetzt sind
 *               (Standard: sichtbar).
 *
 * Nutzung (Fence auf eigenen Zeilen, Leerzeilen drumherum, damit er als
 * Markdown geparst wird — wie die Bullet-Regel bei <SplitView>):
 *
 *   <CodeBlock file="deck/slides.md" lang="md">
 *
 *   ```md
 *   # Build decks like **code**
 *   ```
 *
 *   </CodeBlock>
 */
const props = defineProps<{
  file?: string
  lang?: string
  size?: string
  hideHeader?: boolean
}>()

const showHeader = () => Boolean((props.file || props.lang) && !props.hideHeader)
</script>

<template>
  <div class="mg-code" :class="{ 'mg-code--sized': size }" :style="size ? { '--mg-code-size': size } : undefined">
    <div v-if="showHeader()" class="mg-code__bar">
      <span v-if="file" class="mg-code__file">{{ file }}</span>
      <span v-if="lang" class="mg-code__lang">{{ lang }}</span>
    </div>
    <div class="mg-code__body"><slot /></div>
  </div>
</template>

<style scoped>
.mg-code {
  border-radius: 0.6rem;
  border: 1px solid #e5e7eb;
  background: var(--miragon-white);
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
  overflow: hidden;
}
.mg-code__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.9rem;
  background: var(--miragon-gray-light);
  border-bottom: 1px solid #e5e7eb;
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
/* The nested Shiki fence keeps its highlighting but drops the bare-fence frame
   from code.css — the component owns the border, radius and shadow. The inner
   <code> reset guards against any layout that tints inline code: fenced code
   must stay a clean, unhighlighted-background block. */
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
/* Optional per-instance font size. Slidev pins .slidev-code font-size with
   !important, so the override needs it too. Only emitted when `size` is set,
   leaving the default untouched otherwise. */
.mg-code--sized :deep(.slidev-code) {
  font-size: var(--mg-code-size) !important;
}
</style>
