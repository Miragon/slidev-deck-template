<script setup lang="ts">
/**
 * CardGrid — Raster fuer Karten/Figuren (Design-System §6).
 * Ersetzt das rohe `<div class="grid grid-cols-N gap-…">` im Markdown, damit Folien
 * keine Utility-Klassen tragen: nur semantische Tags. Karten im Grid strecken auf
 * gleiche Hoehe (align: stretch).
 *
 * `direction` waehlt die Fliessrichtung:
 *   - `row` (Default): `cols` gleich breite Spalten, Karten laufen nebeneinander.
 *   - `column`: eine Spalte, Karten stapeln von oben nach unten (`cols` wird ignoriert).
 * `cols` setzt die Spaltenzahl (nur bei `row`), `gap` den Abstand.
 *
 *   <CardGrid cols="3">
 *     <Card title="…" accent="blue">…</Card>
 *     <Card title="…" accent="teal">…</Card>
 *     <Card title="…" accent="green">…</Card>
 *   </CardGrid>
 *
 *   <CardGrid direction="column">
 *     <Card title="…" accent="blue">…</Card>
 *     <Card title="…" accent="teal">…</Card>
 *   </CardGrid>
 */
const props = withDefaults(
  defineProps<{
    cols?: number | string
    gap?: 'compact' | 'standard' | 'generous'
    direction?: 'row' | 'column'
  }>(),
  { cols: 3, gap: 'standard', direction: 'row' },
)

const GAPS: Record<string, string> = {
  compact: '1rem',
  standard: '1.5rem',
  generous: '2rem',
}
</script>

<template>
  <div
    class="mg-card-grid"
    :class="`mg-card-grid--${props.direction}`"
    :style="{ '--mg-cols': String(props.cols), '--mg-gap': GAPS[props.gap] }"
  >
    <slot />
  </div>
</template>

<style scoped>
.mg-card-grid {
  display: grid;
  gap: var(--mg-gap);
  align-items: stretch;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.mg-card-grid--row {
  grid-template-columns: repeat(var(--mg-cols), minmax(0, 1fr));
}

.mg-card-grid--column {
  grid-template-columns: minmax(0, 1fr);
  grid-auto-flow: row;
}
</style>
