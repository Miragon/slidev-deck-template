<script setup lang="ts">
/**
 * Step — eine Zeile in einer <StepList>: nummeriertes Badge + fett gesetztes
 * Label + Fließtext. Die Nummer kommt aus einem CSS-Counter, den die StepList
 * zurücksetzt und jeder Step erhöht (kein index-Prop nötig).
 * Das Label nutzt die primäre Textfarbe, der Body erbt die Farbe der StepList.
 *   <Step label="Client">ruft … auf</Step>
 */
defineProps<{ label?: string }>()
</script>

<template>
  <div class="step">
    <span class="step__marker" aria-hidden="true"></span>
    <span class="step__body"><strong v-if="label" class="step__label">{{ label }}:</strong> <slot /></span>
  </div>
</template>

<style scoped>
.step {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  counter-increment: miragon-step;
}
.step__marker {
  flex: 0 0 auto;
  align-self: flex-start;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--miragon-blue);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.5rem;
  text-align: center;
}
.step__marker::before {
  content: counter(miragon-step);
}
.step__label {
  font-weight: 700;
  color: var(--miragon-text-primary);
}
</style>
