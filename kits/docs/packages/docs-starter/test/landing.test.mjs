import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { BUILD_DIR, TEMPLATES_DIR, buildSite, newSite } from './support.mjs'

after(() => rmSync(BUILD_DIR, { recursive: true, force: true }))

const HTML_TAG = /^<\/?(template|script|style|div|section|h[1-6]|p|span|a|pre|code|ol|li|button|figure|img|i|strong|br|LandingDemo|HomeLanding)\b/
const fillPlaceholders = (text) => text.replace(/<[^<>\n]+>/g, (tag) => (HTML_TAG.test(tag) ? tag : 'Example'))

test('the landing template builds once its placeholders are filled: frame, demo with pause, rail', () => {
  const site = newSite('landing')
  const landing = join(TEMPLATES_DIR, 'landing')
  for (const [source, target] of [
    ['index.md', 'index.md'],
    ['HomeLanding.vue', '.vitepress/theme/HomeLanding.vue'],
    ['LandingDemo.vue', '.vitepress/theme/LandingDemo.vue'],
    ['custom.css', '.vitepress/theme/custom.css'],
    ['theme-index.ts', '.vitepress/theme/index.ts'],
  ]) {
    writeFileSync(join(site, target), fillPlaceholders(readFileSync(join(landing, source), 'utf8')))
  }
  mkdirSync(join(site, 'public/shots'), { recursive: true })
  for (const picture of ['landing-demo-before.svg', 'landing-demo-after.svg']) {
    writeFileSync(join(site, 'public/shots', picture), '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')
  }

  const result = buildSite(site, '/')
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const index = readFileSync(join(site, '.vitepress/dist/index.html'), 'utf8')
  for (const pattern of ['class="landing"', 'class="raster stage"', 'class="steps"', 'role="tablist"', 'aria-pressed', '<footer class="miragon-legal"']) {
    assert.ok(index.includes(pattern), pattern)
  }
  assert.ok(!index.includes('VPHero'), 'no VitePress hero')
})
