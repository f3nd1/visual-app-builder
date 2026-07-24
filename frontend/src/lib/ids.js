// Stable-ID helpers. All IDs the Studio generates must match the schema
// pattern ^[a-z][a-z0-9_]*$ and stay unique within their section
// (docs/DEFINITION_MODEL.md).

export const ID_PATTERN = /^[a-z][a-z0-9_]*$/

// Turn a human label into a schema-valid id stem. Non-alphanumerics become
// underscores; a leading non-letter is prefixed so the result always starts
// with a letter.
export function slugify(label) {
  let s = String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  if (!s) s = 'item'
  if (!/^[a-z]/.test(s)) s = 'x_' + s
  return s
}

// Return an id derived from `stem` that is not already in `taken` (a Set or
// array of existing ids). Appends _2, _3, ... on collision.
export function uniqueId(stem, taken) {
  const set = taken instanceof Set ? taken : new Set(taken)
  const base = slugify(stem)
  if (!set.has(base)) return base
  let n = 2
  while (set.has(`${base}_${n}`)) n++
  return `${base}_${n}`
}
