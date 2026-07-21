<script setup lang="ts">
/**
 * person — Person(en) vorstellen (STATISCHE Welt, kein Mesh-Shader).
 *
 * Folgt der `hero`-Bildsprache: heller Grund, viel Weißraum, große Typografie,
 * sparsamer Gradient-Akzent.
 *
 * Zwei Modi:
 *   • Einzeln  — Porträt + Textblock (Name, Rolle, Bio als Slot).
 *   • Duo      — sobald `name2` gesetzt ist: zwei Speaker nebeneinander.
 *
 * Porträt-Rahmen ist robust: zeigt `photo`, wenn gesetzt — sonst Initialen aus
 * dem Namen auf einem Gradient-Rahmen (nie ein kaputtes Bild-Icon). Der Rahmen
 * ist im Hochformat gehalten, passend zu freigestellten Brand-Fotos.
 *
 * Frontmatter-Props (keine Multi-Line-Props → 2. Person über *2-Felder):
 *   name,  role,  photo   — erste Person
 *   name2, role2, photo2  — zweite Person (aktiviert den Duo-Modus)
 *   eyebrow  — kleine Überzeile (optional)
 *   accent   — "blue" | "green" | "mixed" — Gradient-Akzent (default blue)
 *   side     — "left" | "right" — Porträt-Seite im Einzel-Modus (default left)
 * Slot: Kurzbio (einzeln) bzw. optionaler zentrierter Einleitungssatz (Duo).
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name?: string
    role?: string
    photo?: string
    name2?: string
    role2?: string
    photo2?: string
    eyebrow?: string
    accent?: 'blue' | 'green' | 'mixed'
    side?: 'left' | 'right'
  }>(),
  { accent: 'blue', side: 'left' },
)

const isDuo = computed(() => !!props.name2)

// Base-Pfad respektieren (GitHub Pages baut unter /<repo>/). Runtime-Strings
// werden von Vite NICHT umgeschrieben — daher manuell mit BASE_URL auflösen.
function withBase(path?: string) {
  if (!path) return path
  if (/^https?:\/\//.test(path)) return path
  return import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}
const photoSrc = computed(() => withBase(props.photo))
const photo2Src = computed(() => withBase(props.photo2))

// Token reaktiv (siehe hero.vue) — alle Werte aus theme.css, keine Hex.
const gradientVar = computed(() => `var(--miragon-gradient-${props.accent})`)
const roleVar = computed(() =>
  props.accent === 'green' ? 'var(--miragon-green-deep)' : 'var(--miragon-blue)',
)

function toInitials(name?: string) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase()
}
const initials = computed(() => toInitials(props.name))
const initials2 = computed(() => toInitials(props.name2))

function onPhotoError(e: Event) {
  // Bild fehlt → Rahmen leeren, Initialen-Fallback übernimmt das Layout drumherum.
  ;(e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <div
    class="person-layout"
    :class="[isDuo ? 'is-duo' : `side-${side}`]"
    :style="{ '--p-grad': gradientVar, '--p-role': roleVar }"
  >
    <!-- ────────── Einzel-Modus ────────── -->
    <div v-if="!isDuo" class="person-content">
      <figure class="person-figure">
        <img v-if="photo" :src="photoSrc" :alt="name" class="person-photo" @error="onPhotoError" />
        <span v-else class="person-initials">{{ initials }}</span>
      </figure>

      <div class="person-text">
        <span class="person-bar" aria-hidden="true"></span>
        <div v-if="eyebrow" class="person-eyebrow">{{ eyebrow }}</div>
        <h1 v-if="name" class="person-name">{{ name }}</h1>
        <div v-if="role" class="person-role">{{ role }}</div>
        <div class="person-bio"><slot /></div>
      </div>
    </div>

    <!-- ────────── Duo-Modus ────────── -->
    <div v-else class="person-duo">
      <span class="person-bar duo-bar" aria-hidden="true"></span>
      <div v-if="eyebrow" class="person-eyebrow duo-eyebrow">{{ eyebrow }}</div>
      <div class="duo-lead"><slot /></div>

      <div class="duo-grid">
        <figure class="duo-card">
          <div class="person-figure">
            <img v-if="photo" :src="photoSrc" :alt="name" class="person-photo" @error="onPhotoError" />
            <span v-else class="person-initials">{{ initials }}</span>
          </div>
          <h2 class="duo-name">{{ name }}</h2>
          <div v-if="role" class="duo-role">{{ role }}</div>
        </figure>

        <figure class="duo-card">
          <div class="person-figure">
            <img v-if="photo2" :src="photo2Src" :alt="name2" class="person-photo" @error="onPhotoError" />
            <span v-else class="person-initials">{{ initials2 }}</span>
          </div>
          <h2 class="duo-name">{{ name2 }}</h2>
          <div v-if="role2" class="duo-role">{{ role2 }}</div>
        </figure>
      </div>
    </div>
  </div>
</template>

<style scoped>
.person-layout {
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

/* --- Porträt-Rahmen (geteilt: Einzel + Duo) ------------------------------- */
.person-figure {
  flex: 0 0 auto;
  aspect-ratio: 4 / 5;
  border-radius: 1.4rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-grad);
  box-shadow: 0 18px 48px rgba(13, 13, 43, 0.18);
}
.person-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}
.person-initials {
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--miragon-white);
}

/* --- Akzent-Balken & Eyebrow (geteilt) ------------------------------------ */
.person-bar {
  width: 3.5rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--p-grad);
  margin-bottom: 1.5rem;
}
.person-eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--p-role);
  margin-bottom: 0.9rem;
}

/* ═══════════ Einzel-Modus ═══════════ */
.person-content {
  display: flex;
  align-items: center;
  gap: 4.5rem;
  width: 100%;
  max-width: 64rem;
  padding: 0 5rem;
}
.side-right .person-content {
  flex-direction: row-reverse;
}
.person-content .person-figure {
  width: clamp(12rem, 21vw, 16.5rem);
}
.person-content .person-initials {
  font-size: clamp(3rem, 6vw, 4.75rem);
}

.person-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.person-name {
  font-size: clamp(2.4rem, 4.4vw, 3.4rem);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--miragon-text-primary);
  margin: 0;
}
.person-role {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--p-role);
  margin-top: 0.6rem;
}
.person-bio :deep(p) {
  font-size: 1.15rem;
  line-height: 1.6;
  font-weight: 400;
  color: var(--miragon-text-secondary);
  margin: 1.5rem 0 0;
  max-width: 34rem;
}

/* ═══════════ Duo-Modus ═══════════ */
.person-duo {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 60rem;
  padding: 0 4rem;
}
.duo-bar {
  margin-bottom: 1.25rem;
}
.duo-eyebrow {
  margin-bottom: 0.5rem;
}
.duo-lead :deep(p) {
  font-size: 1.15rem;
  line-height: 1.55;
  color: var(--miragon-text-secondary);
  margin: 0 0 2.5rem;
  max-width: 40rem;
}
.duo-lead :deep(p:only-child) {
  margin-bottom: 2.5rem;
}
.duo-grid {
  display: flex;
  justify-content: center;
  gap: 4rem;
  width: 100%;
}
.duo-card {
  flex: 1 1 0;
  max-width: 20rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.duo-card .person-figure {
  width: clamp(8.5rem, 15vw, 12rem);
}
.duo-card .person-initials {
  font-size: clamp(2.2rem, 4.5vw, 3.4rem);
}
.duo-name {
  font-size: clamp(1.4rem, 2.6vw, 1.85rem);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--miragon-text-primary);
  margin: 1.4rem 0 0;
}
.duo-role {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--p-role);
  margin-top: 0.4rem;
}
</style>
