<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref } from "vue"
import { withBase } from "vitepress"

// Archetype "terminal and artifact": one real command, its real output and the artifact before and
// after, rendered by the tool itself (docs/shots/landing-demo.sh). Other archetypes replace this file.
const title = "<datei oder instanz>"
const command = "<der eine echte Befehl>"
const output = [
  { mark: "<created>", text: " <echte Zeile der Ausgabe>" },
  { mark: "", text: "<echte Zeile der Ausgabe>", quiet: true },
]

// The first paint (and reduced motion) shows the end state, so the demo never opens on an empty terminal.
const typedChars = ref(command.length)
const shownLines = ref(output.length)
const typing = ref(false)
const changed = ref(true)
// The clock of the page (HomeLanding.vue): Pause here also stops the switching tabs.
const moving = inject("landing-moving", ref(false))

let timer: ReturnType<typeof setTimeout> | undefined
const after = (ms: number, step: () => void) => {
  timer = setTimeout(step, ms)
}

function restart() {
  typedChars.value = 0
  shownLines.value = 0
  changed.value = false
  typing.value = true
  after(700, typeCommand)
}

function typeCommand() {
  if (typedChars.value < command.length) {
    typedChars.value += 1
    return after(32, typeCommand)
  }
  typing.value = false
  after(350, showOutput)
}

function showOutput() {
  changed.value = true
  if (shownLines.value < output.length) {
    shownLines.value += 1
    return after(260, showOutput)
  }
  after(5500, restart)
}

// WCAG 2.2.2: a loop that starts on its own needs a way to stop it. Stopping shows the end state.
function toggle() {
  clearTimeout(timer)
  moving.value = !moving.value
  if (moving.value) return after(600, restart)
  typedChars.value = command.length
  shownLines.value = output.length
  typing.value = false
  changed.value = true
}

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  moving.value = true
  after(3500, restart)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <figure class="window" aria-label="<Was der Befehl im Bild ändert, als ein Satz>">
    <div class="titlebar">
      <span class="dots" aria-hidden="true"><i /><i /><i /></span>
      <span>{{ title }}</span>
      <button class="toggle" type="button" :aria-pressed="!moving" @click="toggle">{{ moving ? "Pause" : "Play" }}</button>
    </div>
    <div class="canvas" data-cd-theme="light">
      <div class="pane">
        <img
          :class="{ hidden: changed }"
          :src="withBase('/shots/landing-demo-before.svg')"
          alt=""
          aria-hidden="true"
        />
        <img
          :class="{ hidden: !changed }"
          :src="withBase('/shots/landing-demo-after.svg')"
          alt="<Das Artefakt nach dem Befehl, als ein Satz>"
        />
      </div>
    </div>
    <div class="terminal">
      <p class="line"><span class="prompt">$ </span>{{ command.slice(0, typedChars) }}<span v-if="typing" class="caret" aria-hidden="true" /></p>
      <p
        v-for="(line, index) in output"
        :key="index"
        class="line"
        :class="{ pending: shownLines <= index, quiet: line.quiet }"
      ><span class="ok">{{ line.mark }}</span>{{ line.text }}</p>
    </div>
  </figure>
</template>

<style scoped>
.window {
  width: 100%;
  margin: 0;
  border: 1px solid var(--cd-ui-kontur);
  border-radius: var(--cd-radius-md);
  background: var(--cd-ui-seite);
  overflow: hidden;
}

.titlebar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 38px;
  padding: 0 14px;
  border-bottom: 1px solid var(--cd-ui-linie);
  font: 500 13px/1 var(--vp-font-family-mono);
}
.toggle {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: var(--cd-radius-sm);
  font: 500 11px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-text-leise);
}
.toggle:hover {
  background: var(--cd-ui-hover);
  color: var(--cd-ui-text);
}
.dots {
  display: flex;
  gap: 6px;
}
.dots i {
  width: 9px;
  height: 9px;
  border: 1px solid var(--cd-ui-kontur);
  border-radius: 50%;
}

.canvas {
  padding: 20px 16px;
  border-bottom: 1px solid var(--cd-ui-linie);
  background: var(--cd-ui-seite);
}
.pane {
  display: grid;
}
.pane img {
  grid-area: 1 / 1;
  width: 100%;
  height: auto;
  transition: opacity 0.6s var(--cd-ease);
}
.pane img.hidden {
  opacity: 0;
  transition: none;
}

.terminal {
  min-height: 122px;
  padding: 16px 18px;
  background: var(--cd-ui-flaeche);
  font: 400 12px/1.65 var(--vp-font-family-mono);
  color: var(--cd-ui-text);
}
.line {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.line.pending {
  visibility: hidden;
}
.prompt {
  color: var(--cd-ui-link);
  user-select: none;
}
.ok {
  color: var(--cd-ui-link);
}
.quiet {
  color: var(--cd-ui-text-leise);
}
.caret {
  display: inline-block;
  width: 7px;
  height: 14px;
  margin-left: 1px;
  vertical-align: -2px;
  background: var(--cd-ui-text);
}

@media (prefers-reduced-motion: reduce) {
  .pane img {
    transition: none;
  }
}
</style>
