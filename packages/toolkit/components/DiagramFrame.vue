<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'compact' | 'standard' | 'generous'
    height?: string
  }>(),
  { padding: 'standard' },
)
</script>

<template>
  <div
    class="mg-frame"
    :class="`mg-frame--${padding}`"
    :style="height ? { height } : undefined"
  >
    <slot />
  </div>
</template>

<style scoped>
.mg-frame {
  box-sizing: border-box;
  background: var(--miragon-white);
  border: 1px solid #e5e7eb;
  border-radius: 1.1rem;
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.mg-frame--compact { padding: 0.75rem; }
.mg-frame--standard { padding: 1rem 1.25rem; }
.mg-frame--generous { padding: 1.75rem 2rem; }
</style>
