<script setup lang="ts">
/**
 * global-bottom — dezenter Footer über JEDER Slide: Kapitel + Fortschritt,
 * optional ein Datum links.
 *
 * Slidev injiziert diese Datei per Namenskonvention aus dem Theme-Root als
 * globalen Layer. Sie zeigt ein kleines Label unten links, z. B.:
 *   "21 July 2026 · 01 · Welcome · 2 / 5"
 *
 * Kapitel-Erkennung (identisch zur Agenda.vue): jede `layout: section`-Slide
 * öffnet ein Kapitel; die Slides bis zur nächsten section gehören dazu. Die
 * Position zählt nur Content-Slides — die section-Slide selbst ist Position 0,
 * sodass die erste Content-Slide "1 / N" statt "2 / N" liest.
 *
 * Regeln:
 *   - Rein visuelles Overlay: transparenter Hintergrund, `pointer-events: none`,
 *     verdeckt niemals Slide-Inhalt (malt nur das kleine Text-Label).
 *   - Ausgeblendet auf cover/closing/section und überall, wo (noch) kein
 *     Kapitel aktiv ist (Cover, Agenda vor der ersten section).
 *   - Aktuelles Layout MUSS über useNav() gelesen werden — `$frontmatter` aus
 *     useSlideContext() ist in globalen Komponenten NICHT reaktiv.
 */
import { computed } from 'vue'
import { useNav } from '@slidev/client'

const { currentPage, total, slides } = useNav()

// Markdown-Bold (** **) überlebt in den auto-extrahierten Titel; entfernen.
function clean(s?: string): string {
  return (s ?? '').replace(/\*\*/g, '').trim()
}

interface Chapter {
  no: number // 1-basierte Seitennummer der section-Slide
  index: string // Kapitelnummer (aus frontmatter `index`, sonst Ordinalzahl)
  title: string // Kapiteltitel (h1 der section-Slide)
}

// Deck einmal durchlaufen: jede section-Slide startet ein Kapitel.
const chapters = computed<Chapter[]>(() => {
  const out: Chapter[] = []
  for (const route of slides.value as any[]) {
    const fm = route.meta?.slide?.frontmatter ?? {}
    if (fm.layout === 'section') {
      const n = out.length + 1
      out.push({
        no: route.no,
        index: clean(fm.index) || String(n).padStart(2, '0'),
        title:
          clean(route.meta?.slide?.title) || clean(fm.eyebrow) || `Chapter ${n}`,
      })
    }
  }
  return out
})

// Das Kapitel, in dem die aktuelle Slide liegt (mit Startseite der nächsten
// section als obere Grenze; für das letzte Kapitel ist die Grenze total + 1).
const current = computed(() => {
  const chs = chapters.value
  const page = currentPage.value
  for (let i = 0; i < chs.length; i++) {
    const next = i < chs.length - 1 ? chs[i + 1].no : total.value + 1
    if (page >= chs[i].no && page < next) {
      return { ...chs[i], next }
    }
  }
  return null
})

// "position / total" innerhalb des Kapitels; section-Slide selbst zählt nicht.
const chapterProgress = computed(() => {
  const c = current.value
  if (!c) return ''
  const position = currentPage.value - c.no
  const totalInChapter = c.next - 1 - c.no
  if (position < 1 || totalInChapter < 1) return ''
  return `${position} / ${totalInChapter}`
})

// Optionales Datum: Feld `eventDate` im Deck-Headmatter (erster Frontmatter-
// Block = Frontmatter der ersten Slide). Fehlt es, bleibt das Segment leer.
const dateLabel = computed(() => {
  const raw = (slides.value?.[0] as any)?.meta?.slide?.frontmatter?.eventDate
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
})

// Segmente in gewünschter Reihenfolge zusammensetzen: Datum · NN · Titel · n/N.
const footerText = computed(() => {
  const c = current.value
  if (!c) return ''
  const parts: string[] = []
  if (dateLabel.value) parts.push(dateLabel.value)
  if (c.index) parts.push(c.index)
  if (c.title) parts.push(c.title)
  if (chapterProgress.value) parts.push(chapterProgress.value)
  return parts.join(' · ')
})

// Auf den Voll-Bild-Slides ausblenden (gleiche Menge wie global-top.vue).
const HIDDEN_LAYOUTS = ['cover', 'closing', 'section']
const isHidden = computed(() => {
  const layout = (slides.value?.[currentPage.value - 1] as any)?.meta?.slide
    ?.frontmatter?.layout
  return HIDDEN_LAYOUTS.includes(layout)
})
</script>

<template>
  <div v-if="!isHidden && footerText" class="miragon-footer" aria-hidden="true">
    <span class="miragon-footer-text">{{ footerText }}</span>
  </div>
</template>

<style scoped>
.miragon-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  padding: 0 2rem 0.75rem;
  background: transparent;
  pointer-events: none;
}
.miragon-footer-text {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--miragon-text-muted);
}
</style>
