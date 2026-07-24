// Inline workflow diagnostics surfaced on the node canvas. These are design
// aids (not schema errors): a state can be structurally valid yet orphaned or
// unreachable, which almost always signals a modelling mistake.
//
// - orphan: no transitions in or out.
// - unreachable: cannot be reached, by following transitions, from any "start"
//   state (a state with no incoming transition). If every state has an
//   incoming transition (a pure cycle), nothing is treated as a start, so all
//   are reported unreachable — which is itself worth flagging.

export function workflowDiagnostics(def) {
  const states = def.workflow?.states || []
  const transitions = def.workflow?.transitions || []
  const ids = states.map((s) => s.id)

  const hasOut = new Set(transitions.map((t) => t.from))
  const hasIn = new Set(transitions.map((t) => t.to))

  const orphan = new Set(ids.filter((id) => !hasOut.has(id) && !hasIn.has(id)))

  // reachability from start states
  const starts = ids.filter((id) => !hasIn.has(id))
  const adj = {}
  for (const t of transitions) (adj[t.from] ||= []).push(t.to)
  const reachable = new Set()
  const stack = [...starts]
  while (stack.length) {
    const cur = stack.pop()
    if (reachable.has(cur)) continue
    reachable.add(cur)
    for (const next of adj[cur] || []) stack.push(next)
  }
  const unreachable = new Set(ids.filter((id) => !reachable.has(id) && !orphan.has(id)))

  const byState = {}
  for (const id of ids) {
    byState[id] = { orphan: orphan.has(id), unreachable: unreachable.has(id) }
  }
  return { byState, orphan, unreachable, starts }
}
