import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PROFILE_DIR, profilePath, readProfile, writeProfile } from '../profiles.mjs'

function deckRootWithProfile(speaker, profile) {
  const root = mkdtempSync(join(tmpdir(), 'speaker-profiles-'))
  mkdirSync(join(root, PROFILE_DIR))
  writeFileSync(profilePath(root, speaker), JSON.stringify(profile))
  return root
}

test('a profile written before slides could be reduced reads with nothing reduced', () => {
  const root = deckRootWithProfile('thomas', { schemaVersion: 1, speaker: 'thomas', hidden: ['s-b'], order: null, knownIds: ['s-a', 's-b'] })

  const profile = readProfile(root, 'thomas')

  assert.deepEqual(profile.reduced, [])
  assert.deepEqual(profile.hidden, ['s-b'])
  assert.deepEqual(profile.knownIds, ['s-a', 's-b'])
})

test('a speaker without a profile file has nothing reduced', () => {
  const root = mkdtempSync(join(tmpdir(), 'speaker-profiles-'))

  assert.deepEqual(readProfile(root, 'nobody').reduced, [])
})

test('reduced slides are written sorted and without duplicates, and survive a round trip', () => {
  const root = mkdtempSync(join(tmpdir(), 'speaker-profiles-'))

  writeProfile(root, 'thomas', { hidden: ['s-z', 's-a'], reduced: ['s-c', 's-b', 's-c'], knownIds: ['s-a'] })

  const onDisk = JSON.parse(readFileSync(profilePath(root, 'thomas'), 'utf-8'))
  assert.deepEqual(onDisk.reduced, ['s-b', 's-c'])
  assert.deepEqual(onDisk.hidden, ['s-a', 's-z'])
  assert.equal(onDisk.schemaVersion, 1)
  assert.deepEqual(readProfile(root, 'thomas').reduced, ['s-b', 's-c'])
})

test('saving a profile that reduces nothing writes an empty list', () => {
  const root = mkdtempSync(join(tmpdir(), 'speaker-profiles-'))

  const written = writeProfile(root, 'thomas', { hidden: [], knownIds: [] })

  assert.deepEqual(written.reduced, [])
})
