import { describe, it, expect } from 'vitest'
import { addEntity, removeEntity, addRelationship, removeRelationship } from '../src/lib/mutations.js'
import { validateDefinition } from '../src/lib/validate.js'
import { blankDefinition } from '../src/lib/blank.js'

describe('data-model mutations keep the definition schema-valid', () => {
  it('adds entities with unique, schema-valid ids', () => {
    const def = blankDefinition()
    const a = addEntity(def, 'QA Review')
    const b = addEntity(def, 'QA Review') // same label -> must differ
    expect(a).toBe('qa_review')
    expect(b).toBe('qa_review_2')
    expect(validateDefinition(def)).toEqual([])
  })

  it('removing an entity also drops relationships that referenced it', () => {
    const def = blankDefinition()
    const a = addEntity(def, 'A')
    const b = addEntity(def, 'B')
    addRelationship(def, a, b, 'link')
    expect(def.data_model.relationships).toHaveLength(1)
    removeEntity(def, b)
    expect(def.data_model.relationships).toHaveLength(0)
    expect(validateDefinition(def)).toEqual([])
  })

  it('add/remove relationship round-trips cleanly', () => {
    const def = blankDefinition()
    const a = addEntity(def, 'A')
    const b = addEntity(def, 'B')
    const rid = addRelationship(def, a, b, 'child_table')
    expect(def.data_model.relationships[0].type).toBe('child_table')
    removeRelationship(def, rid)
    expect(def.data_model.relationships).toHaveLength(0)
  })
})
