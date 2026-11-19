<script setup lang="ts">
/**
 * Greying out inside Slidev's OWN overview.
 *
 * `SlideWrapper` renders `<SlideTop />` and the built-in overview uses
 * `SlideWrapper` with `render-context="overview"`, so this layer reaches every
 * card there and in the presenter's next-slide preview. That is why the addon
 * does not ship its own thumbnail grid: pressing `o` shows the real slides with
 * the switched-off ones dimmed, and the checkbox list lives in the editor panel.
 *
 * Interaction is not possible here: the overview wraps each card in
 * `pointer-events: none` and puts its own click handler on the parent.
 */
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import { ensureLoaded, isHidden } from './state'

const { $renderContext, $frontmatter } = useSlideContext()

// the standalone /overview/ page renders these without a GlobalTop above them
ensureLoaded()

const id = computed(() => ($frontmatter as any)?.['data-profile-id'] as string | undefined)
const show = computed(() =>
  (['overview', 'previewNext'].includes($renderContext.value))
  && isHidden(id.value),
)
</script>

<template>
  <div v-if="show" class="speaker-profiles-dim" data-testid="speaker-profiles-dim">
    <div class="speaker-profiles-dim-label">
      OFF
    </div>
  </div>
</template>

<style>
.speaker-profiles-dim {
  position: absolute;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 17, 24, 0.66);
  backdrop-filter: saturate(0.2);
}

.speaker-profiles-dim-label {
  font: 700 2.4rem/1 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.92);
  border: 3px solid rgba(255, 255, 255, 0.75);
  border-radius: 0.5rem;
  padding: 0.5rem 1.1rem;
}
</style>
