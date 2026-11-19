import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { allNpmPackageDirs } from './npm-packages.mjs'

const REPOSITORY_URL = 'git+https://github.com/Miragon/brand-toolbox.git'
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

const config = readJson('release-please-config.json')
const manifest = readJson('.release-please-manifest.json')
const releaseWorkflow = readFileSync('.github/workflows/release-please.yml', 'utf8')
const problems = []

const pluginDirs = readdirSync('kits')
  .map((kit) => `kits/${kit}/plugin`)
  .filter((dir) => existsSync(join(dir, '.claude-plugin', 'plugin.json')))

for (const dir of allNpmPackageDirs()) {
  const pkg = readJson(join(dir, 'package.json'))
  if (!config.packages[dir]) problems.push(`${dir}: no entry in release-please-config.json`)
  if (manifest[dir] !== pkg.version) problems.push(`${dir}: manifest has ${manifest[dir]}, package.json has ${pkg.version}`)
  if (pkg.repository?.url !== REPOSITORY_URL) problems.push(`${dir}: repository.url is ${pkg.repository?.url}, expected ${REPOSITORY_URL}`)
  if (pkg.repository?.directory !== dir) problems.push(`${dir}: repository.directory is ${pkg.repository?.directory}`)
  const betaChoice = dir.replace(/^kits\/([^/]+)\/packages\//, '$1/')
  if (!releaseWorkflow.includes(`- ${betaChoice}\n`)) problems.push(`${dir}: missing beta_package choice "${betaChoice}" in release-please.yml`)
}

for (const dir of pluginDirs) {
  const plugin = readJson(join(dir, '.claude-plugin', 'plugin.json'))
  if (!config.packages[dir]) problems.push(`${dir}: no entry in release-please-config.json`)
  if (manifest[dir] !== plugin.version) problems.push(`${dir}: manifest has ${manifest[dir]}, plugin.json has ${plugin.version}`)
}

for (const dir of Object.keys(config.packages)) {
  if (!existsSync(dir)) problems.push(`${dir}: in release-please-config.json but not on disk`)
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`release config ok: ${allNpmPackageDirs().length} npm packages, ${pluginDirs.length} plugin(s)`)
