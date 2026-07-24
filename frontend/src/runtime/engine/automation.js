// Automation execution against the mock data. Reads automations purely from
// definition_json in the exact { id, trigger, conditions, actions } shape the
// Studio produces. Trigger detection + condition evaluation + action execution.
//
// Data-changing actions (create record, update field, assign user) actually run
// against the DataAdapter. Email / notification actions only log what WOULD be
// sent — those become real Frappe calls in the FrappeDataAdapter era (see
// docs/RUNTIME_ADAPTERS.md).
//
// event: { type, entityId, record, changedField? }
//   type: 'record_created' | 'record_submitted' | 'field_changed'

function triggerMatches(trigger, event) {
  switch (trigger.type) {
    case 'record_created':
      return event.type === 'record_created'
    case 'record_submitted':
      return event.type === 'record_submitted'
    case 'field_changed':
      return event.type === 'field_changed' && (!trigger.field || trigger.field === event.changedField)
    // time-based triggers don't fire from interactive events
    case 'due_date_reached':
    case 'scheduled_daily':
      return false
    default:
      return false
  }
}

const today = () => new Date().toISOString().slice(0, 10)

async function conditionPasses(ctx, cond, record, log) {
  const r = record || {}
  switch (cond.type) {
    case 'field_equals':
      return r[cond.field] === cond.value
    case 'field_empty':
      return !r[cond.field]
    case 'date_overdue':
      return r[cond.field] && r[cond.field] < today()
    case 'user_has_role':
      return (ctx.user?.roles || []).includes(cond.role)
    case 'related_record_exists': {
      try {
        return (await ctx.adapter.listRecords(cond.entity)).length > 0
      } catch {
        return false
      }
    }
    case 'checklist_complete':
      // no checklist data in the mock — cannot determine, so do not block
      log.push(`condition "checklist_complete" assumed true (no checklist data in mock)`)
      return true
    default:
      return true
  }
}

async function runAction(ctx, action, event, log) {
  const rec = event.record || {}
  switch (action.type) {
    case 'create_record': {
      const created = await ctx.adapter.createRecord(action.entity, {})
      log.push(`created ${action.entity} ${created.name}`)
      break
    }
    case 'update_field': {
      if (event.entityId && rec.name) {
        await ctx.adapter.updateRecord(event.entityId, rec.name, { [action.field]: action.value })
        log.push(`set ${action.field} = "${action.value}" on ${rec.name}`)
      }
      break
    }
    case 'assign_user': {
      if (event.entityId && rec.name) {
        await ctx.adapter.updateRecord(event.entityId, rec.name, { assigned_to: action.user })
        log.push(`assigned ${rec.name} to ${action.user}`)
      }
      break
    }
    case 'send_email':
    case 'send_system_notification':
      log.push(`[stub] would ${action.type} using notification "${action.notification}"`)
      break
    case 'request_approval':
      log.push(`[stub] would request approval from role "${action.role}"`)
      break
    case 'create_quality_action':
      log.push(`[stub] would create a Quality Action`)
      break
    case 'block_submission':
      log.push(`[stub] would block submission: "${action.message}"`)
      break
    default:
      log.push(`[stub] unknown action "${action.type}"`)
  }
}

// Run all automations whose trigger matches the event and whose conditions
// pass. Returns a log of what happened / would have happened.
export async function runAutomations(ctx, event) {
  const log = []
  for (const auto of ctx.def.automations || []) {
    if (!triggerMatches(auto.trigger, event)) continue
    let pass = true
    for (const cond of auto.conditions || []) {
      if (!(await conditionPasses(ctx, cond, event.record, log))) { pass = false; break }
    }
    if (!pass) continue
    log.push(`automation "${auto.id}" fired (${auto.trigger.type})`)
    for (const action of auto.actions || []) await runAction(ctx, action, event, log)
  }
  return log
}

export { triggerMatches }
