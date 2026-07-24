import { describe, it, expect } from 'vitest'
import { canTransition, executeTransition } from '../../src/runtime/engine/workflow.js'
import { runAutomations, triggerMatches } from '../../src/runtime/engine/automation.js'
import { MockDataAdapter } from '../../src/runtime/adapters/MockDataAdapter.js'
import { MockPermissionAdapter } from '../../src/runtime/adapters/MockPermissionAdapter.js'
import { createRuntimeContext } from '../../src/runtime/context.js'
import { MOCK_USERS } from '../../src/runtime/fixtures/users.js'
import qa from '../../../examples/qa_lifecycle_manager.json'

const user = (n) => MOCK_USERS.find((u) => u.name === n)
function ctxFor(userName) {
  const def = structuredClone(qa)
  const adapter = new MockDataAdapter(def, { permissionAdapter: new MockPermissionAdapter(def) })
  return createRuntimeContext(def, { adapter, user: user(userName) })
}
const t = (def, id) => def.workflow.transitions.find((x) => x.id === id)

describe('workflow transition execution', () => {
  it('canTransition enforces from-state and role', () => {
    const assign = t(qa, 'assign_review') // planned -> assigned, role QA Manager
    expect(canTransition(qa, user('qa_manager'), assign, { status: 'planned' }).ok).toBe(true)
    expect(canTransition(qa, user('app_user'), assign, { status: 'planned' }).ok).toBe(false) // wrong role
    expect(canTransition(qa, user('qa_manager'), assign, { status: 'closed' }).ok).toBe(false) // wrong state
    expect(canTransition(qa, user('Administrator'), assign, { status: 'planned' }).ok).toBe(true) // superuser
  })

  it('executeTransition moves the record and yields a field_changed event', async () => {
    const ctx = ctxFor('qa_manager')
    // seed a record in the 'planned' state
    const rec = await ctx.adapter.createRecord('qa_review', { title: 'T', status: 'planned' })
    const { record, event } = await executeTransition(ctx, 'qa_review', rec.name, t(ctx.def, 'assign_review'))
    expect(record.status).toBe('assigned')
    expect(event).toMatchObject({ type: 'field_changed', changedField: 'status' })
  })

  it('executeTransition rejects a role that is not allowed', async () => {
    const ctx = ctxFor('app_user')
    const rec = await ctx.adapter.createRecord('qa_review', { title: 'T', status: 'planned' })
    await expect(executeTransition(ctx, 'qa_review', rec.name, t(ctx.def, 'assign_review'))).rejects.toThrow(/requires role/)
  })

  it('executeTransition rejects a user with the transition role but no write permission', async () => {
    // role gate passes (QA Manager) but no permission row grants QA Manager write
    const ctx = ctxFor('qa_manager')
    ctx.user = { name: 'role_only', roles: ['QA Manager'] } // not App User, not System Manager
    const rec = await ctx.adapter.createRecord('qa_review', { title: 'T', status: 'planned' })
    await expect(executeTransition(ctx, 'qa_review', rec.name, t(ctx.def, 'assign_review'))).rejects.toThrow(/write permission/)
    // and the record must NOT have moved
    expect((await ctx.adapter.getRecord('qa_review', rec.name)).status).toBe('planned')
  })
})

describe('automation execution', () => {
  it('triggerMatches on event type and optional field', () => {
    expect(triggerMatches({ type: 'record_created' }, { type: 'record_created' })).toBe(true)
    expect(triggerMatches({ type: 'field_changed', field: 'status' }, { type: 'field_changed', changedField: 'status' })).toBe(true)
    expect(triggerMatches({ type: 'field_changed', field: 'owner' }, { type: 'field_changed', changedField: 'status' })).toBe(false)
    expect(triggerMatches({ type: 'scheduled_daily' }, { type: 'field_changed' })).toBe(false)
  })

  it('runs matching automations: condition + update_field action against mock data', async () => {
    const ctx = ctxFor('Administrator')
    const rec = await ctx.adapter.createRecord('qa_review', { title: 'T', status: 'action_required' })
    ctx.def.automations = [{
      id: 'esc',
      trigger: { type: 'field_changed', field: 'status' },
      conditions: [{ type: 'field_equals', field: 'status', value: 'action_required' }],
      actions: [{ type: 'update_field', field: 'owner', value: 'Escalation Team' }],
    }]
    const log = await runAutomations(ctx, { type: 'field_changed', entityId: 'qa_review', record: rec, changedField: 'status' })
    expect(log.some((l) => /fired/.test(l))).toBe(true)
    const after = await ctx.adapter.getRecord('qa_review', rec.name)
    expect(after.owner).toBe('Escalation Team')
  })

  it('skips automations whose condition fails', async () => {
    const ctx = ctxFor('Administrator')
    const rec = await ctx.adapter.createRecord('qa_review', { title: 'T', status: 'planned' })
    ctx.def.automations = [{
      id: 'esc',
      trigger: { type: 'field_changed', field: 'status' },
      conditions: [{ type: 'field_equals', field: 'status', value: 'action_required' }],
      actions: [{ type: 'update_field', field: 'owner', value: 'X' }],
    }]
    const log = await runAutomations(ctx, { type: 'field_changed', entityId: 'qa_review', record: rec, changedField: 'status' })
    expect(log.some((l) => /fired/.test(l))).toBe(false)
  })

  it('a throwing action is contained: logged as an error, later actions still run', async () => {
    const ctx = ctxFor('Administrator')
    const rec = await ctx.adapter.createRecord('qa_review', { title: 'T', status: 'planned' })
    ctx.def.automations = [{
      id: 'bad_then_good',
      trigger: { type: 'record_created' },
      conditions: [],
      actions: [
        { type: 'create_record', entity: 'no_such_entity' }, // throws in the adapter
        { type: 'send_email', notification: 'still_runs' },
      ],
    }]
    // must not reject the whole run
    const log = await runAutomations(ctx, { type: 'record_created', entityId: 'qa_review', record: rec })
    expect(log.some((l) => /error/i.test(l) && /no_such_entity|unknown entity/.test(l))).toBe(true)
    expect(log.some((l) => /still_runs/.test(l))).toBe(true)
  })

  it('email/notification actions only log (no real send)', async () => {
    const ctx = ctxFor('Administrator')
    ctx.def.automations = [{
      id: 'notify',
      trigger: { type: 'record_created' },
      conditions: [],
      actions: [{ type: 'send_email', notification: 'review_assignment' }],
    }]
    const log = await runAutomations(ctx, { type: 'record_created', entityId: 'qa_review', record: { name: 'X' } })
    expect(log.some((l) => /\[stub\] would send_email/.test(l))).toBe(true)
  })
})
