import { describe, it, expect } from 'vitest'
import { optionsFor } from '../src/lib/automationOptions.js'
import { addAutomation, addCondition } from '../src/lib/automationMutations.js'
import { validateDefinition } from '../src/lib/validate.js'
import { blankDefinition } from '../src/lib/blank.js'

function seeded() {
  const def = blankDefinition()
  def.data_model.entities.push({ id: 'qa_review', doctype: 'QA Review', mode: 'new', fields: ['title', 'status'] })
  def.data_model.entities.push({ id: 'uat_run', doctype: 'UAT Run', mode: 'new', fields: ['result', 'status'] })
  def.notifications.push({ id: 'review_assigned', channel: 'email', subject: 's', body: 'b' })
  def.permissions.push({ role: 'QA Manager', entity: 'qa_review', read: true, write: true })
  def.workflow.states.push({ id: 'planned', label: 'Planned' }, { id: 'assigned', label: 'Assigned' })
  def.workflow.transitions.push({ id: 'assign', from: 'planned', to: 'assigned', action: 'Assign', role: 'Reviewer' })
  return def
}

describe('automation option sources draw from current Studio data', () => {
  it('entities, distinct fields, notifications and roles', () => {
    const def = seeded()
    expect(optionsFor(def, 'entity')).toEqual(['qa_review', 'uat_run'])
    expect(optionsFor(def, 'field')).toEqual(['title', 'status', 'result']) // distinct, order-preserved
    expect(optionsFor(def, 'notification')).toEqual(['review_assigned'])
    expect(optionsFor(def, 'role')).toEqual(['QA Manager', 'Reviewer']) // permissions + transitions, distinct
  })

  it('unknown/absent source yields no options (free text fallback)', () => {
    expect(optionsFor(blankDefinition(), 'field')).toEqual([])
    expect(optionsFor(seeded(), 'value')).toEqual([])
  })

  it('binding a param to an option keeps the schema shape (string value)', () => {
    const def = seeded()
    addAutomation(def)
    const a = def.automations[0]
    addCondition(a, 'field_equals')
    a.conditions[0].field = optionsFor(def, 'field')[0] // choosing from the dropdown
    a.conditions[0].value = 'open'
    expect(typeof a.conditions[0].field).toBe('string')
    expect(validateDefinition(def)).toEqual([])
  })
})
