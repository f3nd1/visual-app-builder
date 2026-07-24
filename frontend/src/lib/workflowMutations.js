// Workflow states + transitions. Ids come from the checked-section namespace.
import { uniqueId } from './ids.js'
import { checkedSectionIds } from './defIds.js'

export function addState(def, label = 'New State') {
  const id = uniqueId(label, checkedSectionIds(def))
  def.workflow.states.push({ id, label })
  return id
}

export function removeState(def, id) {
  const wf = def.workflow
  wf.states = wf.states.filter((s) => s.id !== id)
  // transitions referencing a removed state would be invalid -> drop them
  wf.transitions = wf.transitions.filter((t) => t.from !== id && t.to !== id)
}

export function addTransition(def, from, to, action = 'Advance', role = 'System Manager') {
  const id = uniqueId(`${from}_to_${to}`, checkedSectionIds(def))
  def.workflow.transitions.push({ id, from, to, action, role })
  return id
}

export function removeTransition(def, id) {
  def.workflow.transitions = def.workflow.transitions.filter((t) => t.id !== id)
}
