import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { excalidrawSvgFiles, toRel } from '../src/helpers.mjs'

test('excalidrawSvgFiles ignores build output under deck/dist', () => {
  const root = mkdtempSync(join(tmpdir(), 'validator-dist-'))
  const previousRoot = process.env.SLIDEV_VALIDATOR_ROOT
  process.env.SLIDEV_VALIDATOR_ROOT = root
  try {
    const committed = join(root, 'deck', 'chapter', '01-intro', 'resources')
    const built = join(root, 'deck', 'dist', 'assets')
    mkdirSync(committed, { recursive: true })
    mkdirSync(built, { recursive: true })
    writeFileSync(join(committed, 'flow.excalidraw.svg'), '<svg></svg>')
    writeFileSync(join(built, 'flow.excalidraw.svg'), '<svg></svg>')

    assert.deepEqual(excalidrawSvgFiles().map(toRel), ['deck/chapter/01-intro/resources/flow.excalidraw.svg'])
  } finally {
    if (previousRoot === undefined) delete process.env.SLIDEV_VALIDATOR_ROOT
    else process.env.SLIDEV_VALIDATOR_ROOT = previousRoot
    rmSync(root, { recursive: true, force: true })
  }
})
