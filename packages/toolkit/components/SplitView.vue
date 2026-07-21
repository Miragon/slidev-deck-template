<script setup lang="ts">
/**
 * SplitView — zweispaltiges „Visual + Erklärung"-Raster: links eine Grafik
 * (Diagramm-Komponente oder Bild über den #visual-Slot), rechts der erklärende
 * Text im Default-Slot (Bullets oder <StepList>). Ersetzt die handgestylten
 * <div class="grid grid-cols-2 …">-Wrapper in slides.md und vereinheitlicht
 * Spaltenverhältnis, Abstand und vertikale Ausrichtung.
 *
 * Beide Spalten sind standardmäßig vertikal zentriert (align="center"), damit
 * die Stichpunkte mittig zur Grafik sitzen.
 *
 * Props:
 *   ratio — Spaltenverhältnis links/rechts als "a/b" (Default "1/1";
 *           z. B. "1.5/1" für eine breitere Grafik)
 *   align — vertikale Ausrichtung der Spalten: "center" | "start" | "end" |
 *           "stretch" (Default "center")
 *   gap   — Spaltenabstand als CSS-Länge (Default "2.5rem")
 *
 * Verwendung:
 *   <SplitView ratio="1.5/1">
 *   <template #visual>
 *   <RuntimeView></RuntimeView>
 *   </template>
 *
 *   - Punkt eins
 *   - Punkt zwei
 *   </SplitView>
 *
 * Styling lebt ausschließlich hier; die Bullet-Marker kommen weiterhin vom
 * content-Layout, nie aus diesem Component.
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    ratio?: string
    align?: 'center' | 'start' | 'end' | 'stretch'
    gap?: string
  }>(),
  { ratio: '1/1', align: 'center', gap: '2.5rem' },
)

const columns = computed(() => {
  const parts = props.ratio.split('/').map((n) => n.trim() || '1')
  const left = parts[0] || '1'
  const right = parts[1] || '1'
  return `${left}fr ${right}fr`
})
</script>

<template>
  <div
    class="mg-split"
    :style="{ gridTemplateColumns: columns, alignItems: align, gap }"
  >
    <div class="mg-split__visual"><slot name="visual" /></div>
    <div class="mg-split__body"><slot /></div>
  </div>
</template>

<style scoped>
.mg-split {
  display: grid;
  margin-top: 0.5rem;
}
/* min-width:0 verhindert, dass breite Grafiken die Spalte über fr sprengen. */
.mg-split__visual,
.mg-split__body {
  min-width: 0;
}
</style>
