<script setup lang="ts">
/**
 * Chip — white pill with an optional Lucide icon and a short label.
 * Used in the `::content::` slot of the `interactive` layout for possible answers
 * or required materials; consecutive chips wrap onto further rows on their own.
 *
 *   <Chip icon="i-lucide-git-branch">git</Chip>
 */
defineProps<{
  icon?: string
}>()
</script>

<template>
  <span class="mg-chip">
    <span v-if="icon" class="mg-chip__icon" :class="icon" aria-hidden="true"></span>
    <span class="mg-chip__label"><slot /></span>
  </span>
</template>

<style scoped>
.mg-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0.2rem;
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--miragon-border);
  background: var(--miragon-white);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--miragon-blue) 8%, transparent);
  white-space: nowrap;
}
.mg-chip__icon {
  font-size: 1.15rem;
  color: var(--miragon-blue);
}
.mg-chip__label {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--miragon-text-primary);
}
</style>
