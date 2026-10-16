<script setup lang="ts">
/**
 * interactive — Hands the room to the audience (STATIC world, NO mesh shader).
 *
 * A plenum question or a short exercise: a round icon badge, an uppercase
 * kicker carrying the timer ("Over to you · 1 min"), the question or task as a
 * large black heading, an optional subline and optional supporting content
 * below it, typically a row of chips with possible answers or required
 * materials. Unlike `hero`, whose question the following slides answer, here
 * the audience answers.
 *
 * Frontmatter props:
 *   icon    — Lucide Iconify class for the badge (default i-lucide-message-square-text)
 *   kicker  — uppercase kicker above the heading, e.g. "Exercise · 10 min"
 * Slots:
 *   default     — h1 question or task + optional <p> subline
 *   ::content:: — optional content below the question; <Chip>s form a centred,
 *                 wrapping row, any other component takes the full width
 */
withDefaults(
  defineProps<{
    icon?: string
    kicker?: string
  }>(),
  { icon: 'i-lucide-message-square-text' },
)
</script>

<template>
  <div class="interactive-layout">
    <div class="interactive-content">
      <span class="interactive-badge" aria-hidden="true">
        <span class="interactive-badge-icon" :class="icon"></span>
      </span>
      <div v-if="kicker" class="interactive-kicker">{{ kicker }}</div>
      <div class="interactive-body">
        <slot />
      </div>
      <div v-if="$slots.content" class="interactive-extra">
        <slot name="content" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.interactive-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--miragon-gray-bg);
  color: var(--miragon-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.interactive-content {
  width: 100%;
  max-width: 48rem;
  padding: 0 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.interactive-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 999px;
  background: var(--miragon-blue);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--miragon-blue) 24%, transparent);
  margin-bottom: 1.5rem;
}

.interactive-badge-icon {
  font-size: 1.6rem;
  color: var(--miragon-white);
}

.interactive-kicker {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--miragon-blue);
  margin-bottom: 1rem;
}

.interactive-body :deep(h1) {
  font-size: 3.2rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--miragon-text-primary);
  margin: 0;
}

.interactive-body :deep(p) {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--miragon-text-muted);
  margin: 1.25rem 0 0;
}

.interactive-extra {
  width: 100%;
  margin-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  row-gap: 0.75rem;
}

.interactive-extra > :deep(:not(.mg-chip)) {
  flex: 1 0 100%;
  text-align: left;
}
</style>
