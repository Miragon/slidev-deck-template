<script setup lang="ts">
/**
 * global-top — Slidev-Einhängepunkt für den oberen globalen Layer.
 *
 * Slidev injiziert per Namenskonvention NUR Dateien namens `global-top.*` aus
 * dem Theme-Root (Unterordner werden nicht gescannt). Diese Datei ist daher ein
 * schlanker Shim; die eigentliche Logik liegt aufgeräumt in `global/`.
 */
import ProgressBar from './global/ProgressBar.vue'
</script>

<template>
  <ProgressBar></ProgressBar>
</template>
