<script setup lang="ts">
/**
 * TeamTopologies: the addon's `<TeamTopologies>`, following the deck's dark mode.
 *
 * Shadows the addon component of the same name (theme components resolve
 * before addon components), so a slide keeps writing `<TeamTopologies>`. All attributes
 * pass through. The addon reads `theme` on mount, hence the key.
 */
import AddonTeamTopologies from 'slidev-addon-diagram-js/components/team-topologies/TeamTopologies.vue'
import { diagramTheme } from '../utils/colorScheme'
</script>

<template>
  <AddonTeamTopologies class="mg-scheme-aware" :theme="diagramTheme" :key="diagramTheme" />
</template>
