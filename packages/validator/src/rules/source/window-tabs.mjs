import { readFileSync } from 'node:fs'
import { parseSync } from '@slidev/parser'
import { toRel } from '../../helpers.mjs'

/**
 * The `window` layout takes every per-tab setting from one `tabs:` list. Vue drops
 * a key it does not know silently, so a misspelled or malformed entry would render
 * as a numbered, uncaptioned tab and stay green. This rule names each one instead.
 */

const TAB_KEYS = new Set(['label', 'icon', 'caption', 'lang'])

function scanTab(tab, index) {
  const where = `tabs[${index}]`
  if (tab === null || typeof tab !== 'object' || Array.isArray(tab)) {
    return [`${where} must be an object with a \`label\`, e.g. \`- label: Main.kt\``]
  }
  const reasons = []
  if (typeof tab.label !== 'string' || !tab.label.trim()) reasons.push(`${where} needs a \`label\``)
  for (const key of Object.keys(tab)) {
    if (!TAB_KEYS.has(key)) reasons.push(`${where} has unknown key \`${key}\`; allowed are label, icon, caption, lang`)
  }
  if (tab.icon !== undefined && tab.icon !== false && typeof tab.icon !== 'string') {
    reasons.push(`${where}.icon must be a Lucide class or false`)
  }
  for (const key of ['caption', 'lang']) {
    if (tab[key] !== undefined && typeof tab[key] !== 'string') reasons.push(`${where}.${key} must be a string`)
  }
  return reasons
}

/** Pure per-slide check (fixture-testable). Returns reasons; [] = ok. */
export function scanWindowSlide(frontmatter = {}) {
  if (frontmatter.layout !== 'window' || frontmatter.tabs === undefined) return []
  if (!Array.isArray(frontmatter.tabs)) return ['`tabs:` must be a list with one entry per tab']
  return frontmatter.tabs.flatMap(scanTab)
}

export const windowTabs = {
  id: 'window-tabs',
  type: 'source',
  title: 'window slides configure their tabs in `tabs:`',
  message: 'A window slide takes label, icon, caption and lang per tab from `tabs:`',
  meta: { category: 'required', default: 'error' },
  check({ sourceFiles = [] } = {}) {
    const offenders = []
    for (const file of sourceFiles) {
      const rel = toRel(file)
      const parsed = parseSync(readFileSync(file, 'utf8'), file)
      for (const slide of parsed.slides) {
        if (slide.frontmatter?.src) continue
        for (const reason of scanWindowSlide(slide.frontmatter)) {
          offenders.push({ file: rel, line: (slide.start ?? 0) + 1, message: reason })
        }
      }
    }
    return offenders
  },
}
