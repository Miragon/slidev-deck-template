<script setup lang="ts">
/**
 * Step — eine Zeile in einer <StepList>: fett gesetztes Label + Fließtext.
 * Das Label nutzt die primäre Textfarbe, der Body erbt die Farbe der StepList.
 *   <Step label="Client">ruft … auf</Step>
 */
defineProps<{ label?: string }>()
</script>

<template>
  <div class="step"><strong v-if="label" class="step__label">{{ label }}:</strong> <slot /></div>
</template>

<style scoped>
.step__label {
  font-weight: 700;
  color: var(--miragon-text-primary);
}
</style>
