import { test } from 'node:test'
import assert from 'node:assert/strict'
import { githubSlug } from '@miragon/docs-starter/slug'

test('anchors match GitHub: dots and punctuation go, umlauts and hyphens stay', () => {
  const cases = {
    'Changes from 0.6': 'changes-from-06',
    'Über uns': 'über-uns',
    'C++ & C#': 'c--c',
    'Step 1: Install': 'step-1-install',
    'miragonDocs(options)': 'miragondocsoptions',
    'snake_case and kebab-case': 'snake_case-and-kebab-case',
    'Hello 🎉 World': 'hello--world',
    'API (v2) — notes': 'api-v2--notes',
    'What’s new?': 'whats-new',
    'Ändern, prüfen, übergeben': 'ändern-prüfen-übergeben',
    '日本語の見出し': '日本語の見出し',
    '  -Rand- ': '---rand--',
  }
  for (const [text, anchor] of Object.entries(cases)) assert.equal(githubSlug(text), anchor, text)
})
