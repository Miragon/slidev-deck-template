import { defineMermaidSetup } from '@slidev/types'

export default defineMermaidSetup(() => ({
  theme: 'base',
  themeVariables: {
    primaryColor: '#F0F4FF',
    primaryBorderColor: '#335DE5',
    primaryTextColor: '#000000',

    lineColor: '#335DE5',
    edgeLabelBackground: '#F5F7FF',

    secondaryColor: '#F5F7FF',
    secondaryBorderColor: '#2B4ACB',
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
