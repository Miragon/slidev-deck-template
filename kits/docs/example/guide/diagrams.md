# Diagrams

Mermaid diagrams take the colours of the roles, in light and dark mode.

## Flowchart

```mermaid
flowchart LR
  A[Write the docs] --> B{Build passes?}
  B -- yes --> C[Deploy to GitHub Pages]
  B -- no --> D[Fix the dead link]
  D --> A
  subgraph CI[GitHub Actions]
    C
  end
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant GH as GitHub
  Dev->>GH: Push to main
  activate GH
  GH-->>Dev: Pages deployed
  deactivate GH
  Note over Dev,GH: Docs workflow
  loop Each PR
    GH->>GH: Build the site
  end
```

## Class

```mermaid
classDiagram
  class MiragonDocsOptions {
    +string repo
    +string title
    +string description
    +lang() string
  }
  class UserConfig
  MiragonDocsOptions --> UserConfig : miragonDocs()
```

## State

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Review: open PR
  Review --> Published: merge
  Published --> [*]
```

## Entity relationship

```mermaid
erDiagram
  REPO ||--o{ PAGE : contains
  PAGE {
    string path
    string title
  }
```

## Sections

Diagrams with sections take two CI greys in turn, each with a label colour that holds 4.5:1 on it.

```mermaid
mindmap
  root((Docs))
    Guides
      Getting started
    Reference
    Skills
```

```mermaid
timeline
  title Releases
  2025 : Kit
  2026 : Mermaid 12 : Sections
```

```mermaid
pie showData
  title Pages
  "Guides" : 4
  "Reference" : 3
  "Skills" : 2
```

```mermaid
gitGraph
  commit
  branch feature
  commit
  checkout main
  merge feature
```

## Full screen

Click an image or a diagram to open it full screen; Esc closes it. Anything else opens the same
way when it is wrapped in `data-zoom`:

<div data-zoom>
  <svg viewBox="0 0 120 40" width="240"><rect x="1" y="1" width="118" height="38" rx="6" fill="none" stroke="currentColor"/><text x="60" y="25" text-anchor="middle" font-size="12" fill="currentColor">data-zoom</text></svg>
</div>
