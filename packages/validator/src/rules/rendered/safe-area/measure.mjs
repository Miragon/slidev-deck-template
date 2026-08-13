/**
 * Browser-side safe-area measurement for one slide. Serialized into the page by
 * Playwright, so it must be fully self-contained (no imports, no module closure).
 *
 * Measures the global overlays (page display, progress bar) and the author content
 * near a canvas edge, all in CANVAS pixels. The transformed `.slidev-slide-content`
 * is the containing block for the fixed overlays AND the ancestor of the layout
 * content, so measuring both against it puts them in one comparable space. Returns
 * { overlays, content, exceptions, frame } or null when the slide is not rendered.
 */
export function measureSafeArea({ n, overlaySel, canvas }) {
  const root = document.querySelector(`.slidev-page-${n}:not(.disable-view-transition)`)
  if (!root) return null
  const frame = root.closest('.slidev-slide-content') || root
  const box = frame.getBoundingClientRect()
  const cw = frame.clientWidth || canvas.width
  const scale = box.width / cw || 1
  const toCanvas = (r) => ({
    left: (r.left - box.left) / scale,
    top: (r.top - box.top) / scale,
    right: (r.right - box.left) / scale,
    bottom: (r.bottom - box.top) / scale,
  })
  const rgb = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map((x) => parseFloat(x))
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }
  }
  const w = (r) => r.right - r.left
  const h = (r) => r.bottom - r.top

  // --- Global overlays (measured live; null when not rendered on this slide) ---
  const overlays = overlaySel.map((o) => {
    const el = document.querySelector(o.selector)
    if (!el) return { id: o.id, rect: null }
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') return { id: o.id, rect: null }
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return { id: o.id, rect: null }
    return { id: o.id, rect: toCanvas(r) }
  })

  // --- Author content near an edge ---
  const layout = root.querySelector('.slidev-layout') || root
  const REPLACED = new Set(['img', 'svg', 'canvas', 'video', 'image'])
  const paints = (el) => {
    const tag = el.tagName.toLowerCase()
    if (REPLACED.has(tag)) return true
    const cs = getComputedStyle(el)
    const bg = rgb(cs.backgroundColor)
    if (bg && bg.a > 0.05) return true
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return true
    const border = ['Top', 'Right', 'Bottom', 'Left'].some((s) => {
      const bw = parseFloat(cs['border' + s + 'Width']) || 0
      const c = rgb(cs['border' + s + 'Color'])
      return bw > 0 && c && c.a > 0.05
    })
    if (border) return true
    return el.children.length === 0 && (el.textContent || '').trim().length > 0
  }
  const opaqueBg = (el) => {
    const tag = el.tagName.toLowerCase()
    if (REPLACED.has(tag)) return true
    const bg = rgb(getComputedStyle(el).backgroundColor)
    return !!bg && bg.a > 0.5
  }
  const content = []
  for (const el of [...layout.querySelectorAll('*')]) {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) continue
    if (cs.position === 'fixed') continue // the overlays themselves / other chrome
    const c = toCanvas(r)
    const nearBottom = c.bottom > canvas.height - 80
    const nearTop = c.top < 80
    if (!nearBottom && !nearTop) continue
    if (h(c) / canvas.height >= 0.92 && w(c) / canvas.width >= 0.92) continue // full-canvas shell
    if (!paints(el)) continue
    const z = cs.zIndex
    content.push({
      label: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''}`,
      rect: c,
      zIndex: z === 'auto' || z === '' ? null : Number(z),
      opaque: opaqueBg(el),
    })
  }

  const fm = window.__slidev__.nav.slides?.[n - 1]?.meta?.slide?.frontmatter ?? {}
  const exceptions = Array.isArray(fm.safeAreaExceptions) ? fm.safeAreaExceptions : []
  return { overlays, content, exceptions, frame: { cw, scale: +scale.toFixed(4) } }
}
