<script setup lang="ts">
/**
 * WardleyMapModeler: the addon's `<WardleyMapModeler>`, following the deck's dark mode.
 *
 * Shadows the addon component of the same name (theme components resolve
 * before addon components), so a slide keeps writing `<WardleyMapModeler>`. All attributes
 * pass through. The addon reads `theme` on mount, hence the key.
 */
import AddonWardleyMapModeler from 'slidev-addon-diagram-js/components/wardley-maps/WardleyMapModeler.vue'
import { diagramTheme } from '../utils/colorScheme'
</script>

<template>
  <AddonWardleyMapModeler class="mg-scheme-aware" :theme="diagramTheme" :key="diagramTheme" />
</template>
