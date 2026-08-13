import { test, expect } from '@playwright/test'
import { scanHeading } from './content-heading'

// Fixtures for scanHeading. @source = fast, no-browser lane. Width-based cases
// (natural overflow, nowrap, font loading) belong to the separate rendered check.
test.describe('content-heading rule @source', () => {
  test('short single-line heading passes', () => {
    expect(scanHeading('Slides are Markdown', 'content')).toEqual([])
  })

  test('heading exactly at the limit passes; one over fails', () => {
    const at = 'x'.repeat(50)
    const over = 'x'.repeat(51)
    expect(scanHeading(at, 'content')).toEqual([])
    const reasons = scanHeading(over, 'content')
    expect(reasons).toHaveLength(1)
    expect(reasons[0]).toContain('51 characters')
    expect(reasons[0]).toContain('up to 50')
  })

  test('explicit breaks fail: <br>, literal newline, trailing backslash', () => {
    expect(scanHeading('One line<br>Two line', 'content')[0]).toContain('explicit line break')
    expect(scanHeading('One line<br />Two line', 'content')[0]).toContain('explicit line break')
    expect(scanHeading('One line\nTwo line', 'content')[0]).toContain('explicit line break')
    expect(scanHeading('One line \\', 'content')[0]).toContain('explicit line break')
  })

  test('code points count as one: umlauts, accents, emoji', () => {
    expect(scanHeading('ä'.repeat(10), 'content')).toEqual([])
    // 49 chars + emoji = 50 code points (not UTF-16 units) → passes; one more fails.
    expect(scanHeading('x'.repeat(49) + '🚀', 'content')).toEqual([])
    expect(scanHeading('x'.repeat(50) + '🚀', 'content')[0]).toContain('51 characters')
  })

  test('same length, different glyph width: BOTH pass (width is the DOM check, not this)', () => {
    const wide = 'W'.repeat(45)
    const narrow = 'i'.repeat(45)
    expect(scanHeading(wide, 'content')).toEqual([])
    expect(scanHeading(narrow, 'content')).toEqual([])
  })

  test('per-layout budgets differ (content-image column is narrower)', () => {
    const h = 'x'.repeat(40)
    expect(scanHeading(h, 'content')).toEqual([]) // 40 <= 50
    expect(scanHeading(h, 'content-image')[0]).toContain('up to 28') // 40 > 28
  })

  test('statement layouts are ignored, however long or multiline', () => {
    const long = 'You write the content. The brand is already done, and then some.'
    expect(scanHeading(long, 'hero')).toEqual([])
    expect(scanHeading('Big\nStatement', 'section')).toEqual([])
    expect(scanHeading(long, undefined)).toEqual([])
  })

  test('opt-out suppresses both checks', () => {
    const bad = 'x'.repeat(80) + '<br>more'
    expect(scanHeading(bad, 'content').length).toBeGreaterThan(0)
    expect(scanHeading(bad, 'content', true)).toEqual([])
  })

  test('empty / whitespace-only title is a no-op', () => {
    expect(scanHeading(undefined, 'content')).toEqual([])
    expect(scanHeading('   ', 'content')).toEqual([])
  })
})
