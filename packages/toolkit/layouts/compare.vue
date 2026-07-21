<script setup lang="ts">
/**
 * compare — Gegenüberstellung zweier Seiten (STATISCHE Welt, kein Mesh-Shader).
 *
 * Zwei gleichwertige Panels nebeneinander: vorher/nachher, manuell/automatisiert,
 * Option A/B. Die Panels sind WEISS (white-card rule, siehe slides Skill) —
 * die semantische Unterscheidung (links = Problem, rechts = Lösung) trägt die
 * Panel-Titel-Farbe (blue-deep vs. green-deep) sowie der Bullet-Marker (blauer
 * vs. grüner Gradient). Folgt der hero/person-Bildsprache: heller Grund, klarer
 * Akzent-Balken, große Typografie.
 *
 * Named Slots (in Markdown mit `::left::` / `::right::` befüllen):
 *   left   — Inhalt der linken Spalte (Bullets/Text)
 *   right  — Inhalt der rechten Spalte
 *   default — optionaler Einleitungssatz unter dem Titel
 *
 * Frontmatter-Props:
 *   title       — Slide-Titel (optional)
 *   eyebrow     — kleine Überzeile (optional)
 *   leftTitle   — Kopf des linken Panels (default "Before")
 *   rightTitle  — Kopf des rechten Panels (default "After")
 *   accent      — "blue" | "green" | "mixed" — Balken-/Eyebrow-Akzent (default blue)
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    leftTitle?: string
    rightTitle?: string
    accent?: 'blue' | 'green' | 'mixed'
    // Slidev reicht das volle Frontmatter-Objekt als `frontmatter`-Prop durch.
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue', leftTitle: 'Before', rightTitle: 'After' },
)

// `title` ist ein RESERVIERTES Slidev-Frontmatter-Feld (TOC/Nav) und wird NICHT
// als eigener Prop durchgereicht (FRONTMATTER_FIELDS). Daher aus dem
// mitgelieferten `frontmatter`-Objekt lesen, damit `title:` in slides.md wie
// dokumentiert funktioniert.
const title = computed(() => props.frontmatter?.title as string | undefined)

// Token reaktiv (siehe hero.vue) — alle Werte aus theme.css, keine Hex.
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const accentVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)

// Panel-Töne folgen dem accent: "mixed" trägt die Problem/Lösung-Semantik
// (links blau, rechts grün); "blue"/"green" macht beide Seiten einfarbig.
// Default bleibt mixed-artig (blau/grün), damit bestehende Decks unverändert sind.
const twoTone = computed(() => props.accent !== 'blue' && props.accent !== 'green')
const mono = computed(() => (props.accent === 'green' ? 'green-deep' : 'blue-deep'))
const leftTone = computed(() => (twoTone.value ? 'var(--miragon-blue-deep)' : `var(--miragon-${mono.value})`))
const rightTone = computed(() => (twoTone.value ? 'var(--miragon-green-deep)' : `var(--miragon-${mono.value})`))
const leftMark = computed(() => (twoTone.value || props.accent === 'blue' ? 'var(--miragon-gradient-blue)' : 'var(--miragon-gradient-green)'))
const rightMark = computed(() => (twoTone.value || props.accent === 'green' ? 'var(--miragon-gradient-green)' : 'var(--miragon-gradient-blue)'))
</script>

<template>
  <div
    class="compare-layout"
    :style="{ '--cmp-grad': gradientVar, '--cmp-accent': accentVar, '--cmp-left': leftTone, '--cmp-right': rightTone, '--cmp-left-mark': leftMark, '--cmp-right-mark': rightMark }"
  >
    <div class="compare-inner">
      <header v-if="title || eyebrow" class="compare-head">
        <span class="compare-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="compare-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="compare-title">{{ title }}</h2>
        <div class="compare-lead"><slot /></div>
      </header>

      <div class="compare-grid">
        <section class="compare-panel panel-left">
          <h3 class="panel-title">{{ leftTitle }}</h3>
          <div class="panel-body"><slot name="left" /></div>
        </section>

        <section class="compare-panel panel-right">
          <h3 class="panel-title">{{ rightTitle }}</h3>
          <div class="panel-body"><slot name="right" /></div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compare-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.compare-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 70rem;
  margin: 0 auto;
  padding: 3.5rem 5rem;
  display: flex;
  flex-direction: column;
}

/* --- Kopf ----------------------------------------------------------------- */
.compare-head {
  flex: 0 0 auto;
  margin-bottom: 2rem;
}
.compare-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--cmp-grad);
  margin-bottom: 1.25rem;
}
.compare-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cmp-accent);
  margin-bottom: 0.75rem;
}
.compare-title {
  font-size: clamp(1.9rem, 3.2vw, 2.7rem);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}
.compare-lead :deep(p) {
  font-size: 1.15rem;
  line-height: 1.55;
  color: var(--miragon-text-secondary);
  margin: 1rem 0 0;
  max-width: 46rem;
}

/* --- Zwei-Panel-Raster ---------------------------------------------------- */
.compare-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
/* Weisse Panels (white-card rule §6) — die Semantik trägt der Titel + Marker. */
.compare-panel {
  background: var(--miragon-white);
  border: 1px solid #E5E7EB;
  border-radius: 1.1rem;
  padding: 2rem 2rem 1.5rem;
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
}
.panel-title {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 1.25rem;
}
/* Titel-Farbe trägt die semantische Unterscheidung links=Problem / rechts=Lösung
   (bei accent "mixed"); bei accent "blue"/"green" sind beide Seiten einfarbig. */
.panel-left  .panel-title { color: var(--cmp-left); }
.panel-right .panel-title { color: var(--cmp-right); }

/* Panel-Body: Bullets mit Akzent-Marker passend zur Panel-Seite. */
.panel-body :deep(ul) {
  list-style: none;
  padding: 0;
  margin: 0;
}
.panel-body :deep(li) {
  position: relative;
  font-size: 1.1rem;
  line-height: 1.45;
  color: var(--miragon-text-secondary);
  padding-left: 1.7rem;
  margin: 0 0 0.95rem;
}
.panel-body :deep(li)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 0.18rem;
}
.panel-left .panel-body :deep(li)::before {
  background: var(--cmp-left-mark);
}
.panel-right .panel-body :deep(li)::before {
  background: var(--cmp-right-mark);
}
.panel-body :deep(p) {
  font-size: 1.1rem;
  line-height: 1.5;
  color: var(--miragon-text-secondary);
  margin: 0 0 0.9rem;
}
.panel-body :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}
</style>
