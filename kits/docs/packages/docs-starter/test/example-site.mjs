import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE_DIR } from './support.mjs'

export function assertExampleSite(dist) {
  const page = (path) => readFileSync(join(dist, path), 'utf8')

  const start = page('guide/getting-started.html')
  for (const id of ['changes-from-06', 'über-uns', 'c--c', 'step-1-install-the-miragondocs-helper', 'setup', 'setup-1']) {
    assert.match(start, new RegExp(`<h[23] id="${id}"`), id)
  }
  assert.match(start, /href="#changes-from-06"/)

  assert.match(start, /<svg class="miragon-komet"/)
  assert.doesNotMatch(start, /miragon-legal-wortmarke/)

  assert.match(start, /<a class="miragon-github" href="https:\/\/github\.com\/Miragon\/beispiel" target="_blank" rel="noopener noreferrer" aria-label="GitHub">/)
  assert.doesNotMatch(start, /miragon-github-stars/)
  assert.match(start, /<aside class="miragon-star-prompt">[\s\S]*?Did this page help\?[\s\S]*?<\/aside>/)
  assert.doesNotMatch(page('index.html'), /miragon-star-prompt/)

  for (const [path, className] of [['index.html', 'miragon-legal'], ['guide/getting-started.html', 'miragon-legal has-sidebar']]) {
    const html = page(path)
    assert.match(html, new RegExp(`<footer class="${className}"`), path)
    const row = html.match(/<footer class="miragon-legal[\s\S]*?<\/footer>/)?.[0] ?? ''
    const links = [...row.matchAll(/<a ([^>]*)>([^<]*)<\/a>/g)].map(([, attributes, text]) => ({ attributes, text }))
    assert.deepEqual(links.map((l) => l.text.replace(/\d{4}/, 'YYYY')), ['© YYYY Miragon GmbH', 'Impressum', 'Datenschutz'], path)
    assert.deepEqual(
      links.map((l) => l.attributes),
      ['https://www.miragon.io/', 'https://www.miragon.io/impressum/', 'https://www.miragon.io/datenschutz/'].map(
        (href) => `href="${href}" target="_blank" rel="noopener noreferrer"`,
      ),
      path,
    )
  }
  assert.match(page('404.html'), /https:\/\/www\.miragon\.io\/impressum\//)
  assert.match(page('404.html'), /\\?"copyrightLink\\?":\\?"https:\/\/www\.miragon\.io\/\\?"/)

  const index = page('index.html')
  assert.match(index, /<link rel="icon" type="image\/svg\+xml" href="\/beispiel\/logo\/miragon-komet-blau\.svg">/)
  assert.match(index, /<meta name="theme-color" content="#335DE5" media="\(prefers-color-scheme: light\)">/)
  assert.match(index, /<meta name="theme-color" content="#1D1D1D" media="\(prefers-color-scheme: dark\)">/)
  assert.match(index, /<link rel="preload" href="\/beispiel\/assets\/geist-latin-wght-normal\.[\w-]+\.woff2" as="font"/)
  assert.ok(existsSync(join(dist, 'logo/miragon-komet-blau.svg')), 'favicon in the built site')
  assert.deepEqual(
    readFileSync(join(dist, 'logo/miragon-komet-blau.svg')),
    readFileSync(join(PACKAGE_DIR, 'assets/logo/miragon-komet-blau.svg')),
    'favicon is the unaltered official file',
  )

  assert.equal(page('guide/diagrams.html').match(/<div class="mermaid"><\/div>/g)?.length, 9)
  const chunk = readdirSync(join(dist, 'assets')).find((f) => /^guide_diagrams\.md\.[\w-]+\.js$/.test(f))
  assert.match(page(`assets/${chunk}`), /flowchart%20LR/)
  const css = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.css')).map((f) => page(`assets/${f}`)).join('')
  assert.match(page('guide/diagrams.html'), /<div data-zoom>/)
  for (const pattern of ['.miragon-legal', '--cd-ui-seite', 'Geist Variable', '.mermaid svg', '.miragon-komet', '.miragon-zoom']) assert.ok(css.includes(pattern), pattern)
  assert.ok(!css.includes('inter-roman'), 'no Inter from VitePress')
  assert.ok(readdirSync(join(dist, 'assets')).some((f) => /^geist-mono-latin-wght-normal\.[\w-]+\.woff2$/.test(f)), 'Geist Mono')
  const js = readdirSync(join(dist, 'assets'), { recursive: true }).filter((f) => f.endsWith('.js')).map((f) => page(`assets/${f}`)).join('')
  for (const pattern of ['--cd-ui-text-leise', '--cd-ui-kontur', 'graticuleColor']) assert.ok(js.includes(pattern), pattern)
}
