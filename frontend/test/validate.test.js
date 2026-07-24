import { describe, it, expect } from 'vitest'
import { validateDefinition } from '../src/lib/validate.js'
import { slugify, uniqueId, ID_PATTERN } from '../src/lib/ids.js'
import { blankDefinition } from '../src/lib/blank.js'
import qa from '../../examples/qa_lifecycle_manager.json'
import dcm from '../../examples/document_control_manager.json'
import mvm from '../../examples/material_vetting_manager.json'

describe('validateDefinition agrees with check_repository.py on known-good files', () => {
  it.each([
    ['qa_lifecycle_manager', qa],
    ['document_control_manager', dcm],
    ['material_vetting_manager', mvm],
  ])('%s validates with zero issues', (_name, def) => {
    expect(validateDefinition(def)).toEqual([])
  })

  it('a blank definition is schema-valid', () => {
    expect(validateDefinition(blankDefinition())).toEqual([])
  })
})

describe('validateDefinition catches what the schema alone cannot', () => {
  it('flags a duplicate id across sections', () => {
    const def = structuredClone(qa)
    // reuse a page id as a test id -> cross-section collision
    def.tests[0].id = def.pages[0].id
    const issues = validateDefinition(def)
    expect(issues.some((i) => /duplicate id/.test(i.message))).toBe(true)
  })

  it('flags a transition pointing at an unknown state', () => {
    const def = structuredClone(qa)
    def.workflow.transitions[0].to = 'nonexistent_state'
    const issues = validateDefinition(def)
    expect(issues.some((i) => /unknown to state/.test(i.message))).toBe(true)
  })

  it('flags a bad application.code via the schema pattern', () => {
    const def = structuredClone(qa)
    def.application.code = 'Not A Code'
    expect(validateDefinition(def).length).toBeGreaterThan(0)
  })
})

describe('id helpers produce schema-valid, unique ids', () => {
  it('slugify always yields the ^[a-z][a-z0-9_]*$ pattern', () => {
    for (const label of ['QA Review', '123 start', '  Spaces  ', 'a/b-c', '']) {
      expect(ID_PATTERN.test(slugify(label))).toBe(true)
    }
  })

  it('uniqueId avoids collisions', () => {
    const taken = ['review', 'review_2']
    expect(uniqueId('Review', taken)).toBe('review_3')
    expect(uniqueId('Brand New', taken)).toBe('brand_new')
  })
})
