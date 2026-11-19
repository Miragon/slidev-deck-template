// Beispiel-Doku für den Test des Kits (tests/docs-site). So sieht docs/.vitepress/config.ts in
// einem Tool-Repo aus: das Kit aufrufen, Navigation und Seitenleiste übergeben, fertig.
import { miragonDocs } from "./miragon/config"

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
