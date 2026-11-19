import { readFileSync } from 'node:fs'
import { parseSync } from '@slidev/parser'
import { toRel } from '../../helpers.mjs'

/**
 * The `window` layout (toolkit 2.0, formerly `code`) takes every per-tab setting
 * from one `tabs:` list. A key the layout no longer reads is dropped silently by
 * Vue, so a slide written for the old `code` layout would render with numbered,
 * uncaptioned tabs and stay green. This rule names each leftover instead.
 */

const TAB_KEYS = new Set(['label', 'icon', 'caption', 'lang'])

const REMOVED_KEYS = {
  files: 'use `tabs: [{ label }]`',
  icons: 'set `icon` on the matching `tabs` entry',
  tabIcon: 'set `icon` on each `tabs` entry',
  lang: 'set `lang` on the matching `tabs` entry',
}

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
  const reasons = []
  if (frontmatter.layout === 'code') {
    reasons.push('the `code` layout was renamed to `window` in @miragon/slidev-toolkit 2.0; set `layout: window` (see MIGRATION.md)')
  } else if (frontmatter.layout !== 'window') {
    return reasons
  }
  for (const [key, hint] of Object.entries(REMOVED_KEYS)) {
    if (key in frontmatter) reasons.push(`\`${key}:\` was removed from the window layout in toolkit 2.0; ${hint}`)
  }
  if (frontmatter.tabs === undefined) return reasons
  if (!Array.isArray(frontmatter.tabs)) return [...reasons, '`tabs:` must be a list with one entry per tab']
  return [...reasons, ...frontmatter.tabs.flatMap(scanTab)]
}

export const windowTabs = {
  id: 'window-tabs',
  type: 'source',
  title: 'window slides configure their tabs in `tabs:`',
  message: 'A window slide takes label, icon, caption and lang per tab from `tabs:`; the old code-layout keys are gone',
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
