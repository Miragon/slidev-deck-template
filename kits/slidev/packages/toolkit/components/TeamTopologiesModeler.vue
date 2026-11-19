<script setup lang="ts">
/**
 * TeamTopologiesModeler: the addon's `<TeamTopologiesModeler>`, following the deck's dark mode.
 *
 * Shadows the addon component of the same name (theme components resolve
 * before addon components), so a slide keeps writing `<TeamTopologiesModeler>`. All attributes
 * pass through. The addon reads `theme` on mount, hence the key.
 */
import AddonTeamTopologiesModeler from 'slidev-addon-diagram-js/components/team-topologies/TeamTopologiesModeler.vue'
import { diagramTheme } from '../utils/colorScheme'
</script>

<template>
  <AddonTeamTopologiesModeler class="mg-scheme-aware" :theme="diagramTheme" :key="diagramTheme" />
</template>
