// The docs site, built with the Miragon docs kit (@miragon/docs-starter). The kit sets
// everything else: base from DOCS_BASE, theme, colours light and dark, GitHub anchors, Mermaid,
// search, the legal row.
import { miragonDocs } from "@miragon/docs-starter"

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
