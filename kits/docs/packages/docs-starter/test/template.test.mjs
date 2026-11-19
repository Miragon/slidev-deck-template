import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EXAMPLE_DIR, PACKAGE_DIR, REPO_ROOT } from './support.mjs'

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

test('the example package.json is the consumer template: exact pins, mermaid 12, the consumer overrides', () => {
  const example = readJson(join(EXAMPLE_DIR, 'package.json'))
  const pins = example.devDependencies
  for (const [name, version] of Object.entries(pins)) assert.match(version, /^\d+\.\d+\.\d+$/, name)
  assert.equal(pins.mermaid.split('.')[0], '12')
  assert.equal(pins['vitepress-plugin-mermaid'], '2.0.17')
  assert.deepEqual(example.overrides, { vite: '6.4.5', 'vitepress-plugin-mermaid': { mermaid: '$mermaid' } })
  assert.equal(pins['@miragon/docs-starter'], undefined, 'consumers add the package with npm i -D -E; release-please cannot bump a pin here')
})

test('the monorepo root scopes the same overrides to the docs kit, so Slidev keeps its own vite', () => {
  const example = readJson(join(EXAMPLE_DIR, 'package.json'))
  const root = readJson(join(REPO_ROOT, 'package.json'))
  assert.deepEqual(root.overrides.vitepress, { vite: example.overrides.vite })
  assert.deepEqual(root.overrides['vitepress-plugin-mermaid'], { mermaid: example.devDependencies.mermaid })
  const installed = (path) => readJson(join(REPO_ROOT, 'node_modules', path, 'package.json')).version
  assert.equal(installed('mermaid'), example.devDependencies.mermaid, 'one mermaid for the whole monorepo')
  assert.equal(installed('vitepress/node_modules/vite'), example.overrides.vite)
  assert.ok(!existsSync(join(REPO_ROOT, 'node_modules/vitepress-plugin-mermaid/node_modules/mermaid')), 'the plugin takes the same mermaid')
})

test('the package declares what the theme imports and peers what the consumer pins', () => {
  const pkg = readJson(join(PACKAGE_DIR, 'package.json'))
  for (const font of ['@fontsource-variable/geist', '@fontsource-variable/geist-mono']) assert.match(pkg.dependencies[font], /^\d+\.\d+\.\d+$/, font)
  for (const peer of ['vitepress', 'vue', 'mermaid', 'vitepress-plugin-mermaid']) assert.ok(pkg.peerDependencies[peer], peer)
  assert.equal(pkg.exports['.'].default, './dist/config.js', 'Node loads compiled JS, it does not strip types under node_modules')
  assert.equal(pkg.exports['./theme'], './theme/index.ts', 'Vite compiles the theme')
  assert.equal(pkg.exports['./theme/*'], './theme/*', 'a site with its own theme can take single parts: miragon.css, LegalRow.vue')
})
