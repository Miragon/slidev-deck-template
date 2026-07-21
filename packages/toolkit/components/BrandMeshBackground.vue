<script setup lang="ts">
/**
 * BrandMeshBackground — animierter WebGL2 Mesh-Gradient-Hintergrund (Miragon CI).
 *
 * HEILIG: Farbstops und Parameter stammen 1:1 aus dem bestehenden
 * @miragon/slidev-theme. Nicht ohne Rücksprache ändern.
 *
 * Verwendung: liegt als unterste Ebene (z-index 0) in den animierten
 * Layouts (cover, closing). pointer-events:none, damit Klicks durchgehen.
 * Fallback-Navy #0d0d2b für den ersten Frame / kein WebGL.
 */
import { onMounted, onBeforeUnmount, ref } from 'vue'
import {
  ShaderMount,
  meshGradientFragmentShader,
  getShaderColorFromString,
  defaultObjectSizing,
  ShaderFitOptions,
} from '@paper-design/shaders'

// --- Heilige Markenparameter (DO NOT CHANGE) -------------------------------
const COLORS = ['#335DE5', '#1a1a4e', '#00E676', '#335DE5', '#0d0d2b', '#00C853']
const DISTORTION = 1      // Verformung der Farbfelder
const SWIRL = 0.5         // Verwirbelung der Übergänge
const SPEED = 0.6         // Animationsgeschwindigkeit
// ---------------------------------------------------------------------------

const host = ref<HTMLDivElement | null>(null)
let mount: ShaderMount | null = null

onMounted(() => {
  if (!host.value) return
  try {
    // Sizing/Fit-Uniforms explizit übergeben (sonst nutzt der Shader Default-
    // Werte, die je nach Slide-Format zu inkonsistentem Crop/Scale führen).
    const uniforms = {
      u_colors: COLORS.map((c) => getShaderColorFromString(c)),
      u_colorsCount: COLORS.length,
      u_distortion: DISTORTION,
      u_swirl: SWIRL,
      u_grainMixer: 0,
      u_grainOverlay: 0,
      u_fit: ShaderFitOptions[defaultObjectSizing.fit],
      u_rotation: defaultObjectSizing.rotation,
      u_scale: defaultObjectSizing.scale,
      u_offsetX: defaultObjectSizing.offsetX,
      u_offsetY: defaultObjectSizing.offsetY,
      u_originX: defaultObjectSizing.originX,
      u_originY: defaultObjectSizing.originY,
      u_worldWidth: defaultObjectSizing.worldWidth,
      u_worldHeight: defaultObjectSizing.worldHeight,
    }
    // Performance (rührt die heiligen COLORS/DISTORTION/SWIRL/SPEED NICHT an):
    // die Library-Defaults erzwingen minPixelRatio=2 und cappen bei 1920*1080*4
    // (~8.3M) Pixeln, d. h. auf einem Retina-Display läuft dieser teure Mesh-
    // Gradient-Fragment-Shader über ~8.3M Pixel pro Frame und ruckelt. Ein weicher
    // Verlauf braucht keinen 4K-Backing-Store: Supersampling weg (minPixelRatio 1)
    // und den Render auf ~0.9M Pixel cappen. CSS skaliert das Canvas hoch, der Blur
    // kaschiert es.
    const MIN_PIXEL_RATIO = 1
    const MAX_PIXEL_COUNT = 640 * 360
    // Reduced-Motion respektieren: auf dem ersten Frame einfrieren (speed 0)
    // statt zu animieren — kostet ebenfalls nichts.
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    mount = new ShaderMount(
      host.value,
      meshGradientFragmentShader,
      uniforms,
      undefined,
      reduceMotion ? 0 : SPEED,
      0,
      MIN_PIXEL_RATIO,
      MAX_PIXEL_COUNT,
    )
    // WebGL läuft: den blurred, dauerhaft animierten CSS-Fallback-Layer abschalten.
    // Er liegt unsichtbar hinter dem nun opaken Canvas, kostet aber pro Frame
    // Compositor-Zeit (ein blur(48px)-Layer in doppelter Viewport-Größe), was die
    // FPS senkt und das Canvas während Slide-Transitions desynchronisiert.
    host.value.classList.add('webgl-active')
  } catch (e) {
    // WebGL nicht verfügbar (z. B. headless) → Fallback-Navy bleibt sichtbar.
    console.warn('[BrandMeshBackground] WebGL unavailable, falling back to solid navy.', e)
  }
})

onBeforeUnmount(() => {
  mount?.dispose()
  mount = null
})
</script>

<template>
  <div ref="host" class="mesh-bg" aria-hidden="true"></div>
</template>

<style scoped>
.mesh-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #0d0d2b; /* Navy-Basis für allerersten Frame */
  pointer-events: none;
  z-index: 0;
  overflow: hidden; /* hält den überdimensionierten Fallback-Layer im Rahmen */
}

/*
 * CSS-Fallback (additiv, ändert NICHT die heiligen Shader-Werte):
 * Animierter Mesh-Verlauf in den Markenfarben. Liegt HINTER dem Canvas.
 * - WebGL ok  → ShaderMount-Canvas ist opak und überdeckt diesen Layer.
 * - WebGL fehlt (Browser ohne GPU, `npm run export`/headless) → der Canvas
 *   bleibt transparent, dieser Layer scheint durch und animiert weiter.
 * Farben 1:1 aus der Mesh-Palette (Blau/Navy/Grün), kein totes Navy mehr.
 *
 * z-index: -2 → liegt HINTER dem Library-Canvas (der bei WebGL-Erfolg per
 * `@layer paper-shaders` z-index:-1 bekommt). So überdeckt der echte Shader
 * diesen Fallback; bei WebGL-Ausfall (transparenter/leerer Canvas) scheint er
 * über der Navy-Basis durch.
 */
.mesh-bg::before {
  content: '';
  position: absolute;
  z-index: -2;
  inset: -50%;
  background:
    radial-gradient(38% 38% at 24% 30%, #335DE5 0%, transparent 60%),
    radial-gradient(34% 34% at 76% 22%, #00E676 0%, transparent 60%),
    radial-gradient(44% 44% at 70% 76%, #00C853 0%, transparent 60%),
    radial-gradient(40% 40% at 28% 80%, #1a1a4e 0%, transparent 62%),
    radial-gradient(55% 55% at 50% 50%, #335DE5 0%, transparent 72%);
  filter: blur(48px);
  will-change: transform;
  animation: mesh-fallback-float 22s ease-in-out infinite alternate;
}

@keyframes mesh-fallback-float {
  0%   { transform: translate(-4%, -3%) scale(1.06) rotate(0deg); }
  50%  { transform: translate(3%, 2%)   scale(1.16) rotate(7deg); }
  100% { transform: translate(2%, -4%)  scale(1.10) rotate(-6deg); }
}

@media (prefers-reduced-motion: reduce) {
  .mesh-bg::before { animation: none; }
}

/* WebGL erfolgreich: das opake Shader-Canvas überdeckt den Fallback, also den
   animierten Blur-Layer ganz weglassen (kein verschwendetes Compositing). */
.mesh-bg.webgl-active::before {
  display: none;
}

/* Canvas-Positionierung der Library NICHT überschreiben (sie setzt position
   absolute + z-index:-1 via @layer). Nur die Größe absichern. */
.mesh-bg canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
