import { miragonDocs } from "@miragon/docs-starter"

export default miragonDocs({
  repo: "Miragon/beispiel",
  title: "Miragon Example",
  description: "A sample site that builds with the Miragon docs kit.",
  productPage: "https://miragon.ai/",
  footerMessage: "Released under the MIT License.",
  nav: [
    { text: "Getting started", link: "/guide/getting-started" },
    { text: "Diagrams", link: "/guide/diagrams" },
  ],
  sidebar: [
    {
      text: "Guide",
      items: [
        { text: "Getting started", link: "/guide/getting-started" },
        { text: "Diagrams", link: "/guide/diagrams" },
      ],
    },
  ],
})
