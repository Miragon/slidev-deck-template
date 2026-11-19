<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, watch } from "vue"
import { withBase } from "vitepress"
import LandingDemo from "./LandingDemo.vue"

const installs = [
  { name: "<Kanal>", prompt: "$", lines: ["<Befehl zum Installieren>"] },
]
const steps = [
  { name: "<Verb>", link: "/<seite>#<anker>", command: "<befehl>", effect: "<Ein Satz Wirkung.>" },
]
// true when the work is a loop: the last step points back to 01.
const loop = true
// The link under the install box says what happens next, not "Get started".
const next = { text: "<Was danach passiert, etwa Build a first model>", link: "/<seite>" }
// Before 1.0 the marker is warning, from 1.0 on success; the text names experimental parts.
// Ground of the stage (landingpage.md, Variationsraum): "raster", "frei", "grau" or "schwarz".
const stage = "raster"
const status = { tone: "warning", label: "<Pre-1.0:>", text: "<pin the version, a minor can break a command.>" }

const selected = ref(0)
const copied = ref(false)

// One clock per page (landingpage.md, Bewegung): the demo starts it and its Pause button stops
// everything. The tabs switch every 6 s until the visitor hovers, focuses or chooses one.
const moving = ref(false)
provide("landing-moving", moving)
const chosen = ref(false)
const held = ref(false)
const cycling = computed(() => moving.value && !chosen.value && !held.value && installs.length > 1)
let tick: ReturnType<typeof setInterval> | undefined
watch(cycling, (on) => {
  clearInterval(tick)
  if (on) tick = setInterval(() => step(1), 6000)
})
onBeforeUnmount(() => clearInterval(tick))

function step(offset: number) {
  selected.value = (selected.value + offset + installs.length) % installs.length
}

function choose(index: number) {
  chosen.value = true
  selected.value = index
}

// Arrow keys move the selection and the focus together (ARIA tabs pattern).
const tabButtons = ref([] as HTMLButtonElement[])
async function selectBy(offset: number) {
  chosen.value = true
  step(offset)
  await nextTick()
  tabButtons.value[selected.value]?.focus()
}

async function copyInstall() {
  await navigator.clipboard.writeText(installs[selected.value].lines.join("\n"))
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <div class="landing">
    <section class="hero">
      <div class="frame hero-frame">
        <div class="pitch">
          <h1><Name des Werkzeugs></h1>
          <p class="slogan"><Ein Satz mit dem Gegensatz, den das Werkzeug auflöst.></p>
          <p class="lede">
            <Was es ist, für wen, und welche Garantie oder Grenze gilt. Höchstens 46 Zeichen je Zeile.>
          </p>

          <div
            class="install"
            :class="{ cycling }"
            @mouseenter="held = true"
            @mouseleave="held = false"
            @focusin="held = true"
            @focusout="held = false"
          >
            <div class="tabs" role="tablist" aria-label="Install" @keydown.right.prevent="selectBy(1)" @keydown.left.prevent="selectBy(-1)">
              <button
                v-for="(install, index) in installs"
                :key="install.name"
                ref="tabButtons"
                class="tab"
                role="tab"
                :aria-selected="index === selected"
                :tabindex="index === selected ? 0 : -1"
                @click="choose(index)"
              >
                {{ install.name }}
              </button>
            </div>
            <div class="command" role="tabpanel">
              <div class="channels">
                <pre
                  v-for="(install, index) in installs"
                  :key="install.name"
                  :class="{ hidden: index !== selected }"
                  :aria-hidden="index !== selected"
                ><template v-for="line in install.lines" :key="line"><span class="prompt">{{ install.prompt }} </span>{{ line }}
</template></pre>
              </div>
              <button class="copy" type="button" @click="copyInstall">{{ copied ? "Copied" : "Copy" }}</button>
            </div>
          </div>
          <p class="meta">
            <span><Voraussetzung, etwa Needs Node 22.12+></span>
            <span class="pre-release">
              <span class="marker" :class="status.tone" aria-hidden="true" />
              <span><strong>{{ status.label }}</strong> {{ status.text }}</span>
            </span>
          </p>
          <a class="start" :href="withBase(next.link)">{{ next.text }} <span aria-hidden="true">→</span></a>
        </div>

        <div class="stage" :class="stage" :data-cd-theme="stage === 'schwarz' ? 'dark' : undefined">
          <LandingDemo />
        </div>
      </div>
    </section>

    <section class="loop" aria-label="Why and how it works">
      <div class="frame">
        <div class="explainer">
          <div class="point">
            <h2>Why</h2>
            <p>
              <Eine gemessene Zahl zur Demo: der Weg ohne das Werkzeug gegen den Weg mit ihm.>
            </p>
          </div>
          <div class="point">
            <h2 id="how-it-works">How it works</h2>
            <p>
              <Ein bis zwei Sätze, wie man sich den Ablauf unten vorstellt.>
            </p>
          </div>
        </div>
        <ol class="steps" :style="{ '--steps': steps.length }">
          <li v-for="(step, index) in steps" :key="step.name" class="step">
            <div class="rail">
              <span class="node">0{{ index + 1 }}</span>
              <span v-if="loop && index === steps.length - 1" class="back">→ 01</span>
            </div>
            <h3>
              <a :href="withBase(step.link)">{{ step.name }} <span class="go" aria-hidden="true">→</span></a>
            </h3>
            <code>{{ step.command }}</code>
            <p>{{ step.effect }}</p>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  --gutter: 32px;
  --line: 1px solid var(--cd-ui-linie);
  display: flex;
  flex-direction: column;
  border-top: var(--line);
}

/* The frame lines up with the navigation bar above it. */
.frame {
  width: 100%;
  max-width: var(--vp-layout-max-width);
  margin: 0 auto;
}
@media (min-width: 1441px) {
  .frame {
    border-right: var(--line);
    border-left: var(--line);
  }
}

/* Hero: name, install and status on the left, the demo on the right, split 50/50. */
.hero {
  flex: 1;
  display: flex;
  min-height: 0;
}
.hero-frame {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.pitch {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px var(--gutter);
  border-bottom: var(--line);
}
h1 {
  margin: 0;
  font-size: clamp(56px, 8.4vh, 80px);
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.045em;
}
.slogan {
  margin: 14px 0 0;
  font-size: 24px;
  line-height: 1.3;
  font-weight: 500;
  letter-spacing: -0.015em;
  text-wrap: balance;
}
.lede {
  max-width: 46ch;
  margin: 14px 0 0;
  color: var(--cd-ui-text-leise);
  line-height: 1.55;
}

.install {
  margin-top: 28px;
  border: var(--line);
  border-radius: var(--cd-radius-sm);
  background: var(--cd-ui-abschnitt);
}
.tabs {
  display: flex;
  border-bottom: var(--line);
}
.tab {
  position: relative;
  padding: 11px 14px;
  border-right: var(--line);
  font: 500 13px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-text-leise);
}
.tab:first-child {
  border-top-left-radius: var(--cd-radius-sm);
}
.tab[aria-selected="true"] {
  color: var(--cd-ui-text);
  background: var(--cd-ui-seite);
}
.tab[aria-selected="true"]::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--cd-ui-interaktion);
  transform-origin: left;
}
/* While the tabs switch on their own, the line under the active tab fills in the 6 s. */
.cycling .tab[aria-selected="true"]::after {
  animation: fill 6s linear;
}
@keyframes fill {
  from {
    transform: scaleX(0);
  }
}
.command {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 12px 12px 16px;
}
.channels {
  display: grid;
  flex: 1;
  min-width: 0;
}
.command pre {
  grid-area: 1 / 1;
  margin: 0;
  font: 400 14px/1.7 var(--vp-font-family-mono);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.command pre.hidden {
  visibility: hidden;
}
.command .prompt {
  color: var(--cd-ui-text-leise);
  user-select: none;
}
.copy {
  flex: none;
  height: 32px;
  padding: 0 10px;
  border: var(--line);
  border-radius: var(--cd-radius-sm);
  font: 500 12px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-text);
}
.copy:hover {
  background: var(--cd-ui-hover);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 20px;
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--cd-ui-text-leise);
}
.meta > span:first-child {
  font: 400 12px/1.5 var(--vp-font-family-mono);
}
.pre-release {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--cd-ui-text);
}
.pre-release strong {
  font: 500 12px/1 var(--vp-font-family-mono);
}
.marker {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--cd-ui-warning);
}
.marker.success {
  background: var(--cd-ui-success);
}
.start {
  align-self: flex-start;
  margin-top: 24px;
  font-weight: 600;
  color: var(--cd-ui-link);
  text-decoration: none;
}
.start:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* The demo stands on a quiet grid, the drawing surface of a modeler. */
.stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 32px var(--gutter);
}
.stage.raster {
  background-image:
    linear-gradient(var(--cd-ui-linie) 1px, transparent 1px),
    linear-gradient(90deg, var(--cd-ui-linie) 1px, transparent 1px);
  background-size: 32px 32px;
  background-position: -1px -1px;
}
.stage.grau {
  background: var(--cd-ui-abschnitt);
}
.stage.frei :deep(.window) {
  border-color: var(--cd-ui-kontur);
}
.stage.schwarz {
  background: var(--cd-ui-seite);
  color: var(--cd-ui-text);
}

/* The loop: one sentence on how to picture it, then the four steps on one rail. */
.loop {
  flex: none;
  border-top: var(--line);
}
.explainer {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border-bottom: var(--line);
}
.point {
  padding: 14px var(--gutter) 16px;
}
.point + .point {
  border-top: var(--line);
}
.point h2 {
  margin: 0 0 4px;
  padding: 0;
  border: 0;
  font: 500 12px/20px var(--vp-font-family-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cd-ui-text-leise);
}
.point p {
  margin: 0;
  font-size: 15px;
  line-height: 23px;
}
.steps {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
}
.step {
  padding: 0 var(--gutter) 24px;
}
.rail {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
}
.rail::before {
  content: "";
  position: absolute;
  top: 50%;
  right: calc(-1 * var(--gutter));
  left: calc(-1 * var(--gutter));
  height: 2px;
  margin-top: -1px;
  background: var(--cd-ui-icon-akzent);
}
.step:first-child .rail::before {
  left: 0;
}
.step:last-child .rail::before {
  right: 0;
}
.step:not(:last-child) .rail::after {
  content: "";
  position: absolute;
  top: 50%;
  right: calc(-1 * var(--gutter) + 6px);
  margin-top: -5px;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid var(--cd-ui-icon-akzent);
}
.node {
  position: relative;
  display: inline-grid;
  place-items: center;
  height: 26px;
  min-width: 34px;
  padding: 0 6px;
  border: 2px solid var(--cd-ui-icon-akzent);
  border-radius: 4px;
  background: var(--cd-ui-seite);
  font: 500 12px/1 var(--vp-font-family-mono);
}
.back {
  position: relative;
  margin-left: auto;
  padding: 4px 0 4px 10px;
  background: var(--cd-ui-seite);
  font: 500 12px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-text-leise);
}
.step h3 {
  margin: 2px 0 10px;
  font-size: 26px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.step h3 a {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}
.step h3 a:hover {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-decoration-color: var(--cd-ui-interaktion);
  text-underline-offset: 5px;
}
.go {
  font: 500 18px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-text-leise);
  transition: transform var(--cd-motion-fast) var(--cd-ease), color var(--cd-motion-fast) var(--cd-ease);
}
.step h3 a:hover .go {
  color: var(--cd-ui-link);
  transform: translateX(3px);
}
.step code {
  display: block;
  padding: 6px 10px;
  border: var(--line);
  border-radius: 4px;
  background: var(--cd-ui-abschnitt);
  font: 400 14px/1.5 var(--vp-font-family-mono);
}
.step p {
  margin: 10px 0 0;
  font-size: 15px;
  color: var(--cd-ui-text-leise);
}

@media (min-width: 960px) {
  .hero-frame {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pitch {
    border-right: var(--line);
    border-bottom: 0;
  }
  .explainer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .point + .point {
    border-top: 0;
    border-left: var(--line);
  }
  .steps {
    grid-template-columns: repeat(var(--steps), minmax(0, 1fr));
  }
  .step {
    border-right: var(--line);
  }
  .step:last-child {
    border-right: 0;
  }
}

/* One screen on desktop: navigation, hero, loop and the legal row (53px) fill the viewport; on a
   short screen the page grows and scrolls instead of squeezing the hero. */
@media (min-width: 960px) and (min-height: 700px) {
  .landing {
    min-height: calc(100dvh - var(--vp-nav-height) - 53px);
  }
  .pitch {
    padding-top: 20px;
    padding-bottom: 20px;
  }
  h1 {
    font-size: clamp(48px, 7vh, 72px);
  }
  .slogan,
  .lede {
    margin-top: 10px;
  }
  .install {
    margin-top: 20px;
  }
  .start {
    margin-top: 16px;
  }
  .stage {
    container-type: size;
  }
  /* Fits the demo window into the stage height. Tuned for the terminal archetype: 64px stage padding,
     214px for titlebar, canvas padding and a four-line terminal, 4.25 the width-to-height ratio of the
     picture, 34px its horizontal padding. Another archetype measures its own parts and changes these. */
  .stage :deep(.window) {
    width: min(100%, calc((100cqh - 64px - 214px) * 4.25 + 34px));
  }
  .stage :deep(.terminal) {
    font-size: 11px;
    line-height: 1.6;
  }
}

@media (max-width: 640px) {
  .landing {
    --gutter: 20px;
  }
  .pitch {
    padding: 44px var(--gutter) 40px;
  }
  h1 {
    font-size: clamp(36px, 11.5vw, 56px);
  }
  .slogan {
    font-size: 21px;
  }
  .stage {
    padding: 24px 12px;
  }
  .command {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
  .command pre {
    width: 100%;
    font-size: 12px;
  }
  .copy {
    align-self: flex-end;
  }
  .step {
    display: grid;
    grid-template-columns: 34px 1fr;
    column-gap: 16px;
    padding: 0 var(--gutter);
  }
  .rail {
    grid-row: 1 / span 3;
    flex-direction: column;
    align-items: center;
    height: auto;
    padding-top: 22px;
  }
  .rail::before {
    top: 0;
    right: auto;
    bottom: 0;
    left: 50%;
    width: 2px;
    height: auto;
    margin: 0 0 0 -1px;
  }
  .step:first-child .rail::before {
    top: 34px;
    left: 50%;
  }
  .step:last-child .rail::before {
    right: auto;
    bottom: auto;
    height: 35px;
  }
  .step:not(:last-child) .rail::after {
    top: auto;
    right: auto;
    bottom: 4px;
    left: 50%;
    margin: 0 0 0 -5px;
    border-top: 8px solid var(--cd-ui-icon-akzent);
    border-right: 5px solid transparent;
    border-bottom: 0;
    border-left: 5px solid transparent;
  }
  .back {
    display: none;
  }
  .step h3 {
    margin: 20px 0 10px;
    font-size: 24px;
  }
  .step p {
    padding-bottom: 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .go {
    transition: none;
  }
}
</style>
