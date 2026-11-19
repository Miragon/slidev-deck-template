import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PACKAGE_DIR, contrast, cssBlocks } from './support.mjs'

const THEME = join(PACKAGE_DIR, 'theme')

test('Mermaid section colours: two CI greys alternating, light and dark with contrast, read from the roles at draw time', async () => {
  const { abschnittsfarben, abschnittsfarbenEinsetzen } = await import(pathToFileURL(join(THEME, 'abschnitte.mjs')).href)
  const blocks = cssBlocks(readFileSync(join(THEME, 'cd-tokens.generated.css'), 'utf8'))
  const values = (selector) => Object.fromEntries(blocks.find((b) => b.selectors[0] === selector).declarations)
  const light = values(':root')
  const roles = { light, dark: { ...light, ...values('html.dark') } }
  for (const [mode, role] of Object.entries(roles)) {
    const p = abschnittsfarben((name) => role[name], mode === 'dark')
    const page = role['--cd-ui-seite']
    assert.equal(p.cScale1, role['--cd-ui-kontur'], mode)
    assert.equal(p.cScaleLabel1, role['--cd-schwarz'], mode)
    assert.equal(p.cScale0, role['--cd-ui-text-leise'], mode)
    assert.equal(p.cScaleLabel0, page, mode)
    for (let n = 0; n < 12; n++) {
      assert.equal(p[`cScale${n}`], n % 2 ? p.cScale1 : p.cScale0, `${mode} cScale${n}`)
      assert.equal(p[`cScalePeer${n}`], p[`cScale${n}`])
      assert.equal(p[`cScaleInv${n}`], p[`cScale${n}`])
      assert.ok(contrast(p[`cScaleLabel${n}`], p[`cScale${n}`]) >= 4.5, `${mode}: text on section ${n}`)
      assert.ok(contrast(p[`cScale${n}`], page) >= 3, `${mode}: section ${n} on the page`)
    }
    for (let n = 0; n < 8; n++) assert.ok(contrast(p[`gitBranchLabel${n}`], p[`git${n}`]) >= 4.5, `${mode}: branch ${n}`)
    assert.equal(p.git0, role['--cd-ui-text'])
    if (mode === 'dark') for (let n = 1; n <= 12; n++) assert.ok(contrast(p.pieSectionTextColor, p[`pie${n}`]) >= 4.5, `${mode}: pie slice ${n}`)
    assert.equal(p.pieOpacity, mode === 'dark' ? '1' : '0.7')
    assert.equal(p.xyChart.plotColorPalette, `${p.cScale1},${p.cScale0}`)
    assert.equal(p.radar.graticuleColor, role['--cd-ui-linie'])
    const ciColours = new Set(Object.values(role).filter((v) => /^#[0-9A-F]{6}$/i.test(v)))
    for (const [key, value] of Object.entries(p)) if (typeof value === 'string' && value.startsWith('#')) assert.ok(ciColours.has(value), `${mode}: ${key} ${value}`)
  }
  const faded = (hex) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.7 + 255 * 0.3).toString(16).padStart(2, '0')).join('')
  for (const grey of [light['--cd-ui-kontur'], light['--cd-ui-text-leise']]) assert.ok(contrast(light['--cd-schwarz'], faded(grey)) >= 5.5, grey)

  const configuration = { themeVariables: { fontFamily: 'Geist' } }
  abschnittsfarbenEinsetzen(configuration)
  assert.equal(configuration.themeVariables.cScale0, undefined)
  assert.equal(configuration.themeVariables.fontFamily, 'Geist')
  assert.ok(Object.keys(configuration.themeVariables).includes('cScale11'), 'enumerable, so Mermaid copies them')
  let dark = false
  globalThis.document = { documentElement: { classList: { contains: (k) => k === 'dark' && dark } } }
  globalThis.getComputedStyle = () => ({ getPropertyValue: (name) => (dark ? roles.dark : roles.light)[name] ?? '' })
  try {
    assert.equal(configuration.themeVariables.cScale0, roles.light['--cd-ui-text-leise'])
    assert.equal({ ...configuration.themeVariables }.cScaleLabel0, roles.light['--cd-ui-seite'])
    dark = true
    assert.equal(configuration.themeVariables.cScale0, roles.dark['--cd-ui-text-leise'])
    assert.notEqual(roles.dark['--cd-ui-text-leise'], roles.light['--cd-ui-text-leise'])
    assert.equal(configuration.themeVariables.cScaleLabel0, roles.dark['--cd-ui-seite'])
    assert.equal(configuration.themeVariables.xyChart.plotColorPalette, `${roles.dark['--cd-ui-kontur']},${roles.dark['--cd-ui-text-leise']}`)
  } finally {
    delete globalThis.document
    delete globalThis.getComputedStyle
  }
  const theme = readFileSync(join(THEME, 'index.ts'), 'utf8')
  assert.match(theme, /import mermaidKonfiguration from "virtual:mermaid-config"/)
  assert.match(theme, /abschnittsfarbenEinsetzen\(mermaidKonfiguration\)/)
})
