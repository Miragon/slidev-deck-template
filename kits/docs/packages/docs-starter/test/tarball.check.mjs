import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { EXAMPLE_DIR, PACKAGE_DIR } from './support.mjs'
import { assertExampleSite } from './example-site.mjs'

const workDir = mkdtempSync(join(tmpdir(), 'docs-starter-tarball-'))
const site = join(workDir, 'docs')
after(() => rmSync(workDir, { recursive: true, force: true, maxRetries: 5 }))

const run = (command, args, cwd, env = {}) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env } })
  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
  return result.stdout
}

before(() => {
  const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', workDir], PACKAGE_DIR))
  const entry = Array.isArray(packed) ? packed[0] : Object.values(packed)[0]
  const shipped = entry.files.map((file) => file.path)
  for (const file of ['dist/config.js', 'dist/config.d.ts', 'dist/slug.mjs', 'theme/index.ts', 'theme/cd-tokens.generated.css', 'assets/logo/miragon-komet-blau.svg', 'LICENSE']) {
    assert.ok(shipped.includes(file), `tarball ships ${file}`)
  }

  cpSync(EXAMPLE_DIR, site, { recursive: true, filter: (source) => !/[\\/](node_modules|dist|cache)$/.test(source) })
  const manifest = JSON.parse(readFileSync(join(site, 'package.json'), 'utf8'))
  manifest.devDependencies['@miragon/docs-starter'] = `file:${join(workDir, entry.filename)}`
  writeFileSync(join(site, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
  run('npm', ['install', '--no-audit', '--no-fund'], site)
})

test('a consumer site outside the workspace builds from the packed tarball', () => {
  run('npx', ['vitepress', 'build'], site, { DOCS_BASE: '/beispiel/' })
  assertExampleSite(join(site, '.vitepress/dist'))
})

async function startDevServer() {
  const server = spawn(process.execPath, [join(site, 'node_modules/vitepress/bin/vitepress.js'), 'dev', '--port', '5179'], { cwd: site, env: process.env })
  const exited = new Promise((resolve) => server.once('exit', resolve))
  let log = ''
  server.stdout.on('data', (chunk) => (log += chunk))
  server.stderr.on('data', (chunk) => (log += chunk))
  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`dev server did not start\n${log}`)), 60000)
    const poll = setInterval(() => {
      const match = log.match(/Local:\s+(http:\/\/\S+?)\/?\s/)
      if (!match) return
      clearInterval(poll)
      clearTimeout(timeout)
      resolve(match[1])
    }, 200)
  })
  return { url, log: () => log, stop: () => (server.kill(), exited) }
}

test('the dev server serves the theme from the package source and the favicon', async () => {
  const server = await startDevServer()
  try {
    assert.equal((await fetch(`${server.url}/`)).status, 200)
    const themeEntry = await (await fetch(`${server.url}/.vitepress/theme/index.ts`)).text()
    assert.match(themeEntry, /\/node_modules\/@miragon\/docs-starter\/theme\/index\.ts/, 'the theme is not pre-bundled, esbuild cannot resolve virtual:mermaid-config')
    const theme = await fetch(`${server.url}/node_modules/@miragon/docs-starter/theme/index.ts`)
    assert.equal(theme.status, 200, server.log())
    const favicon = await fetch(`${server.url}/logo/miragon-komet-blau.svg`)
    assert.equal(favicon.status, 200)
    assert.equal(favicon.headers.get('content-type'), 'image/svg+xml')
    assert.doesNotMatch(server.log(), /Could not resolve|error while updating dependencies/)
  } finally {
    await server.stop()
  }
})
