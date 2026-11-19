<script setup lang="ts">
/**
 * QuizTime: a live-quiz slide for any quiz tool, one card per question dealt into a stack.
 *
 *   <QuizTime name="Icebreaker" href="https://example.com/quiz/start" questions="10"></QuizTime>
 *   <QuizTime name="Final Quiz" href="…" join="https://example.com/join" questions="8" sticker="A BPMN book for the winner">One question from each topic.</QuizTime>
 *   <QuizTime name="Bonus Round" href="…" kicker="Bonus round" sticker="Double points" sticker-label="Bonus" sticker-icon="i-lucide-zap"></QuizTime>
 *
 * `href` is where the speaker starts the quiz; `join` is the optional page the audience
 * opens on their phones, shown as a "Join at <host>" hint after the slot text.
 * The slot replaces the default "N questions, nothing graded." line. An optional sticker
 * is slapped onto the stack as a green circle; its label defaults to "Prize" and its icon
 * to a trophy (any Iconify class works). The deal replays every time the slide becomes
 * active and is off under prefers-reduced-motion, which shows the end state right away.
 */
import { computed } from 'vue'
import { useIsSlideActive } from '@slidev/client'

const props = withDefaults(
  defineProps<{
    name: string
    href: string
    join?: string
    kicker?: string
    questions?: number | string
    sticker?: string
    stickerLabel?: string
    stickerIcon?: string
  }>(),
  { questions: 10, kicker: 'Live quiz', stickerLabel: 'Prize', stickerIcon: 'i-lucide-trophy' },
)

const active = useIsSlideActive()
const count = computed(() => Number(props.questions))

const joinHost = computed(() => (props.join ? new URL(props.join).host.replace(/^www\./, '') : ''))

const MAX_FAN_DEGREES = 10

const stickerTextSize = computed(() => {
  const length = props.sticker?.length ?? 0
  if (length <= 16) return '1rem'
  if (length <= 28) return '0.85rem'
  return '0.72rem'
})

const backCards = computed(() => {
  const backs = Math.max(count.value - 1, 0)
  const step = backs > 0 ? Math.min(1.4, MAX_FAN_DEGREES / backs) : 0
  return Array.from({ length: backs }, (_, index) => {
    const fromTop = backs - index
    return { '--i': index, '--r': `${fromTop * step}deg`, '--x': `${fromTop * 1.5}px` }
  })
})
</script>

<template>
  <div class="qt" :class="{ 'qt--on': active }">
    <div class="qt__deck" aria-hidden="true">
      <div v-for="(style, index) in backCards" :key="index" class="qt__card" :style="style" />
      <div class="qt__card qt__card--face" :style="{ '--i': backCards.length, '--r': '0deg', '--x': '0px' }">
        <span class="qt__count">1 / {{ count }}</span>
        <span class="qt__mark">?</span>
      </div>
      <div v-if="sticker" class="qt__sticker">
        <span class="qt__sticker-icon" :class="stickerIcon" />
        <span class="qt__sticker-label">{{ stickerLabel }}</span>
        <span class="qt__sticker-text" :style="{ fontSize: stickerTextSize }">{{ sticker }}</span>
      </div>
    </div>

    <div class="qt__text">
      <div class="qt__kicker">{{ kicker }}</div>
      <div class="qt__name">{{ name }}</div>
      <p class="qt__meta">
        <slot>{{ count }} questions, nothing graded.</slot>
        <template v-if="join">
          Join at <a :href="join" target="_blank" rel="noopener">{{ joinHost }}</a> with your phone.
        </template>
      </p>
      <a class="qt__go" :href="href" target="_blank" rel="noopener">
        Start the quiz
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
      </a>
    </div>
  </div>
</template>

<style scoped>
.qt {
  display: grid;
  grid-template-columns: 18rem 1fr;
  gap: 3.5rem;
  align-items: center;
  margin-top: 1rem;
}

/* Card stack: pivots on its bottom-left corner, so no card leaves the text edge. */
.qt__deck {
  position: relative;
  height: 19rem;
}
.qt__card {
  position: absolute;
  left: 1.25rem;
  bottom: 3rem;
  width: 11.75rem;
  height: 13.5rem;
  border-radius: 1rem;
  background: var(--miragon-blue);
  border: 1px solid color-mix(in srgb, var(--miragon-white) 25%, transparent);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--miragon-black) 10%, transparent);
  transform-origin: 0 100%;
  transform: rotate(var(--r)) translateX(var(--x));
}
.qt__card--face {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.2rem 1.35rem;
  background: var(--miragon-surface);
  border-color: var(--miragon-line);
}
.qt__count {
  font-family: var(--miragon-font-mono);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--miragon-text-muted);
}
.qt__mark {
  font-size: 6.5rem;
  font-weight: 800;
  line-height: 0.8;
  letter-spacing: -0.04em;
  color: var(--miragon-accent);
}

/* Sticker: green surface, black text. */
.qt__sticker {
  position: absolute;
  left: 7.75rem;
  top: 1.5rem;
  width: 9.75rem;
  height: 9.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1.75rem 1.5rem;
  border-radius: 50%;
  background: var(--miragon-green);
  color: var(--miragon-black);
  text-align: center;
  transform: rotate(-12deg);
  box-shadow: 0 6px 14px color-mix(in srgb, var(--miragon-black) 18%, transparent);
}
.qt__sticker-icon {
  width: 2.1rem;
  height: 2.1rem;
  margin-bottom: 0.35rem;
}
.qt__sticker-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.qt__sticker-text {
  margin-top: 0.2rem;
  font-weight: 800;
  line-height: 1.15;
}

/* Name, meta line and button */
.qt__kicker {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--miragon-accent-text);
}
.qt__name {
  margin-top: 0.35rem;
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--miragon-text-primary);
}
.qt .qt__meta {
  margin: 0.85rem 0 1.6rem;
  font-size: 1.05rem;
  line-height: 1.45;
  color: var(--miragon-text-muted);
}
.qt__go {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 999px;
  background: var(--miragon-blue);
  color: var(--miragon-on-colour) !important;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none !important;
  border: none !important;
  transition: background 0.2s ease;
}
.qt__go:hover {
  background: var(--miragon-blue-link);
}
.qt__go svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Animation: only while the slide is active, so it replays on every visit. */
@media (prefers-reduced-motion: no-preference) {
  .qt--on .qt__card {
    animation: qt-deal 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--i) * 0.08s);
  }
  .qt--on .qt__sticker {
    animation: qt-slap 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 1.1s both;
  }
}

@keyframes qt-deal {
  from { opacity: 0; transform: rotate(0deg) translate(-2.5rem, 3.5rem); }
}
@keyframes qt-slap {
  from { opacity: 0; transform: rotate(-40deg) scale(1.8); }
  to { opacity: 1; transform: rotate(-12deg) scale(1); }
}
</style>
