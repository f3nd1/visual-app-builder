import { describe, it, expect } from 'vitest'
import {
  addPermission, addTranslationKey, renameTranslationKey, removeTranslationKey,
  addNotification, addTest, LANGS,
} from '../src/lib/sectionMutations.js'
import { validateDefinition } from '../src/lib/validate.js'
import { blankDefinition } from '../src/lib/blank.js'

describe('flat-section mutations stay schema-valid', () => {
  it('permissions', () => {
    const def = blankDefinition()
    def.data_model.entities.push({ id: 'qa_review', doctype: 'QA Review', mode: 'new', fields: [] })
    addPermission(def, 'qa_review')
    expect(def.permissions[0]).toMatchObject({ role: 'System Manager', entity: 'qa_review', read: true })
    expect(validateDefinition(def)).toEqual([])
  })

  it('translations add/rename/remove with both languages', () => {
    const def = blankDefinition()
    addTranslationKey(def, 'app.title')
    expect(Object.keys(def.translations['app.title'])).toEqual(LANGS)
    expect(renameTranslationKey(def, 'app.title', 'app.name')).toBe(true)
    expect('app.name' in def.translations).toBe(true)
    expect('app.title' in def.translations).toBe(false)
    removeTranslationKey(def, 'app.name')
    expect(Object.keys(def.translations)).toHaveLength(0)
    expect(validateDefinition(def)).toEqual([])
  })

  it('rename refuses to clobber an existing key', () => {
    const def = blankDefinition()
    addTranslationKey(def, 'a')
    addTranslationKey(def, 'b')
    expect(renameTranslationKey(def, 'a', 'b')).toBe(false)
    expect('a' in def.translations).toBe(true)
  })

  it('notifications and tests get unique schema-valid ids', () => {
    const def = blankDefinition()
    const n = addNotification(def, 'Review assigned')
    const t = addTest(def, 'Access is restricted')
    expect(n).toBe('review_assigned')
    expect(t).toBe('access_is_restricted')
    expect(validateDefinition(def)).toEqual([])
  })
})
