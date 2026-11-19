<script setup lang="ts">
/**
 * WardleyMap: the addon's `<WardleyMap>`, following the deck's dark mode.
 *
 * Shadows the addon component of the same name (theme components resolve
 * before addon components), so a slide keeps writing `<WardleyMap>`. All attributes
 * pass through. The addon reads `theme` on mount, hence the key.
 */
import AddonWardleyMap from 'slidev-addon-diagram-js/components/wardley-maps/WardleyMap.vue'
import { diagramTheme } from '../utils/colorScheme'
</script>

<template>
  <AddonWardleyMap class="mg-scheme-aware" :theme="diagramTheme" :key="diagramTheme" />
</template>
