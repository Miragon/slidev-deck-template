import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const TOKENS_DIR = 'shared/tokens'
const PACKAGE_COPIES = {
  'cd-tokens.docs.generated.css': ['kits/docs/packages/docs-starter/theme/cd-tokens.generated.css'],
}

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const source = JSON.parse(readFileSync(join(TOKENS_DIR, 'SOURCE.json'), 'utf8'))

function problems() {
  const found = []
  for (const [name, { sha256: expected }] of Object.entries(source.files)) {
    const file = join(TOKENS_DIR, name)
    if (!existsSync(file)) {
      found.push(`${file} is missing`)
      continue
    }
    if (sha256(file) !== expected) found.push(`${file} differs from ${source.repository}@${source.commit.slice(0, 7)} (edited by hand?)`)
    for (const copy of PACKAGE_COPIES[name] ?? []) {
      if (!existsSync(copy) || sha256(copy) !== sha256(file)) found.push(`${copy} differs from ${file}, run: node shared/scripts/tokens.mjs --sync`)
    }
  }
  return found
}

function sync() {
  for (const name of Object.keys(source.files)) {
    for (const copy of PACKAGE_COPIES[name] ?? []) copyFileSync(join(TOKENS_DIR, name), copy)
  }
}

if (process.argv.includes('--sync')) sync()
const found = problems()
if (found.length) {
  console.error(found.join('\n'))
  process.exit(1)
}
console.log(`tokens ok: ${Object.keys(source.files).length} file(s) from ${source.repository}@${source.commit.slice(0, 7)}`)
