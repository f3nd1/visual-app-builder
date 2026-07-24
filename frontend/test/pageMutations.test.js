import { describe, it, expect } from 'vitest'
import {
  addPage, addComponent, addFieldComponent, makeComponent,
  duplicateComponent, removeComponent, moveComponent, allComponentIds,
} from '../src/lib/pageMutations.js'
import { validateDefinition } from '../src/lib/validate.js'
import { blankDefinition } from '../src/lib/blank.js'

function seed() {
  const def = blankDefinition()
  def.data_model.entities.push({ id: 'qa_review', doctype: 'QA Review', mode: 'new', fields: ['title', 'status'] })
  const pid = addPage(def, 'Records', 'list')
  return { def, page: def.pages.find((p) => p.id === pid) }
}

describe('page/component mutations keep the definition schema-valid', () => {
  it('adds palette components with unique ids and stays valid', () => {
    const { def, page } = seed()
    addComponent(def, page, 'record_list')
    addComponent(def, page, 'record_list')
    const ids = allComponentIds(def)
    expect(new Set(ids).size).toBe(ids.length) // all unique
    expect(validateDefinition(def)).toEqual([])
  })

  it('a dropped field becomes a bound field component', () => {
    const { def, page } = seed()
    addFieldComponent(def, page, 'qa_review', 'status')
    const c = page.components[0]
    expect(c.type).toBe('text_field')
    expect(c.entity).toBe('qa_review')
    expect(c.field).toBe('status')
    expect(validateDefinition(def)).toEqual([])
  })

  it('insert index positions the component (live-drop placeholder)', () => {
    const { def, page } = seed()
    addComponent(def, page, 'record_list') // idx 0
    addComponent(def, page, 'record_form') // idx 1
    addComponent(def, page, 'metric_group', {}, 1) // insert between
    expect(page.components.map((c) => c.type)).toEqual(['record_list', 'metric_group', 'record_form'])
  })

  it('duplicate creates a new unique id right after the source', () => {
    const { def, page } = seed()
    const id = addComponent(def, page, 'checklist')
    const dupId = duplicateComponent(def, page, id)
    expect(dupId).not.toBe(id)
    expect(page.components).toHaveLength(2)
    expect(validateDefinition(def)).toEqual([])
  })

  it('move and remove work', () => {
    const { def, page } = seed()
    addComponent(def, page, 'record_list')
    const b = addComponent(def, page, 'record_form')
    moveComponent(page, b, -1)
    expect(page.components[0].id).toBe(b)
    removeComponent(page, b)
    expect(page.components).toHaveLength(1)
  })

  it('makeComponent rejects unknown types', () => {
    const { def } = seed()
    expect(() => makeComponent(def, 'not_a_type')).toThrow()
  })
})
