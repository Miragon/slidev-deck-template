import { defineMermaidRendererSetup } from '@slidev/types'
import mermaid from 'mermaid/dist/mermaid.esm.mjs'
import mermaidConfig from '@slidev/client/setup/mermaid.ts'

/**
 * Renders every ```mermaid fence like Slidev does, then points the palette
 * colours in the generated CSS at the diagram tokens of theme.css
 * (`--miragon-diagram-*`). Mermaid needs literal hex to do its colour maths,
 * so the theme stays hex; only the finished stylesheet reads tokens. The
 * tokens are unset in light mode, so the literal colour still applies there,
 * and the same SVG turns dark when the deck switches to dark mode.
 */
const DIAGRAM_TOKEN_BY_HEX: Record<string, string> = {
  '1d1d1d': 'text',
  '000000': 'text',
  '000': 'text',
  '0b0b0b': 'text',
  '333': 'text',
  'ffffff': 'paper',
  'fff': 'paper',
  'f9f7f7': 'fill',
  '335de5': 'blue',
  '2b50d4': 'blue',
}

const CSS_HEX = /(?<=[:\s,(])#([0-9a-f]{6}|[0-9a-f]{3})\b/gi

function readColoursFromTokens(svg: string) {
  return svg.replace(CSS_HEX, (hex, digits: string) => {
    const token = DIAGRAM_TOKEN_BY_HEX[digits.toLowerCase()]
    return token ? `var(--miragon-diagram-${token}, ${hex})` : hex
  })
}

let renderCount = 0

export default defineMermaidRendererSetup(() => async (code, options) => {
  const setOptions = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
  mermaid.initialize({ startOnLoad: false, ...(await mermaidConfig()), ...setOptions })
  const container = document.getElementById('mermaid-rendering-container') ?? undefined
  const { svg } = await mermaid.render(`mg-mermaid-${renderCount++}`, code, container)
  return readColoursFromTokens(svg)
})
