/**
 * Navigation that steps over the switched-off slides.
 *
 * Slidev's built-in shortcuts carry stable names, and a shortcuts setup gets
 * the whole array and returns it. So we do not rebind keys and we do not
 * rebuild the magicKeys combinations: we map over the array and swap `fn` on
 * the ten navigation entries. Everything else, including the guard that warns
 * when a setup drops the base shortcuts, keeps working.
 *
 * The click logic has to be rebuilt by hand: exhaust the current slide's
 * `v-click` steps first, only then look for the next slide that is on.
 */
import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { useNav } from '@slidev/client'
import { editable, isSlideOff } from '../state'

export default function (context: NavOperations, shortcuts: ShortcutOptions[]) {
  const nav = useNav()

  // Editing keeps normal navigation, so a switched-off slide stays reachable
  // and can be turned back on. That is the play view with the controls on
  // screen only: the presenter window is presenting and keeps skipping.
  const editing = () => editable.value && nav.isPlaying.value
  const off = (no: number) => !editing() && isSlideOff(nav.slides.value, no)

  const seek = (from: number, step: 1 | -1) => {
    let no = from + step
    while (no >= 1 && no <= nav.slides.value.length && off(no))
      no += step
    return no >= 1 && no <= nav.slides.value.length ? no : undefined
  }

  function next() {
    // finish the clicks of the current slide first
    if (nav.clicks.value < nav.clicksTotal.value)
      return context.next()
    const no = seek(nav.currentSlideNo.value, 1)
    if (no)
      nav.go(no)
  }

  function prev() {
    if (nav.clicks.value > nav.clicksStart.value)
      return context.prev()
    const no = seek(nav.currentSlideNo.value, -1)
    // land on the last click of the previous slide, like the built-in prev.
    // `go` clamps the click count to what the target slide actually has.
    if (no)
      nav.go(no, Number.MAX_SAFE_INTEGER)
  }

  function nextSlide() {
    const no = seek(nav.currentSlideNo.value, 1)
    if (no)
      nav.go(no)
  }

  function prevSlide() {
    const no = seek(nav.currentSlideNo.value, -1)
    if (no)
      nav.go(no)
  }

  const replacements: Record<string, () => void> = {
    next_space: next,
    prev_space: prev,
    next_right: next,
    prev_left: prev,
    next_page_key: next,
    prev_page_key: prev,
    next_down: nextSlide,
    prev_up: prevSlide,
    next_shift: nextSlide,
    prev_shift: prevSlide,
  }

  return shortcuts.map(shortcut => (
    shortcut.name && replacements[shortcut.name]
      ? { ...shortcut, fn: replacements[shortcut.name] }
      : shortcut
  ))
}
