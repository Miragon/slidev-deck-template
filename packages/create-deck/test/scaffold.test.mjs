// Structural smoke test for the scaffolder: run the CLI against the local
// checkout (CREATE_DECK_SKELETON) and assert it emits exactly the deck layout —
// the whitelist present, the template-only files absent, a clean standalone
// package.json. Fast: no npm install, node built-ins only. The heavier
// install/build/verify end-to-end runs in CI (scaffold-test.yml).

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLI = join(HERE, '..', 'bin', 'index.mjs')
const REPO_ROOT = join(HERE, '..', '..', '..')

const scaffold = (dir) =>
  execFileSync('node', [CLI, dir], {
    env: { ...process.env, CREATE_DECK_SKELETON: REPO_ROOT },
    stdio: 'pipe',
  })

let parent
let out
before(() => {
  parent = mkdtempSync(join(tmpdir(), 'scaffold-test-'))
  out = join(parent, 'my-deck')
  scaffold(out)
})
after(() => rmSync(parent, { recursive: true, force: true }))

test('emits the deck skeleton', () => {
  const required = [
    'deck/slides.md',
    '.claude/skills/slides/SKILL.md',
    'CLAUDE.md',
    'verify/playwright.config.ts',
    '.npmrc',
    '.gitignore',
    '.github/workflows/build-and-deploy.yml',
    '.github/workflows/pin-check.yml',
  ]
  for (const f of required) assert.ok(existsSync(join(out, f)), `missing ${f}`)
})

test('omits the template-only files', () => {
  const forbidden = [
    'packages',
    'release-please-config.json',
    '.release-please-manifest.json',
    'LICENSE',
    'netlify.toml',
    '.github/workflows/release-please.yml',
    '.github/workflows/pr-title.yml',
  ]
  for (const f of forbidden) assert.ok(!existsSync(join(out, f)), `should not emit ${f}`)
})

test('generates a clean standalone package.json', () => {
  const pkg = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8'))
  assert.equal(pkg.workspaces, undefined, 'must not carry workspace config')
  assert.match(
    pkg.dependencies['@miragon/slidev-toolkit'],
    /^\d+\.\d+\.\d+$/,
    'toolkit must be an exact-pinned dependency',
  )
  assert.ok(!JSON.stringify(pkg).includes('__'), 'no unreplaced __PLACEHOLDER__ tokens')
})

test('refuses a non-empty target directory', () => {
  const busy = mkdtempSync(join(tmpdir(), 'scaffold-busy-'))
  writeFileSync(join(busy, 'keep'), 'x')
  assert.throws(() => scaffold(busy), 'must not overwrite existing content')
  rmSync(busy, { recursive: true, force: true })
})
