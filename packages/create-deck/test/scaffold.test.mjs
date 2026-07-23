// Structural smoke test for the scaffolder: run the CLI against the local
// checkout (CREATE_DECK_SKELETON) and assert it emits exactly the deck layout —
// the whitelist present, the template-only files absent, a clean standalone
// package.json whose versions are derived from the reference manifests. Fast: no
// npm install, node built-ins only. The heavier install/build/verify end-to-end
// runs in CI (scaffold-test.yml).

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
const SELF = JSON.parse(readFileSync(join(HERE, '..', 'package.json'), 'utf8'))

const run = (args) =>
  execFileSync('node', [CLI, ...args], {
    env: { ...process.env, CREATE_DECK_SKELETON: REPO_ROOT },
    encoding: 'utf8',
    stdio: 'pipe',
  })

/** A fresh, not-yet-existing target path plus a cleanup for its temp parent. */
function target(name = 'my-deck') {
  const parent = mkdtempSync(join(tmpdir(), 'scaffold-test-'))
  return { dir: join(parent, name), cleanup: () => rmSync(parent, { recursive: true, force: true }) }
}
const pkgOf = (dir) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))

let out
let cleanup
before(() => {
  ;({ dir: out, cleanup } = target())
  run([out])
})
after(() => cleanup())

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
    'deck/package.json', // workspace sub-manifest — replaced by the root package.json
  ]
  for (const f of forbidden) assert.ok(!existsSync(join(out, f)), `should not emit ${f}`)
})

test('generates a clean standalone package.json', () => {
  const pkg = pkgOf(out)
  assert.equal(pkg.workspaces, undefined, 'must not carry workspace config')
  assert.equal(pkg.private, true)
  assert.match(
    pkg.dependencies['@miragon/slidev-toolkit'],
    /^\d+\.\d+\.\d+$/,
    'toolkit must be an exact-pinned dependency',
  )
})

test('derives runtime + verify deps from the reference manifests', () => {
  const pkg = pkgOf(out)
  // Slidev runtime comes from the reference deck/package.json …
  for (const dep of ['@slidev/cli', 'slidev-addon-bpmn', 'slidev-addon-dmn', 'vue']) {
    assert.match(pkg.dependencies[dep], /^\d/, `missing runtime dep ${dep}`)
  }
  // … and the verify tooling from the root package.json.
  for (const dep of ['@playwright/test', 'playwright-chromium']) {
    assert.match(pkg.devDependencies[dep], /^\d/, `missing verify dep ${dep}`)
  }
})

test('--toolkit-version overrides the pinned default', () => {
  const t = target()
  try {
    run([t.dir, '--toolkit-version', '9.9.9'])
    assert.equal(pkgOf(t.dir).dependencies['@miragon/slidev-toolkit'], '9.9.9')
  } finally {
    t.cleanup()
  }
})

test('sanitizes the target basename into the package name', () => {
  const t = target('My Talk! 2026')
  try {
    run([t.dir])
    assert.equal(pkgOf(t.dir).name, 'my-talk-2026')
  } finally {
    t.cleanup()
  }
})

test('--version prints the package version', () => {
  assert.equal(run(['--version']).trim(), SELF.version)
})

test('refuses a non-empty target directory', () => {
  const busy = mkdtempSync(join(tmpdir(), 'scaffold-busy-'))
  writeFileSync(join(busy, 'keep'), 'x')
  try {
    run([busy])
    assert.fail('expected the CLI to refuse a non-empty directory')
  } catch (err) {
    assert.match(String(err.stderr), /not empty/, 'should explain the refusal')
  } finally {
    rmSync(busy, { recursive: true, force: true })
  }
})
