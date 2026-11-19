<script setup lang="ts">
/**
 * BpmnStatic — internal shim for the bpmn layout's `mode: static`.
 *
 * Renders the addon's `<Bpmn>` (still image, no interaction). It exists only
 * because the layout file is `bpmn.vue`: Vue infers the SFC's own name from its
 * filename, so a `<Bpmn>` tag inside that file compiles to a self-reference
 * (`_resolveComponent("Bpmn", true)`). Slidev's component auto-import does not
 * match that form, the layout then renders itself and shows an empty frame.
 * Here the filename differs, so `<Bpmn>` resolves to the addon as usual.
 *
 * Not meant for slides; use `layout: bpmn` with `mode: static`.
 */
defineProps<{
  bpmnFilePath?: string
  width?: string
  height?: string
}>()
</script>

<template>
  <Bpmn :bpmnFilePath="bpmnFilePath" :width="width" :height="height" />
</template>
