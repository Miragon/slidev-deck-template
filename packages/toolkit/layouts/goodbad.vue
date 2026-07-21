<script setup lang="ts">
/**
 * goodbad — "Which one is right, and why?" (STATISCHE Welt, kein Mesh-Shader).
 *
 * Zwei neutrale weiße Panels nebeneinander, beschriftet "Model A" / "Model B".
 * Beim ersten Klick erscheinen Verdict-Badges (Recommended / Avoid) UND eine
 * kurze Regel-Legende — der Saal kann vorher selbst überlegen, welches Modell
 * besser ist, bevor die Auflösung kommt.
 *
 * Bewusst WEISSE Panels (anders als `compare`, das links/rechts semantisch
 * blau/grün einfärbt): das Modell-Verdict soll erst beim Reveal sichtbar
 * werden, eine Farbe würde es vorab verraten.
 *
 * Folgt der hero/content/compare-Bildsprache: heller Grund, klarer Akzent-Balken,
 * großzügige Typografie, ein einziger sparsamer Gradient-Akzent.
 *
 * Named Slots (in Markdown mit `::left::` / `::right::` / `::legend::`):
 *   left    — Inhalt von Model A (Text, kleines Code-Snippet, inline-SVG)
 *   right   — Inhalt von Model B
 *   legend  — kurze Regel, beim Klick mit den Verdicts zusammen sichtbar
 *
 * Frontmatter-Props:
 *   title       — Slide-Titel (optional)
 *   eyebrow     — kleine Überzeile (optional)
 *   prompt      — kursive Leitfrage als Subtitle (optional)
 *   leftIsGood  — true  → A ist "Recommended", B ist "Avoid"
 *                 false → A ist "Avoid",       B ist "Recommended" (default)
 *                 Bewusst pro Slide variieren, sodass "Recommended" nicht
 *                 immer auf derselben Seite landet.
 *   accent      — "blue" | "green" | "mixed" — Balken-/Eyebrow-Akzent (default blue)
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    prompt?: string
    leftIsGood?: boolean
    accent?: 'blue' | 'green' | 'mixed'
    // Slidev reicht das volle Frontmatter-Objekt als `frontmatter`-Prop durch.
    frontmatter?: Record<string, unknown>
  }>(),
  { accent: 'blue', leftIsGood: false },
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

// Verdict-Logik: leftIsGood entscheidet, welche Seite das grüne Recommended
// und welche das graue Avoid bekommt.
const leftVerdictLabel = computed(() => (props.leftIsGood ? 'Recommended' : 'Avoid'))
const rightVerdictLabel = computed(() => (props.leftIsGood ? 'Avoid' : 'Recommended'))
const leftVerdictClass = computed(() => (props.leftIsGood ? 'verdict-good' : 'verdict-bad'))
const rightVerdictClass = computed(() => (props.leftIsGood ? 'verdict-bad' : 'verdict-good'))
</script>

<template>
  <div
    class="goodbad-layout"
    :style="{ '--gb-grad': gradientVar, '--gb-accent': accentVar }"
  >
    <div class="goodbad-inner">
      <header v-if="title || eyebrow || prompt" class="goodbad-head">
        <span class="goodbad-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="goodbad-eyebrow">{{ eyebrow }}</div>
        <h2 v-if="title" class="goodbad-title">{{ title }}</h2>
        <p v-if="prompt" class="goodbad-prompt">{{ prompt }}</p>
      </header>

      <div class="goodbad-grid">
        <section class="goodbad-panel">
          <div class="panel-head">
            <span class="model-label">Model A</span>
            <v-click at="1">
              <span class="verdict" :class="leftVerdictClass">
                <span class="verdict-dot" aria-hidden="true"></span>
                <span class="verdict-label">{{ leftVerdictLabel }}</span>
              </span>
            </v-click>
          </div>
          <div class="panel-body"><slot name="left" /></div>
        </section>

        <section class="goodbad-panel">
          <div class="panel-head">
            <span class="model-label">Model B</span>
            <v-click at="1">
              <span class="verdict" :class="rightVerdictClass">
                <span class="verdict-dot" aria-hidden="true"></span>
                <span class="verdict-label">{{ rightVerdictLabel }}</span>
              </span>
            </v-click>
          </div>
          <div class="panel-body"><slot name="right" /></div>
        </section>
      </div>

      <v-click at="1">
        <div class="goodbad-legend"><slot name="legend" /></div>
      </v-click>
    </div>
  </div>
</template>

<style scoped>
.goodbad-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: stretch;
}

.goodbad-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 70rem;
  margin: 0 auto;
  padding: 3rem 5rem;
  display: flex;
  flex-direction: column;
}

/* --- Kopf: Balken + Eyebrow + Titel + kursive Leitfrage ------------------ */
.goodbad-head {
  flex: 0 0 auto;
  margin-bottom: 1.5rem;
}
.goodbad-bar {
  display: block;
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--gb-grad);
  margin-bottom: 1.1rem;
}
.goodbad-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gb-accent);
  margin-bottom: 0.6rem;
}
.goodbad-title {
  font-size: clamp(1.7rem, 2.8vw, 2.2rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--miragon-text-primary);
  margin: 0;
}
.goodbad-prompt {
  font-size: 1.05rem;
  font-style: italic;
  color: var(--miragon-text-muted);
  margin: 0.85rem 0 0;
  max-width: 46rem;
  line-height: 1.5;
}

/* --- Zwei weiße Panels (neutral; Verdict erscheint erst beim Klick) ------ */
.goodbad-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
.goodbad-panel {
  background: var(--miragon-white);
  border: 1px solid #E5E7EB;
  border-radius: 1.1rem;
  padding: 1.25rem 1.5rem 1.5rem;
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-height: 1.4rem;
  margin-bottom: 1rem;
}
.model-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--miragon-text-muted);
}
.verdict {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.verdict-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  display: inline-block;
}
.verdict-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.verdict-good .verdict-dot { background: var(--miragon-green-dark); }
.verdict-good .verdict-label { color: var(--miragon-green-deep); }
.verdict-bad .verdict-dot { background: var(--miragon-text-muted); }
.verdict-bad .verdict-label { color: var(--miragon-text-muted); }

/* --- Panel-Body: Markdown-Inhalt (Text, Code, kleines inline-SVG) -------- */
.panel-body {
  flex: 1 1 auto;
  min-height: 0;
}
.panel-body :deep(p) {
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--miragon-text-secondary);
  margin: 0 0 0.85rem;
}
.panel-body :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}
.panel-body :deep(ul) {
  list-style: none;
  padding: 0;
  margin: 0;
}
.panel-body :deep(li) {
  position: relative;
  font-size: 1.02rem;
  line-height: 1.45;
  color: var(--miragon-text-secondary);
  padding-left: 1.5rem;
  margin: 0 0 0.65rem;
}
.panel-body :deep(li)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 0.18rem;
  background: var(--gb-grad);
}
.panel-body :deep(code) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9em;
  background: var(--miragon-blue-light);
  color: var(--miragon-blue-darker);
  padding: 0.1em 0.4em;
  border-radius: 0.35rem;
}
.panel-body :deep(pre) {
  font-family: var(--miragon-font-mono);
  font-size: 0.9rem;
  background: var(--miragon-blue-light);
  color: var(--miragon-text-primary);
  padding: 0.8rem 1rem;
  border-radius: 0.5rem;
  margin: 0.4rem 0 0;
  overflow-x: auto;
}

/* --- Legende: kurze Regel unter den Panels, beim Klick mit eingeblendet -- */
.goodbad-legend {
  flex: 0 0 auto;
  margin-top: 1.5rem;
  padding: 0.9rem 1.2rem;
  background: var(--miragon-white);
  border: 1px solid #E5E7EB;
  border-radius: 0.8rem;
  box-shadow: 0 4px 12px rgba(51, 93, 229, 0.05);
}
.goodbad-legend :deep(p) {
  font-size: 1.02rem;
  line-height: 1.5;
  color: var(--miragon-text-secondary);
  margin: 0;
  text-align: center;
}
.goodbad-legend :deep(strong) {
  font-weight: 700;
  color: var(--miragon-text-primary);
}
</style>
