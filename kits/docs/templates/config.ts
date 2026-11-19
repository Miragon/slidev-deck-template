// The docs site, built with the Miragon docs kit (docs/.vitepress/miragon/, vendored from
// Miragon/corporate-identity, skill docs-site). The kit sets everything else: base from
// DOCS_BASE, theme, colours light and dark, GitHub anchors, Mermaid, search, the legal row.
import { miragonDocs } from "./miragon/config"

export default miragonDocs({
  repo: "Miragon/<repo>",
  title: "Miragon <Tool>",
  description: "<One sentence: what the tool does and for whom.>",
  productPage: "https://miragon.ai/tools/<tool>/",
  nav: [
    { text: "Getting started", link: "/getting-started" },
    { text: "Reference", link: "/reference" },
  ],
  sidebar: [
    {
      text: "Start",
      items: [
        { text: "Getting started", link: "/getting-started" },
        { text: "Reference", link: "/reference" },
      ],
    },
  ],
})
