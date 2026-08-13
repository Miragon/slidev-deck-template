/**
 * A tiny, dependency-free glob matcher for `overrides`/`exceptions` file
 * selectors. Supports the subset a deck config needs:
 *   **  any run of characters including `/`
 *   *   any run of characters except `/`
 *   ?   a single character except `/`
 * Everything else is matched literally. Paths are compared repo-relative with
 * forward slashes. A bare directory glob like `deck/chapter/99-legacy/` also
 * matches everything beneath it, so authors can omit the trailing `**`.
 */

/** Compile one glob to a RegExp. Throws on an obviously malformed pattern. */
export function globToRegExp(glob) {
  if (typeof glob !== 'string' || !glob.length) {
    throw new Error(`Invalid file glob: ${JSON.stringify(glob)}`)
  }
  // A trailing "/" means "this directory and everything under it".
  let g = glob.endsWith('/') ? `${glob}**` : glob
  let re = '^'
  for (let i = 0; i < g.length; i++) {
    const c = g[i]
    if (c === '*') {
      if (g[i + 1] === '*') {
        re += '.*'
        i++
        // consume a following slash so `**/x` also matches `x` at the root
        if (g[i + 1] === '/') i++
      } else {
        re += '[^/]*'
      }
    } else if (c === '?') {
      re += '[^/]'
    } else if ('\\^$.|+()[]{}'.includes(c)) {
      re += `\\${c}`
    } else {
      re += c
    }
  }
  re += '$'
  return new RegExp(re)
}

/** Does `relPath` (repo-relative, forward slashes) match any of the globs? */
export function matchesAny(relPath, globs) {
  const p = String(relPath).split('\\').join('/')
  return globs.some((g) => globToRegExp(g).test(p))
}
