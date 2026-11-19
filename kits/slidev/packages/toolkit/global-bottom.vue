<script setup lang="ts">
/**
 * global-bottom — Slidev-Einhängepunkt für den unteren globalen Layer.
 *
 * Slidev injiziert per Namenskonvention NUR Dateien namens `global-bottom.*`
 * aus dem Theme-Root (Unterordner werden nicht gescannt). Diese Datei ist daher
 * ein schlanker Shim; die eigentliche Logik liegt aufgeräumt in `global/`.
 */
import ChapterFooter from './global/ChapterFooter.vue'
</script>

<template>
  <ChapterFooter></ChapterFooter>
</template>
