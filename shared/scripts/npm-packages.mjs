import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const NPM_PACKAGE = /^kits\/[^/]+\/packages\/[^/]+$/

export function allNpmPackageDirs(root = '.') {
  return readdirSync(join(root, 'kits')).flatMap((kit) => {
    const packages = join(root, 'kits', kit, 'packages')
    if (!existsSync(packages)) return []
    return readdirSync(packages)
      .map((name) => `kits/${kit}/packages/${name}`)
      .filter((dir) => existsSync(join(root, dir, 'package.json')))
  }).sort()
}

function packagesToPublish() {
  if (process.env.PUBLISH_ALL === 'true') return allNpmPackageDirs()
  const released = JSON.parse(process.env.PATHS_RELEASED || '[]')
  return released.filter((path) => NPM_PACKAGE.test(path))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`packages=${JSON.stringify(packagesToPublish())}`)
}
