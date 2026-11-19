import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { BUILD_DIR, loadConfig, miragonDocsCall, newSite } from './support.mjs'

after(() => rmSync(BUILD_DIR, { recursive: true, force: true }))

test('miragonDocs: fixed values, English by default, base from DOCS_BASE', async () => {
  const site = newSite('config')
  const c = await loadConfig(
    site,
    miragonDocsCall({
      repo: 'Miragon/bpmn-cli',
      title: 'Miragon bpmn-cli',
      description: 'One sentence.',
      productPage: 'https://miragon.ai/tools/bpmn-cli/',
      nav: [{ text: 'Guide', link: '/guide' }],
      sidebar: [{ text: 'Start', items: [{ text: 'Guide', link: '/guide' }] }],
      head: [['meta', { name: 'robots', content: 'noindex' }]],
      vite: { optimizeDeps: { include: ['extra'] } },
    }),
    { DOCS_BASE: 'bpmn-cli' },
  )
  assert.equal(c.base, '/bpmn-cli/')
  assert.equal(c.lang, 'en-US')
  assert.equal(c.title, 'Miragon bpmn-cli')
  assert.equal(c.cleanUrls, true)
  assert.equal(c.lastUpdated, true)
  assert.deepEqual(c.head.slice(0, 3), [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/bpmn-cli/logo/miragon-komet-blau.svg' }],
    ['meta', { name: 'theme-color', content: '#335DE5', media: '(prefers-color-scheme: light)' }],
    ['meta', { name: 'theme-color', content: '#1D1D1D', media: '(prefers-color-scheme: dark)' }],
  ])
  assert.deepEqual(c.head.at(-1), ['meta', { name: 'robots', content: 'noindex' }])
  assert.deepEqual(c.markdown.theme, { light: 'github-light-high-contrast', dark: 'github-dark-default' })
  assert.equal(c.markdown.anchor.slugify('Changes from 0.6'), 'changes-from-06')
  assert.equal(typeof c.markdown.config, 'function', 'withMermaid hooks into markdown.config')
  for (const name of ['mermaid', 'extra', 'dayjs']) assert.ok(c.vite.optimizeDeps.include.includes(name), name)
  assert.equal(c.mermaid.theme, 'neutral')
  assert.match(c.mermaid.themeVariables.fontFamily, /^"Geist Variable"/)
  assert.equal(c.mermaid.look, 'classic')
  for (const type of ['flowchart', 'class', 'state', 'er', 'requirement']) assert.equal(c.mermaid[type]?.layout, 'dagre', type)
  assert.equal(c.mermaid.layout, undefined)

  const t = c.themeConfig
  assert.equal(t.logo, undefined)
  assert.equal(t.siteTitle, 'bpmn-cli')
  assert.deepEqual(t.nav.at(-1), { text: 'miragon.ai', link: 'https://miragon.ai/tools/bpmn-cli/' })
  assert.deepEqual(t.socialLinks, [{ icon: 'github', link: 'https://github.com/Miragon/bpmn-cli' }])
  assert.deepEqual(t.outline, { level: [2, 3] })
  assert.equal(t.search.provider, 'local')
  assert.equal(t.editLink.pattern, 'https://github.com/Miragon/bpmn-cli/edit/main/docs/:path')
  assert.equal(t.editLink.text, 'Edit this page on GitHub')
  assert.deepEqual(t.lastUpdated, { text: 'Last updated', formatOptions: { dateStyle: 'medium', forceLocale: true } })
  assert.equal(t.notFound.title, "This page doesn't exist")
  assert.equal(t.footer, undefined, 'no VitePress footer, the legal row is on every page')
  assert.deepEqual(t.miragon.legal.links, [
    { text: 'Impressum', link: 'https://www.miragon.io/impressum/' },
    { text: 'Datenschutz', link: 'https://www.miragon.io/datenschutz/' },
  ])
  assert.match(t.miragon.legal.copyright, /^© \d{4} Miragon GmbH$/)
  assert.equal(t.miragon.legal.copyrightLink, 'https://www.miragon.io/')
  assert.equal(t.miragon.github.link, 'https://github.com/Miragon/bpmn-cli')
  assert.equal(t.miragon.github.showStars, true)
  assert.ok(['number', 'undefined'].includes(typeof t.miragon.github.stars))
  assert.deepEqual(t.miragon.github.prompt, {
    title: 'Did this page help?',
    text: 'A star on GitHub helps other teams find bpmn-cli.',
    button: 'Star',
  })

  const local = await loadConfig(site, miragonDocsCall({ repo: 'Miragon/x', title: 'X', description: 'Y.' }), { DOCS_BASE: undefined })
  assert.equal(local.base, '/')
  assert.equal(local.head[0][1].href, '/logo/miragon-komet-blau.svg')
  assert.equal(local.themeConfig.siteTitle, 'X')
  assert.deepEqual(local.themeConfig.nav, [])
})

test('miragonDocs: the dev server compiles the theme from node_modules and the favicon ships with the package', async () => {
  const site = newSite('config-package')
  const c = await loadConfig(site, miragonDocsCall({ repo: 'Miragon/x', title: 'X', description: 'Y.' }))
  assert.ok(c.vite.optimizeDeps.exclude.includes('@miragon/docs-starter'), 'the dev server must not pre-bundle the .vue theme')
  assert.ok(c.vite.plugins.some((plugin) => plugin?.name === 'miragon-docs-favicon'), 'dev server serves the favicon')
  assert.equal(typeof c.buildEnd, 'function', 'the build copies the favicon into the site')
})

test('miragonDocs: de-DE switches the fixed texts to German, wrong options abort', async () => {
  const site = newSite('config-de')
  const c = await loadConfig(
    site,
    miragonDocsCall({ repo: 'Miragon/operate', title: 'Miragon Operate', siteTitle: false, description: 'Ein Satz.', lang: 'de-DE', branch: 'develop', footerMessage: 'MIT-Lizenz.' }),
  )
  const t = c.themeConfig
  assert.equal(c.lang, 'de-DE')
  assert.equal(t.siteTitle, false)
  assert.equal(t.editLink.text, 'Diese Seite auf GitHub bearbeiten')
  assert.equal(t.editLink.pattern, 'https://github.com/Miragon/operate/edit/develop/docs/:path')
  assert.equal(t.outline.label, 'Auf dieser Seite')
  assert.equal(t.lastUpdated.text, 'Zuletzt aktualisiert')
  assert.equal(t.notFound.title, 'Diese Seite gibt es nicht')
  assert.equal(t.search.options.translations.button.buttonText, 'Suchen')
  assert.equal(t.docFooter.prev, 'Vorherige Seite')
  assert.equal(t.miragon.legal.label, 'Rechtliches')
  assert.equal(t.miragon.legal.message, 'MIT-Lizenz.')
  assert.equal(t.miragon.github.prompt.text, 'Ein Stern auf GitHub hilft anderen Teams, Operate zu finden.')

  const withoutStars = await loadConfig(site, miragonDocsCall({ repo: 'Miragon/x', title: 'X', description: 'Y.', githubStars: false }))
  assert.deepEqual(withoutStars.themeConfig.miragon.github, {
    link: 'https://github.com/Miragon/x',
    showStars: false,
    stars: undefined,
    prompt: { title: 'Did this page help?', text: 'A star on GitHub helps other teams find X.', button: 'Star' },
  })
  assert.deepEqual(withoutStars.themeConfig.socialLinks, [{ icon: 'github', link: 'https://github.com/Miragon/x' }])

  const withoutPrompt = await loadConfig(site, miragonDocsCall({ repo: 'Miragon/x', title: 'X', description: 'Y.', starPrompt: false }))
  assert.equal(withoutPrompt.themeConfig.miragon.github.showStars, true)
  assert.equal(withoutPrompt.themeConfig.miragon.github.prompt, undefined)
  const withoutBoth = await loadConfig(site, miragonDocsCall({ repo: 'Miragon/x', title: 'X', description: 'Y.', githubStars: false, starPrompt: false }))
  assert.equal(withoutBoth.themeConfig.miragon.github, undefined)

  await assert.rejects(loadConfig(site, miragonDocsCall({ repo: 'bpmn-cli', title: 'X', description: 'Y.' })), /repo ist "bpmn-cli"/)
  await assert.rejects(loadConfig(site, miragonDocsCall({ repo: 'Miragon/x', title: 'X', description: 'Y.', lang: 'fr-FR' })), /lang ist "fr-FR"/)
})
