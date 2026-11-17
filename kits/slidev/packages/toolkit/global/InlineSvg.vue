<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ src: string; alt?: string }>(), { alt: '' })

const markup = ref('')
watch(() => props.src, async (url) => {
  markup.value = await (await fetch(url)).text()
}, { immediate: true })

defineExpose({ markup })
</script>

<template>
  <div
    class="mg-diagram-svg mg-scheme-aware"
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
    :aria-hidden="alt ? undefined : 'true'"
    v-html="markup"
  ></div>
</template>
