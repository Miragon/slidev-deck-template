<script setup lang="ts">
import { computed } from 'vue'
import { useNav } from '@slidev/client'
import { colorScheme, toggleColorScheme } from '../utils/colorScheme'

const { isPrintMode } = useNav()
const switchLabel = computed(() => (colorScheme.value === 'dark' ? 'Switch to light slides' : 'Switch to dark slides'))
</script>

<template>
  <button
    v-if="!isPrintMode"
    type="button"
    class="mg-scheme-switch"
    :aria-label="switchLabel"
    :title="switchLabel"
    @click.stop="toggleColorScheme"
  >
    <span :class="colorScheme === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" aria-hidden="true"></span>
  </button>
</template>

<style scoped>
.mg-scheme-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mg-switch-colour, var(--miragon-text-primary)) 40%, transparent);
  background: transparent;
  color: var(--mg-switch-colour, var(--miragon-text-primary));
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}
.mg-scheme-switch:hover,
.mg-scheme-switch:focus-visible {
  opacity: 1;
}
.mg-scheme-switch:focus-visible {
  outline: 2px solid var(--mg-switch-colour, var(--miragon-text-primary));
  outline-offset: 2px;
}
</style>
