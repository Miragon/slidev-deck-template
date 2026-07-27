import { defineMermaidSetup } from '@slidev/types'

// Brand-styles every ```mermaid diagram with the Miragon palette and Geist, so
// text-generated diagrams stay on-brand. Slidev collects setup/* from every root
// (theme included), so shipping this in the theme package means every deck that
// sets `theme: '@miragon/slidev-toolkit'` inherits it with zero config. A deck can
// still override by adding its own setup/mermaid.ts, but never has to.
// The hex values mirror the tokens in ../styles/theme.css; they live here (config),
// never in slide markdown, so the "no hardcoded hex in markdown" rule stays intact.
// Excalidraw remains the default for diagrams; Mermaid is for text-generated flows.
export default defineMermaidSetup(() => ({
  theme: 'base',
  themeVariables: {
    // Nodes: light-blue fill, Miragon-blue border, black label text
    primaryColor: '#F0F4FF', // --miragon-blue-light
    primaryBorderColor: '#335DE5', // --miragon-blue
    primaryTextColor: '#000000', // --miragon-text-primary

    // Edges and their labels
    lineColor: '#335DE5', // --miragon-blue
    edgeLabelBackground: '#F5F7FF', // --miragon-blue-soft

    // Secondary / tertiary surfaces (sequence actor boxes, alt-blocks, notes)
    secondaryColor: '#F5F7FF', // --miragon-blue-soft
    secondaryBorderColor: '#2B4ACB', // --miragon-blue-mid
    tertiaryColor: '#FFFFFF',
    tertiaryBorderColor: '#335DE5',

    // Typography: Geist, matching the theme's body font
    fontFamily: "'Geist', 'Inter', 'Helvetica Neue', Arial, sans-serif",
  },
}))
