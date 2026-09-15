import { defineMermaidSetup } from '@slidev/types'

/**
 * Brand theme for every ```mermaid fence in the deck.
 *
 * Mermaid does colour math on these values (it derives contrast text colours
 * from the fills), so they have to be literal hex: a CSS variable would not
 * resolve here. Every value below is therefore a straight copy of the
 * sanctioned palette in tokens.json / theme.css:
 *
 *   #335DE5 blau · #2B50D4 blau-link · #F9F7F7 grau · #1D1D1D schwarz · #FFFFFF weiss
 *
 * Do NOT introduce a tint that is not in that list. Green is deliberately
 * absent: mermaid uses these as node fills behind text, and #00E676 carries no
 * AA contrast for labels.
 */
export default defineMermaidSetup(() => ({
  theme: 'base',
  themeVariables: {
    primaryColor: '#F9F7F7',
    primaryBorderColor: '#335DE5',
    primaryTextColor: '#1D1D1D',

    lineColor: '#335DE5',
    edgeLabelBackground: '#FFFFFF',

    secondaryColor: '#FFFFFF',
    secondaryBorderColor: '#2B50D4',
    tertiaryColor: '#FFFFFF',
    tertiaryBorderColor: '#335DE5',

    fontFamily: "'Geist', 'Inter', 'Helvetica Neue', Arial, sans-serif",
  },
  themeCSS: `
    .node rect, .node polygon, .cluster rect { rx: 8px; ry: 8px; }
    rect.actor, .actor rect, rect.note, .note rect,
    .classGroup rect, .stateGroup rect, .entityBox { rx: 8px; ry: 8px; }
  `,
}))
