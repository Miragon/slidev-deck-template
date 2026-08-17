<script setup lang="ts">
// Numbered step sequence beside a diagram. Wrap <Step> items; styling lives here.
//   <StepList><Step label="Client">calls …</Step></StepList>
</script>

<template>
  <div class="step-list"><slot /></div>
</template>

<style scoped>
.step-list {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  line-height: 1.5;
  color: var(--miragon-text-secondary);
  counter-reset: miragon-step;
}
/* Own the step typography regardless of content or host layout: the doubled
   `.step-list.step-list` (0,3,1) beats a host layout's prose `:deep()` (0,2,1),
   so steps keep their size even inside a large-prose layout. */
.step-list.step-list :deep(p),
.step-list.step-list :deep(ul),
.step-list.step-list :deep(ol),
.step-list.step-list :deep(li) {
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  max-width: none;
  margin: 0;
}
.step-list.step-list :deep(p + p) { margin-top: 0.4em; }
.step-list.step-list :deep(.step__body > p) { display: inline; margin: 0; }
.step-list.step-list :deep(strong) { font-weight: 700; color: var(--miragon-text-primary); }
.step-list.step-list :deep(a) {
  color: var(--miragon-blue);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}
</style>
