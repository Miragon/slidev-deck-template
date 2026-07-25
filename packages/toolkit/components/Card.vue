<script setup lang="ts">
/**
 * Card — kanonische weiße Brand-Card (Design-System §6).
 * Hintergrund IMMER weiß, Akzent NUR auf dem Titel. `accent` wählt einen Stop
 * der blue → teal → green-Progression (§6.3) — dies ist der einzige
 * sanktionierte Ort für rohe Hex-Werte, hier zentral statt im Deck verstreut.
 *
 * Mehrkartige Grids: Titel von links nach rechts entlang der Progression.
 *   2 Karten: blue, green
 *   3 Karten: blue, teal, green
 *   4 Karten: blue, blue-mid, green-deep, green
 *   <Card title="Deployment" accent="blue">Body …</Card>
 *
 * `icon` (optional): eine Iconify-UnoCSS-Klasse (`i-carbon-idea`, `i-ph-cube`, …).
 * Wird sie gesetzt, erscheint das Icon über dem Titel und trägt dieselbe
 * Akzentfarbe; ohne `icon` bleibt die Karte wie bisher rein textuell.
 * Der volle Klassenname muss so im Slide stehen, damit UnoCSS ihn beim
 * statischen Scan findet und generiert (Brand-Regel: Iconify `i-*`, kein Emoji).
 *   <Card title="Deployment" accent="blue" icon="i-carbon-rocket">Body …</Card>
 */
const props = withDefaults(
  defineProps<{
    title?: string
    accent?: 'blue' | 'blue-mid' | 'teal' | 'green-deep' | 'green-mid' | 'green'
    padding?: 'compact' | 'standard' | 'generous'
    icon?: string
  }>(),
  { accent: 'blue', padding: 'standard' },
)

// Die §6.3-Progressions-Stops. Bewusst lokal: der einzige sanktionierte Hex-Ort.
const ACCENTS: Record<string, string> = {
  blue: '#335DE5',
  'blue-mid': '#2B5ACE',
  teal: '#1E7A8A',
  'green-deep': '#0E8E6E',
  'green-mid': '#00974F',
  green: '#00C263',
}
</script>

<template>
  <div class="mg-card" :class="`mg-card--${props.padding}`">
    <span v-if="icon" class="mg-card__icon" :class="icon" :style="{ color: ACCENTS[props.accent] }" aria-hidden="true"></span>
    <h3 v-if="title" class="mg-card__title" :style="{ color: ACCENTS[props.accent] }">{{ title }}</h3>
    <div class="mg-card__body"><slot /></div>
  </div>
</template>

<style scoped>
.mg-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background: var(--miragon-white);
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
}
/* Nur Karten mit Zeichnung (compact) werden zur Flex-Spalte: im Grid stretchen
   die Karten auf gleiche Höhe, eine abschließende Zeichnung (margin-top:auto)
   dockt am Kartenboden an und liegt über alle Karten hinweg auf gleicher Höhe.
   Standard-Karten bleiben normaler Fluss, sonst würde inline <strong> im Body
   zu eigenen Flex-Items (eigene Zeilen) umbrechen. */
.mg-card--compact { padding: 1rem; display: flex; flex-direction: column; }
.mg-card--standard { padding: 1.25rem; }
.mg-card--generous { padding: 1.5rem; }
/* Optionales Icon über dem Titel: skaliert über font-size (die i-*-Klasse ist
   1em breit/hoch), Farbe via currentColor aus dem inline color = Akzent. */
.mg-card__icon {
  display: block;
  font-size: 1.6rem;
  margin-bottom: 0.6rem;
}
.mg-card__title {
  margin: 0;
  font-weight: 700;
  font-size: 1.05rem;
  line-height: 1.2;
}
.mg-card__body {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #4b5563;
}
.mg-card--compact .mg-card__body { flex: 1 1 auto; display: flex; flex-direction: column; }
/* A trailing diagram (<Figure src>) docks at the card bottom, so the image sits at
   the same position in every card of a stretched grid regardless of text length. */
.mg-card--compact .mg-card__body :deep(.mg-figure) { margin-top: auto; }
</style>
