<script setup lang="ts">
/**
 * EventStorming: the addon's `<EventStorming>`, following the deck's dark mode.
 *
 * Shadows the addon component of the same name (theme components resolve
 * before addon components), so a slide keeps writing `<EventStorming>`. All attributes
 * pass through. The addon reads `theme` on mount, hence the key.
 */
import AddonEventStorming from 'slidev-addon-diagram-js/components/event-storming/EventStorming.vue'
import { diagramTheme } from '../utils/colorScheme'
</script>

<template>
  <AddonEventStorming class="mg-scheme-aware" :theme="diagramTheme" :key="diagramTheme" />
</template>
