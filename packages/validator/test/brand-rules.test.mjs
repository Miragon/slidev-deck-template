// Unit + light-integration tests for the two colour guardrails: `brand-palette`
// (every colour literal is a sanctioned palette value) and `brand-logo-asset`
// (the bundled logo vectors are the untouched official artwork). Node built-ins
// only (node:test), no browser — both rules are pure source scans and expose a
// fixture-free core, and the integration cases run against the repo's own files.
//
// The case that matters most is the comment case: the repo documents the palette
// INSIDE the files the rule governs (theme.css names #000000 to say the brand
// excludes it), so a scanner that reads comments reports its own documentation.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { findOffPaletteColors, blankComments, parseHex, parseRgbFn, toHex, allowedFor, brandPalette } from '../src/rules/source/brand-palette.mjs'
import { checkLogoSvg, normalizeFill, brandLogoAsset } from '../src/rules/source/brand-logo-asset.mjs'
import { definedTokens, undefinedUsages, brandTokenDefined } from '../src/rules/source/brand-token-defined.mjs'
import { ruleById } from '../src/rules/index.mjs'
import required from '../src/presets/required.mjs'
import recommended from '../src/presets/recommended.mjs'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(TEST_DIR, '..', '..', '..')

/** Run `fn` with the validator rooted at `root`, restoring the env after. */
async function withRoot(root, fn) {
  const prev = process.env.SLIDEV_VALIDATOR_ROOT
  process.env.SLIDEV_VALIDATOR_ROOT = root
  try {
    return await fn()
  } finally {
    if (prev === undefined) delete process.env.SLIDEV_VALIDATOR_ROOT
    else process.env.SLIDEV_VALIDATOR_ROOT = prev
  }
}

// An ordinary in-scope stylesheet (no restricted-set allowlist) and an ordinary
// layout. `theme.css` is deliberately NOT the default here: it is one of the two
// files allowlisted for the mesh-hero stops, which would widen every assertion.
const CSS = 'packages/toolkit/styles/prose.css'
const THEME = 'packages/toolkit/styles/theme.css'
const VUE = 'packages/toolkit/layouts/hero.vue'

// --- registration -----------------------------------------------------------

test('brand rules are registered as required/error and land in both presets', () => {
  for (const id of ['brand-palette', 'brand-logo-asset']) {
    const rule = ruleById(id)
    assert.ok(rule, `${id} is not in the registry`)
    assert.equal(rule.type, 'source')
    assert.equal(rule.meta.category, 'required')
    assert.equal(rule.meta.default, 'error')
    assert.equal(required.rules[id], 'error')
    assert.equal(recommended.rules[id], 'error')
  }
})

// --- brand-palette: the palette passes --------------------------------------

test('palette: the sanctioned values pass, in every notation', () => {
  const src = [
    '.a { color: #335DE5; }',
    '.b { color: #00e676; }',
    '.c { background: #F9F7F7; border-color: #1D1D1D; }',
    '.d { color: #fff; }',
    '.e { color: #FFFFFFCC; }',
    '.f { color: rgb(51, 93, 229); }',
    '.g { color: rgba(29, 29, 29, 0.06); }',
    '.h { color: #2B50D4; }',
    '.i { color: #6B8AFF; }',
    '.j { color: #0B7A55; border: 1px solid #92610A; outline-color: #C92A2A; }',
  ].join('\n')
  assert.deepEqual(findOffPaletteColors(src, CSS), [])
})

test('palette: a derived shade built with color-mix() has no literal to flag', () => {
  const src = '--x: color-mix(in srgb, var(--miragon-black) 12%, var(--miragon-white));'
  assert.deepEqual(findOffPaletteColors(src, CSS), [])
})

// --- brand-palette: foreign tones fail --------------------------------------

test('palette: a foreign hex is flagged with its line and the nearest allowed value', () => {
  const src = '.a { color: #335DE5; }\n.b { color: #64748B; }'
  const hits = findOffPaletteColors(src, CSS)
  assert.equal(hits.length, 1)
  assert.equal(hits[0].line, 2)
  assert.equal(hits[0].value, '#64748B')
  assert.equal(hits[0].nearest.hex, '#2b50d4')
})

test('palette: pure black is a violation, and points at the CI black', () => {
  const hits = findOffPaletteColors('.a { color: #000; }', CSS)
  assert.equal(hits.length, 1)
  assert.equal(hits[0].hex, '#000000')
  assert.equal(hits[0].nearest.hex, '#1d1d1d')
})

test('palette: an off-palette rgb()/rgba() is flagged like a hex', () => {
  const hits = findOffPaletteColors('.a { color: rgb(100 116 139); background: rgba(0, 0, 0, 0.35); }', CSS)
  assert.deepEqual(hits.map((h) => h.hex), ['#64748b', '#000000'])
})

test('palette: a fully transparent value paints nothing and is not a colour', () => {
  assert.deepEqual(findOffPaletteColors('.a { background: rgba(0, 0, 0, 0); border-color: #12345600; }', CSS), [])
})

test('palette: an rgb() built from variables has no literal to compare', () => {
  assert.deepEqual(findOffPaletteColors('.a { color: rgb(var(--brand-rgb) / 0.5); }', CSS), [])
})

// --- brand-palette: CSS colour keywords -------------------------------------

test('palette: a CSS colour keyword is a colour literal, and `black` is the excluded one', () => {
  const hits = findOffPaletteColors('.a { color: black; }', CSS)
  assert.equal(hits.length, 1)
  assert.equal(hits[0].value, 'black')
  assert.equal(hits[0].nearest.hex, '#1d1d1d')
})

test('palette: keywords are caught in a shorthand, an SVG attribute and a JS theme key', () => {
  assert.deepEqual(findOffPaletteColors('.a { border: 1px solid slategray; }', CSS).map((h) => h.value), ['slategray'])
  assert.deepEqual(findOffPaletteColors('<rect fill="tomato"></rect>', 'deck/x/resources/d.excalidraw.svg').map((h) => h.value), ['tomato'])
  assert.deepEqual(findOffPaletteColors("primaryTextColor: 'black',", 'packages/toolkit/setup/mermaid.ts').map((h) => h.value), ['black'])
})

test('palette: `white` IS weiss, and transparent/currentColor are not colours', () => {
  assert.deepEqual(findOffPaletteColors('.a { color: white; background: transparent; border-color: currentColor; }', CSS), [])
})

test('palette: a keyword only counts in value position, never in prose or an identifier', () => {
  const src = [
    '<div class="text-black bg-gray-100">the black box</div>', // class name + prose
    '.a { color: var(--gray); filter: grayscale(1); }', // token reference + filter
    '.b { background: url(tomato.png) no-repeat center; }', // a file name, not a colour
    '.c { white-space: nowrap; transition: color 150ms; }', // property names, not values
    "--miragon-font: Geist, 'Inter', Helvetica Neue, Arial, sans-serif;", // a font stack
  ].join('\n')
  assert.deepEqual(findOffPaletteColors(src, VUE), [])
})

// --- brand-palette: the comment case ----------------------------------------

test('palette: documentation of a forbidden colour inside a comment is not a violation', () => {
  // Exactly the shape theme.css uses: the file names #000000 to say the brand
  // excludes it, and lists the mesh stops to explain why they are off-palette.
  const src = [
    '/**',
    ' * schwarz #1D1D1D  text on light. NOT pure #000000 - the brand excludes it.',
    ' * mesh    #1A1A4E / #0D0D2B / #00C853, shader only.',
    ' */',
    '--miragon-black: #1D1D1D;   /* CI black, not #000000 */',
  ].join('\n')
  assert.deepEqual(findOffPaletteColors(src, CSS), [])
  assert.deepEqual(findOffPaletteColors(src, THEME), [])
})

test('palette: a // comment in a .vue script is exempt, but // in CSS is not a comment', () => {
  assert.deepEqual(findOffPaletteColors('// green is #00C853 in the mesh, off-palette here\nconst a = 1', VUE), [])
  // In CSS `//` starts nothing; a hex after it is a real declaration and must fail.
  const hits = findOffPaletteColors('.a { color: #64748B; } // not a comment', CSS)
  assert.equal(hits.length, 1)
})

test('palette: an <!-- --> comment is exempt in .vue and .svg', () => {
  assert.deepEqual(findOffPaletteColors('<!-- never use #64748B -->', VUE), [])
  assert.deepEqual(findOffPaletteColors('<!-- payload #F8FAFC -->', 'deck/x/resources/d.excalidraw.svg'), [])
})

test('palette: a URL is not a line comment (the rest of the line still gets scanned)', () => {
  const hits = findOffPaletteColors('const u = "https://x.dev/a" // ref\nconst c = "#64748B"', VUE)
  assert.deepEqual(hits.map((h) => h.hex), ['#64748b'])
})

test('palette: blanking keeps line and column positions intact', () => {
  const src = '/* #000000 */ #64748B'
  assert.equal(blankComments(src, '.css'), '              #64748B')
  assert.equal(findOffPaletteColors(src, CSS)[0].column, 14)
})

// --- brand-palette: the mesh-hero allowlist ---------------------------------

test('palette: the mesh-hero stops are allowed only in the shader and the theme tokens', () => {
  const mesh = "const COLORS = ['#335DE5', '#1a1a4e', '#00E676', '#335DE5', '#0d0d2b', '#00C853']"
  assert.deepEqual(findOffPaletteColors(mesh, 'packages/toolkit/components/BrandMeshBackground.vue'), [])
  assert.deepEqual(findOffPaletteColors('--miragon-mesh-navy: #0D0D2B;', THEME), [])
  assert.deepEqual(findOffPaletteColors('--x: #0D0D2B;', CSS).map((h) => h.hex), ['#0d0d2b'])
  // The same value anywhere else is a foreign hue.
  const hits = findOffPaletteColors('.bg { background: #00C853; }', 'packages/toolkit/layouts/cover.vue')
  assert.deepEqual(hits.map((h) => h.hex), ['#00c853'])
  assert.ok(!allowedFor('packages/toolkit/layouts/cover.vue').has('#00c853'))
  assert.ok(allowedFor('packages/toolkit/components/BrandMeshBackground.vue').has('#00c853'))
})

// --- brand-palette: parsing helpers -----------------------------------------

test('palette: short hex forms expand and compare case-insensitively', () => {
  assert.equal(toHex(parseHex('#FFF')), '#ffffff')
  assert.equal(toHex(parseHex('#0f8')), '#00ff88')
  assert.equal(toHex(parseHex('#335de5')), '#335de5')
  assert.equal(parseHex('#12345'), null) // 5 digits is not a CSS colour
  assert.equal(parseHex('#FFFFFF80').a.toFixed(2), '0.50')
})

test('palette: rgb() parses both the comma and the space/slash notation', () => {
  assert.equal(toHex(parseRgbFn('51, 93, 229')), '#335de5')
  assert.equal(toHex(parseRgbFn('51 93 229 / 40%')), '#335de5')
  assert.equal(toHex(parseRgbFn('100% 100% 100%')), '#ffffff')
  assert.equal(parseRgbFn('var(--x)'), null)
})

// --- brand-palette: integration ---------------------------------------------

test('palette: the repo itself is clean', async () => {
  await withRoot(REPO_ROOT, () => {
    const out = brandPalette.check()
    assert.ok(Array.isArray(out), `rule was skipped: ${out.skipped}`)
    assert.deepEqual(out.map((o) => `${o.file}:${o.line} ${o.message}`), [])
  })
})

// --- brand-logo-asset -------------------------------------------------------

const WORDMARK = { file: 'packages/toolkit/assets/logo.svg', variant: 'gruen', viewBox: '0 0 316.05 48.42', fill: '#00e676' }
const svgOf = (viewBox, style) => `<?xml version="1.0" encoding="UTF-8"?><svg id="Ebene_2" viewBox="${viewBox}"><defs><style>${style}</style></defs><g id="Logo"><path class="cls-1" d="M0,0"/></g></svg>`

test('logo: the official vector passes', () => {
  assert.deepEqual(checkLogoSvg(svgOf('0 0 316.05 48.42', '.cls-1{fill:#00e676;}'), WORDMARK), [])
})

test('logo: the white variant passes with the short #fff form', () => {
  const white = { ...WORDMARK, variant: 'weiss', fill: '#fff' }
  assert.deepEqual(checkLogoSvg(svgOf('0 0 316.05 48.42', '.cls-1{fill:#FFFFFF;}'), white), [])
  assert.equal(normalizeFill('#FFF'), '#ffffff')
})

test('logo: the exact bug that shipped, a single wrong digit, is caught', () => {
  const problems = checkLogoSvg(svgOf('0 0 316.05 48.42', '.cls-1{fill:#00e476;}'), WORDMARK)
  assert.equal(problems.length, 1)
  assert.match(problems[0].message, /#00e476 is not the official "gruen" colour #00e676/)
})

test('logo: a rescaled or cropped mark changes the viewBox and is caught', () => {
  const problems = checkLogoSvg(svgOf('0 0 181.58 28.42', '.cls-1{fill:#00e676;}'), WORDMARK)
  assert.equal(problems.length, 1)
  assert.match(problems[0].message, /viewBox "0 0 181.58 28.42" is not the official "0 0 316.05 48.42"/)
})

test('logo: a second colour makes it no longer the single-colour mark', () => {
  const svg = svgOf('0 0 316.05 48.42', '.cls-1{fill:#00e676;}.cls-2{fill:#335de5;}')
  const problems = checkLogoSvg(svg, WORDMARK)
  assert.ok(problems.some((p) => /declares 2 fills/.test(p.message)))
})

test('logo: a stripped fill is caught, and so is a missing viewBox', () => {
  const svg = '<svg id="Ebene_2"><defs><style>.cls-1{stroke:#00e676;}</style></defs></svg>'
  const problems = checkLogoSvg(svg, WORDMARK)
  assert.deepEqual(problems.map((p) => p.message.slice(0, 20)), ['has no viewBox (the ', 'declares no fill (ex'])
})

test('logo: the repo\'s bundled assets are the official vectors', async () => {
  await withRoot(REPO_ROOT, () => {
    const out = brandLogoAsset.check()
    assert.ok(Array.isArray(out), `rule was skipped: ${out.skipped}`)
    assert.deepEqual(out.map((o) => `${o.file}:${o.line} ${o.message}`), [])
  })
})

test('logo: a repo that vendors no assets is reported as not-applicable, never as a pass', async () => {
  await withRoot(join(TEST_DIR, 'fixtures', 'nested-deck'), () => {
    assert.match(brandLogoAsset.check().skipped, /no bundled logo assets/)
  })
})

// --- brand-token-defined ----------------------------------------------------
// The regression this rule exists for: a palette cleanup deleted
// `--miragon-blue-dark` while code.css still read it. CSS drops an undefined
// custom property without a word, the element inherits, and inline code on the
// closing slide rendered white on near-white. Build green, deck broken.

test('token: a reference to a defined token is clean', () => {
  const defined = definedTokens(':root {\n  --miragon-blue: #335DE5;\n  --miragon-white: #FFFFFF;\n}')
  assert.deepEqual(undefinedUsages('a { color: var(--miragon-blue); }', defined), [])
})

test('token: the exact regression is caught, with its line', () => {
  const defined = definedTokens(':root { --miragon-blue: #335DE5; }')
  const css = '/* chip */\n:not(pre) > code {\n  color: var(--miragon-blue-dark);\n}'
  assert.deepEqual(undefinedUsages(css, defined), [{ token: '--miragon-blue-dark', line: 3 }])
})

test('token: a fallback hides the breakage at render time but is still reported', () => {
  const defined = definedTokens(':root { --miragon-blue: #335DE5; }')
  const out = undefinedUsages('a { color: var(--miragon-gone, #335DE5); }', defined)
  assert.deepEqual(out.map((u) => u.token), ['--miragon-gone'])
})

test('token: a computed name is skipped, not guessed at', () => {
  const defined = definedTokens(':root { --miragon-gradient-blue: red; }')
  // `var(--miragon-gradient-${props.accent})` in a Vue binding: unresolvable statically.
  assert.deepEqual(undefinedUsages('const g = `var(--miragon-gradient-${props.accent})`', defined), [])
})

test('token: non-miragon variables are none of this rule\'s business', () => {
  const defined = definedTokens(':root { --miragon-blue: #335DE5; }')
  assert.deepEqual(undefinedUsages('a { color: var(--slidev-theme-primary); }', defined), [])
})

test('token: definitions are read from :root, not from usages', () => {
  const defined = definedTokens(':root {\n  --miragon-text-muted: color-mix(in srgb, var(--miragon-black) 72%, white);\n}')
  assert.ok(defined.has('--miragon-text-muted'))
  assert.ok(!defined.has('--miragon-black'), 'a var() inside a value is a usage, not a definition')
})

test('token: every reference in the repo resolves', async () => {
  await withRoot(REPO_ROOT, () => {
    const out = brandTokenDefined.check()
    assert.ok(Array.isArray(out), `rule was skipped: ${out.skipped}`)
    assert.deepEqual(out.map((o) => `${o.file}:${o.line} ${o.token ?? o.message.split(' ')[0]}`), [])
  })
})

test('token: a repo that vendors no theme.css is reported as not-applicable, never as a pass', async () => {
  await withRoot(join(TEST_DIR, 'fixtures', 'nested-deck'), () => {
    assert.match(brandTokenDefined.check().skipped, /no bundled theme\.css/)
  })
})
