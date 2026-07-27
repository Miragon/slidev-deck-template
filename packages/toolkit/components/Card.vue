<script setup lang="ts">

const props = withDefaults(
  defineProps<{
    title?: string
    accent?: 'blue' | 'blue-mid' | 'teal' | 'green-deep' | 'green-mid' | 'green'
    padding?: 'compact' | 'standard' | 'generous'
    icon?: string
    align?: 'left' | 'center' | 'right'
  }>(),
  { accent: 'blue', padding: 'standard', align: 'left' },
)

const ACCENTS: Record<string, string> = {
  blue: '#335DE5',
  'blue-mid': '#2B5ACE',
  teal: '#1E7A8A',
  'green-deep': '#0E8E6E',
  'green-mid': '#00974F',
  green: '#00C263',
}
</script>

<template>
  <div class="mg-card" :class="[`mg-card--${props.padding}`, `mg-card--align-${props.align}`]">
    <span v-if="icon" class="mg-card__icon" :class="icon" :style="{ color: ACCENTS[props.accent] }" aria-hidden="true"></span>
    <h3 v-if="title" class="mg-card__title" :style="{ color: ACCENTS[props.accent] }">{{ title }}</h3>
    <div class="mg-card__body"><slot /></div>
  </div>
</template>

<style scoped>
.mg-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background: var(--miragon-white);
  box-shadow: 0 8px 20px rgba(51, 93, 229, 0.08);
}
.mg-card--compact { padding: 1rem; display: flex; flex-direction: column; }
.mg-card--standard { padding: 1.25rem; }
.mg-card--generous { padding: 1.5rem; }
.mg-card--align-center { text-align: center; }
.mg-card--align-right { text-align: right; }
.mg-card--align-center .mg-card__icon { margin-left: auto; margin-right: auto; }
.mg-card--align-right .mg-card__icon { margin-left: auto; }

.mg-card__icon {
  display: block;
  font-size: 1.6rem;
  margin-bottom: 0.6rem;
}
.mg-card__title {
  margin: 0;
  font-weight: 700;
  font-size: 1.05rem;
  line-height: 1.2;
}
.mg-card__body {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #4b5563;
}
.mg-card .mg-card__body :deep(p),
.mg-card .mg-card__body :deep(ul),
.mg-card .mg-card__body :deep(ol),
.mg-card .mg-card__body :deep(li),
.mg-card .mg-card__body :deep(h1),
.mg-card .mg-card__body :deep(h2),
.mg-card .mg-card__body :deep(h3),
.mg-card .mg-card__body :deep(h4) {
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  font-weight: inherit;
  max-width: none;
  margin: 0;
}
.mg-card .mg-card__body :deep(p + p) { margin-top: 0.6em; }
/* Small breath between a lead paragraph and the list it introduces. */
.mg-card .mg-card__body :deep(p + ul),
.mg-card .mg-card__body :deep(p + ol) { margin-top: 0.3em; }
.mg-card .mg-card__body :deep(ul),
.mg-card .mg-card__body :deep(ol) {
  list-style: none;
  padding: 0;
}
.mg-card .mg-card__body :deep(li) {
  position: relative;
  padding-left: 1.1rem;
}
.mg-card .mg-card__body :deep(li + li) { margin-top: 0.4em; }
.mg-card .mg-card__body :deep(li)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 0.1rem;
  background: var(--miragon-blue);
}
/* Numbered lists keep a decimal counter instead of the square marker. */
.mg-card .mg-card__body :deep(ol) { counter-reset: mg-card-ol; }
.mg-card .mg-card__body :deep(ol > li) { counter-increment: mg-card-ol; }
.mg-card .mg-card__body :deep(ol > li)::before {
  content: counter(mg-card-ol) '.';
  top: 0;
  width: auto;
  height: auto;
  border-radius: 0;
  background: none;
  color: var(--miragon-blue);
  font-weight: 700;
}
.mg-card .mg-card__body :deep(strong) { font-weight: 700; color: #1f2937; }
.mg-card .mg-card__body :deep(a) {
  color: var(--miragon-blue);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}
.mg-card--compact .mg-card__body { flex: 1 1 auto; display: flex; flex-direction: column; }
.mg-card--compact .mg-card__body :deep(.mg-figure) { margin-top: auto; }
</style>
