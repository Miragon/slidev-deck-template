<script setup lang="ts">
/**
 * CardGrid — gleichmaessiges Spalten-Raster fuer Karten/Figuren (Design-System §6).
 * Ersetzt das rohe `<div class="grid grid-cols-N gap-…">` im Markdown, damit Folien
 * keine Utility-Klassen tragen: nur semantische Tags. Karten im Grid strecken auf
 * gleiche Hoehe (align: stretch). `cols` setzt die Spaltenzahl, `gap` den Abstand.
 *
 *   <CardGrid cols="3">
 *     <Card title="…" accent="blue">…</Card>
 *     <Card title="…" accent="teal">…</Card>
 *     <Card title="…" accent="green">…</Card>
 *   </CardGrid>
 */
const props = withDefaults(
  defineProps<{
    cols?: number | string
    gap?: 'compact' | 'standard' | 'generous'
  }>(),
  { cols: 3, gap: 'standard' },
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
    :style="{ '--mg-cols': String(props.cols), '--mg-gap': GAPS[props.gap] }"
  >
    <slot />
  </div>
</template>

<style scoped>
.mg-card-grid {
  display: grid;
  grid-template-columns: repeat(var(--mg-cols), minmax(0, 1fr));
  gap: var(--mg-gap);
  align-items: stretch;
  margin-top: 0.5rem;
}
</style>
