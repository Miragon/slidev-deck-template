<script setup lang="ts">
/**
 * EventStormingModeler: the addon's `<EventStormingModeler>`, following the deck's dark mode.
 *
 * Shadows the addon component of the same name (theme components resolve
 * before addon components), so a slide keeps writing `<EventStormingModeler>`. All attributes
 * pass through. The addon reads `theme` on mount, hence the key.
 */
import AddonEventStormingModeler from 'slidev-addon-diagram-js/components/event-storming/EventStormingModeler.vue'
import { diagramTheme } from '../utils/colorScheme'
</script>

<template>
  <AddonEventStormingModeler class="mg-scheme-aware" :theme="diagramTheme" :key="diagramTheme" />
</template>
