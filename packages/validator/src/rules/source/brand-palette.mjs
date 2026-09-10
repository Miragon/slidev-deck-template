import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { repoRoot, toRel } from '../../helpers.mjs'
import { matchesAny } from '../../glob.mjs'

/**
 * Every colour literal must be a Miragon palette value.
 *
 * The palette is a closed set (brand-review rule B1, a HARD fail): five brand
 * colours, two sanctioned derivations, four status colours. Anything else — a
 * Tailwind slate, a hand-picked tint, pure #000000 — is a foreign hue. Shades that
 * are NOT in the palette must be produced with `color-mix()` from a brand token,
 * never pasted as a hex, which is exactly what `styles/theme.css` does.
 *
 * The allowed values live in `brand-palette.json` next to this file, not in the
 * code, so the palette has ONE machine-readable home in the validator and cannot
 * drift between this rule and `brand-logo-asset`.
 *
 * All three ways of writing a colour count: a hex literal, an `rgb()`/`rgba()`
 * value, and a CSS colour keyword in value position (`color: black`).
 *
 * Scope (see `scan` in the JSON): the toolkit's own styles, components/layouts,
 * the mermaid theme, and the deck's committed Excalidraw diagrams. Slide markdown
 * is not scanned here because `no-raw-html` already forbids any hex reaching it.
 * The logo vectors are excluded and covered by `brand-logo-asset`.
 *
 * Comments are blanked before matching. This matters more than it sounds: the
 * repo documents the palette IN the files it governs — `theme.css` names #000000
 * to say the brand excludes it, `cover.vue` names the mesh stops to explain why
 * they are off-palette. A naive scanner reports every one of those and is turned
 * off within a day.
 */

const BRAND = JSON.parse(readFileSync(fileURLToPath(new URL('./brand-palette.json', import.meta.url)), 'utf8'))

/** Directory names never worth walking. */
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.slidev', '.vite', 'coverage'])

/**
 * Which comment syntaxes a file actually has. `//` is a comment in TS/JS and in
 * a `.vue` <script>, but NOT in CSS, where blanking it would silently hide real
 * declarations. `.vue` gets all three because it is HTML + JS + CSS in one file.
 */
const COMMENT_SYNTAX = {
  '.css': ['block'],
  '.ts': ['block', 'line'],
  '.js': ['block', 'line'],
  '.mjs': ['block', 'line'],
  '.vue': ['block', 'line', 'html'],
  '.svg': ['html'],
  '.html': ['html'],
  '.md': ['html'],
}

const SYNTAX_RE = {
  block: '\\/\\*[\\s\\S]*?\\*\\/',
  html: '<!--[\\s\\S]*?-->',
  // `(?<!:)` keeps `https://…` and other `scheme://` URLs from swallowing the
  // rest of the line. Alternation order (block, html, line) resolves nesting:
  // the scanner takes whichever opener comes first, so `/* // */` and `// /*`
  // both behave.
  line: '(?<!:)\\/\\/[^\\n]*',
}

/** The comment-blanking regex for a file extension, or null if it has no comments. */
function commentRe(ext) {
  const kinds = COMMENT_SYNTAX[ext] ?? ['block', 'html']
  return kinds.length ? new RegExp(kinds.map((k) => SYNTAX_RE[k]).join('|'), 'g') : null
}

/**
 * Replace every comment with blanks, preserving newlines AND column positions so
 * reported line/column numbers stay true to the original file.
 */
export function blankComments(source, ext) {
  const re = commentRe(ext)
  if (!re) return source
  return source.replace(re, (m) => m.replace(/[^\n]/g, ' '))
}

/** The extension of a path, lowercased, including the dot ('' if none). */
const extOf = (p) => {
  const i = String(p).lastIndexOf('.')
  return i < 0 ? '' : String(p).slice(i).toLowerCase()
}

/**
 * Normalise a hex literal to `{ r, g, b, a }`. Accepts #rgb, #rgba, #rrggbb and
 * #rrggbbaa; the 3/4-digit short forms are expanded (`#fff` -> `#ffffff`).
 * Returns null for a length CSS never defines (so `#Ebene_2`-style ids are safe).
 */
export function parseHex(hex) {
  let h = String(hex).replace(/^#/, '')
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6 && h.length !== 8) return null
  if (!/^[0-9a-fA-F]+$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  }
}

/** `{ r, g, b }` as a canonical lowercase `#rrggbb`. */
export const toHex = (c) => `#${[c.r, c.g, c.b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')}`

/**
 * Normalise the inside of an `rgb()` / `rgba()` value to `{ r, g, b, a }`.
 * Handles both the legacy comma form and the modern space/slash form, and
 * percentages. Returns null when a channel is not a literal number (e.g.
 * `rgb(var(--x))`) — nothing to compare against the palette there.
 */
export function parseRgbFn(inner) {
  const parts = String(inner).split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null
  const chan = (p, max) => {
    if (/^[+-]?\d*\.?\d+%$/.test(p)) return (parseFloat(p) / 100) * max
    if (/^[+-]?\d*\.?\d+$/.test(p)) return parseFloat(p)
    return NaN
  }
  const r = chan(parts[0], 255)
  const g = chan(parts[1], 255)
  const b = chan(parts[2], 255)
  if (![r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) return null
  const a = parts[3] === undefined ? 1 : chan(parts[3], 1)
  return { r, g, b, a: Number.isFinite(a) ? a : 1 }
}

/** Longest-first so `#ffffffcc` is read as 8 digits, not `#ffffff` + junk. */
const HEX_LITERAL = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g
const RGB_LITERAL = /\brgba?\(([^)]*)\)/gi

/**
 * A CSS colour keyword is a colour literal too, and a hex-only scan waves it
 * through: `color: black` paints #000000, the one shade the brand names
 * explicitly to exclude it.
 *
 * The verdict never needs the keyword's value. No Miragon value has a CSS name
 * except #FFFFFF, so `white` is weiss and passes, `transparent` / `currentColor`
 * are absent from this list because they are not colours, and every other keyword
 * is off-palette by construction. Only the sixteen basic keywords carry a hex
 * below (values beyond doubt) so the report can name the nearest allowed colour;
 * for the remaining keywords the hint is dropped rather than guessed.
 */
const CSS_COLOR_KEYWORDS = new Set(`
aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown
burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan
darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet
deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro
ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow
lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray
lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine
mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise
mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab
orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru
pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan
teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen
`.trim().split(/\s+/))

/** The sixteen basic HTML keywords, the only ones whose value this file asserts. */
const BASIC_KEYWORD_HEX = {
  black: '#000000', silver: '#c0c0c0', gray: '#808080', white: '#ffffff',
  maroon: '#800000', red: '#ff0000', purple: '#800080', fuchsia: '#ff00ff',
  green: '#008000', lime: '#00ff00', olive: '#808000', yellow: '#ffff00',
  navy: '#000080', blue: '#0000ff', teal: '#008080', aqua: '#00ffff',
}

/** Shorthands whose value carries a colour but whose name does not end in `color`. */
const COLOR_PROPS = new Set([
  'fill', 'stroke', 'background', 'border', 'border-top', 'border-right', 'border-bottom',
  'border-left', 'border-block', 'border-inline', 'outline', 'box-shadow', 'text-shadow',
  'text-decoration', 'column-rule',
])

/**
 * Is this property's value a colour? `*color` covers CSS (`background-color`,
 * `stop-color`) and camelCase theme keys alike (`primaryTextColor` in the mermaid
 * setup); a custom property may hold anything, so it is always inspected.
 */
function isColorProp(name) {
  const p = String(name).toLowerCase()
  if (p.startsWith('--')) return true
  if (p.endsWith('color')) return true
  return COLOR_PROPS.has(p)
}

// Keywords only count in value position, never in prose, a class name, or a
// property name: `slategray` in a comment is documentation, `--gray` is a token
// reference, `grayscale(1)` is a filter.
const DECLARATION = /(--[a-zA-Z0-9_-]+|[a-zA-Z][a-zA-Z-]*)\s*:\s*([^;{}<\n]*)/g
const COLOR_ATTR = /\b(fill|stroke|color|stop-color|flood-color|lighting-color)\s*=\s*(["'])([^"']*)\2/gi
/** A whole word, where `-` counts as a word character: `sans-serif` yields neither `sans` nor `serif`. */
const WORD = /(?<![\w-])([a-zA-Z]+)(?![\w-])/g
const blankUrls = (v) => v.replace(/url\([^)]*\)/gi, (m) => ' '.repeat(m.length))

/** Every CSS colour keyword sitting in a colour value on this line, with its column. */
export function findColorKeywords(line) {
  const out = new Map()
  const scanValue = (value, offset) => {
    const v = blankUrls(value)
    WORD.lastIndex = 0
    let k
    while ((k = WORD.exec(v))) {
      const word = k[1].toLowerCase()
      if (CSS_COLOR_KEYWORDS.has(word)) out.set(offset + k.index, { word, raw: k[1], column: offset + k.index })
    }
  }
  let m
  DECLARATION.lastIndex = 0
  while ((m = DECLARATION.exec(line))) {
    if (isColorProp(m[1])) scanValue(m[2], m.index + m[0].length - m[2].length)
  }
  COLOR_ATTR.lastIndex = 0
  while ((m = COLOR_ATTR.exec(line))) scanValue(m[3], m.index + m[0].length - m[3].length - 1)
  return [...out.values()]
}

/**
 * The allowed colours for one repo-relative file: the palette, plus any
 * restricted set this file is explicitly allowlisted for (the mesh-hero stops).
 * Returns Map<'#rrggbb', label>.
 */
export function allowedFor(relPath) {
  const allowed = new Map()
  for (const c of BRAND.palette) allowed.set(toHex(parseHex(c.hex)), c.name)
  for (const r of BRAND.restricted ?? []) {
    if (!matchesAny(relPath, r.files)) continue
    for (const h of r.hexes) allowed.set(toHex(parseHex(h)), `${r.name}, only in ${r.files.join(' / ')}`)
  }
  return allowed
}

/** The allowed value closest in RGB space, to make the fix obvious. */
function nearest(color, allowed) {
  let best = null
  let bestD = Infinity
  for (const [hex, name] of allowed) {
    const c = parseHex(hex)
    const d = (color.r - c.r) ** 2 + (color.g - c.g) ** 2 + (color.b - c.b) ** 2
    if (d < bestD) {
      bestD = d
      best = { hex, name }
    }
  }
  return best
}

/**
 * Pure core (fixture-free, testable): every off-palette colour literal in
 * `source`, as { line, column, value, hex, nearest }. `relPath` decides both the
 * comment syntax (by extension) and the restricted-set allowlist.
 *
 * Fully transparent values (alpha 0) are skipped: they paint nothing and carry no
 * brand colour, so `rgba(0, 0, 0, 0)` is a spelling of `transparent`, not black.
 */
export function findOffPaletteColors(source, relPath) {
  const allowed = allowedFor(relPath)
  const clean = blankComments(source, extOf(relPath))
  const found = []
  clean.split('\n').forEach((line, i) => {
    const hit = (index, value, color) => {
      if (!color || color.a === 0) return
      if (allowed.has(toHex(color))) return
      found.push({ line: i + 1, column: index, value, hex: toHex(color), nearest: nearest(color, allowed) })
    }
    HEX_LITERAL.lastIndex = 0
    let m
    while ((m = HEX_LITERAL.exec(line))) hit(m.index, m[0], parseHex(m[1]))
    RGB_LITERAL.lastIndex = 0
    while ((m = RGB_LITERAL.exec(line))) hit(m.index, m[0], parseRgbFn(m[1]))
    for (const kw of findColorKeywords(line)) {
      const hex = BASIC_KEYWORD_HEX[kw.word]
      if (hex && allowed.has(hex)) continue
      found.push({
        line: i + 1,
        column: kw.column,
        value: kw.raw,
        hex: hex ?? null,
        nearest: hex ? nearest(parseHex(hex), allowed) : null,
      })
    }
  })
  return found.sort((a, b) => a.line - b.line || a.column - b.column)
}

/** The literal path prefix of a glob, i.e. everything before its first wildcard. */
function globRoot(glob) {
  const out = []
  for (const seg of glob.split('/')) {
    if (seg.includes('*') || seg.includes('?')) break
    out.push(seg)
  }
  return out.join('/')
}

/** Every file under the configured `scan.include` globs, minus `scan.exclude`. */
export function scanFiles() {
  const { include, exclude = [] } = BRAND.scan
  const files = new Set()
  const walk = (dir) => {
    if (!existsSync(dir)) return
    for (const name of readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue
      const p = join(dir, name)
      let st
      try {
        st = statSync(p)
      } catch {
        continue
      }
      if (st.isDirectory()) walk(p)
      else {
        const rel = toRel(p)
        if (matchesAny(rel, include) && !matchesAny(rel, exclude)) files.add(p)
      }
    }
  }
  for (const root of new Set(include.map(globRoot))) walk(join(repoRoot(), root))
  return [...files].sort()
}

/** A short, readable window of the offending line (Excalidraw SVGs are one huge line). */
function excerpt(line, column) {
  const from = Math.max(0, column - 40)
  const to = Math.min(line.length, column + 40)
  return `${from > 0 ? '…' : ''}${line.slice(from, to).trim()}${to < line.length ? '…' : ''}`
}

export const brandPalette = {
  id: 'brand-palette',
  type: 'source',
  title: 'colours come from the Miragon palette',
  message: 'Colour literals must be Miragon palette values',
  meta: { category: 'required', default: 'error' },
  check() {
    const files = scanFiles()
    if (!files.length) {
      return { skipped: 'nothing in scope (no vendored toolkit sources and no committed Excalidraw diagrams)' }
    }
    const offenders = []
    for (const file of files) {
      const rel = toRel(file)
      const src = readFileSync(file, 'utf8')
      const byLine = src.split('\n')
      for (const v of findOffPaletteColors(src, rel)) {
        const near = v.nearest ? ` (nearest allowed: ${v.nearest.hex} ${v.nearest.name})` : ''
        offenders.push({
          file: rel,
          line: v.line,
          message: `${v.value} is not a Miragon palette colour${near}. Use a brand token or derive the shade with color-mix(); the palette is src/rules/source/brand-palette.json.  →  ${excerpt(byLine[v.line - 1] ?? '', v.column)}`,
        })
      }
    }
    return offenders
  },
}
