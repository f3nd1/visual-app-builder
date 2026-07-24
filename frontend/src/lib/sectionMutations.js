// Mutations for the flat sections: permissions, translations, notifications,
// tests. Each keeps the definition in exact schema shape.
import { uniqueId } from './ids.js'
import { checkedSectionIds } from './defIds.js'

// --- permissions (no ids; a flat array of role/entity grants) ---
export function addPermission(def, entity = '') {
  def.permissions.push({ role: 'System Manager', entity, read: true, write: false, create: false, submit: false })
}
export function removePermission(def, i) {
  def.permissions.splice(i, 1)
}

// --- translations: object { key: { lang: string } } ---
export const LANGS = ['en', 'zh-CN'] // English + Simplified Chinese (MVP_SCOPE)

export function addTranslationKey(def, key = 'new.key') {
  let k = key
  let n = 2
  while (k in def.translations) k = `${key}_${n++}`
  def.translations[k] = Object.fromEntries(LANGS.map((l) => [l, '']))
}
export function renameTranslationKey(def, oldKey, newKey) {
  if (oldKey === newKey || !newKey || newKey in def.translations) return false
  const val = def.translations[oldKey]
  delete def.translations[oldKey]
  def.translations[newKey] = val
  return true
}
export function removeTranslationKey(def, key) {
  delete def.translations[key]
}

// --- notifications ---
export function addNotification(def, subject = 'New notification') {
  const id = uniqueId(subject, checkedSectionIds(def))
  def.notifications.push({ id, channel: 'email', subject, body: '' })
  return id
}
export function removeNotification(def, id) {
  def.notifications = def.notifications.filter((n) => n.id !== id)
}

// --- tests ---
export function addTest(def, title = 'New test') {
  const id = uniqueId(title, checkedSectionIds(def))
  def.tests.push({ id, title, expected: '' })
  return id
}
export function removeTest(def, id) {
  def.tests = def.tests.filter((t) => t.id !== id)
}
