<script setup lang="ts">
/**
 * StepList — kompakte, beschriftete Schrittliste für die Seitenspalte neben
 * einem Diagramm (Laufzeit-/Deploymentsicht). Ersetzt handgestylte
 * <div style="font-size:…"><div style="margin-bottom:…"><strong style="…">-Blöcke.
 *
 * Styling lebt ausschließlich hier (Tokens aus theme.css), nie in slides.md.
 * Verwendung:
 *   <StepList>
 *   <Step label="Client">ruft … auf</Step>
 *   </StepList>
 */
</script>

<template>
  <div class="step-list"><slot /></div>
</template>

<style scoped>
.step-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--miragon-text-secondary);
}
</style>
