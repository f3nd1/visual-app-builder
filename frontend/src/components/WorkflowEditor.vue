<script setup>
import { ref, computed, watchEffect } from 'vue'
import { VueFlow, Handle, Position } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import { store } from '../store.js'
import { addState, removeState, addTransition, removeTransition } from '../lib/workflowMutations.js'
import { workflowDiagnostics } from '../lib/workflowChecks.js'
import { getNodePos, setNodePos, ensurePositions } from '../lib/layoutStore.js'
import ContextMenu from './ContextMenu.vue'

// def is the source of truth. Node positions are Studio-only layout state (the
// schema's state object is additionalProperties:false, so x/y must NOT be
// exported) — persisted in the separate layoutStore, keyed by app code+version.
const CANVAS = 'workflow'
const menu = ref({ open: false, x: 0, y: 0, items: [] })
const sel = ref(null) // { kind: 'state'|'transition', id }

const wf = () => store.def.workflow
const diag = computed(() => workflowDiagnostics(store.def))

watchEffect(() => {
  ensurePositions(
    store.def,
    CANVAS,
    wf().states.map((s) => s.id),
    (_id, i) => ({ x: 60 + (i % 4) * 200, y: 60 + Math.floor(i / 4) * 140 }),
  )
})

const nodes = computed(() =>
  wf().states.map((s) => ({
    id: s.id,
    position: getNodePos(store.def, CANVAS, s.id) || { x: 40, y: 40 },
    data: { label: s.label, diag: diag.value.byState[s.id] },
    class: sel.value?.kind === 'state' && sel.value.id === s.id ? 'selected' : '',
  })),
)
const edges = computed(() =>
  wf().transitions.map((t) => ({
    id: t.id,
    source: t.from,
    target: t.to,
    label: t.action,
    animated: true,
    class: sel.value?.kind === 'transition' && sel.value.id === t.id ? 'selected' : '',
  })),
)

const selState = computed(() => (sel.value?.kind === 'state' ? wf().states.find((s) => s.id === sel.value.id) : null))
const selTransition = computed(() => (sel.value?.kind === 'transition' ? wf().transitions.find((t) => t.id === sel.value.id) : null))

function onConnect({ source, target }) {
  const id = addTransition(store.def, source, target)
  sel.value = { kind: 'transition', id }
}
function onNodeDragStop({ node }) {
  setNodePos(store.def, CANVAS, node.id, node.position)
}
function newState() {
  const id = addState(store.def)
  sel.value = { kind: 'state', id }
}

function nodeMenu({ event, node }) {
  event.preventDefault()
  sel.value = { kind: 'state', id: node.id }
  menu.value = {
    open: true, x: event.clientX, y: event.clientY,
    items: [
      { label: 'Rename', action: () => renameState(node.id) },
      { label: 'Delete state', danger: true, action: () => { removeState(store.def, node.id); sel.value = null } },
    ],
  }
}
function edgeMenu({ event, edge }) {
  event.preventDefault()
  sel.value = { kind: 'transition', id: edge.id }
  menu.value = {
    open: true, x: event.clientX, y: event.clientY,
    items: [
      { label: 'Edit transition', action: () => {} }, // selection already opens the inspector
      { label: 'Delete transition', danger: true, action: () => { removeTransition(store.def, edge.id); sel.value = null } },
    ],
  }
}
function renameState(id) {
  const s = wf().states.find((x) => x.id === id)
  const next = window.prompt('State label', s.label)
  if (next != null) s.label = next
}
</script>

<template>
  <div class="wf">
    <div class="wf-toolbar">
      <button @click="newState" data-testid="add-state">+ State</button>
      <span class="muted tiny">Drag from a node's right edge to another node to create a transition. Right-click a node or edge for options.</span>
      <span class="spacer"></span>
      <span v-if="diag.orphan.size || diag.unreachable.size" class="issue-chip err">
        {{ diag.orphan.size }} orphan · {{ diag.unreachable.size }} unreachable
      </span>
      <span v-else class="issue-chip ok">workflow connected</span>
    </div>

    <div class="wf-body">
      <div class="wf-canvas">
        <VueFlow
          :nodes="nodes"
          :edges="edges"
          :fit-view-on-init="true"
          @connect="onConnect"
          @node-drag-stop="onNodeDragStop"
          @node-click="sel = { kind: 'state', id: $event.node.id }"
          @edge-click="sel = { kind: 'transition', id: $event.edge.id }"
          @node-context-menu="nodeMenu"
          @edge-context-menu="edgeMenu"
        >
          <Background />
          <Controls />
          <template #node-default="{ data }">
            <div class="wf-node" :class="{ warn: data.diag?.orphan || data.diag?.unreachable }">
              <Handle type="target" :position="Position.Left" />
              <span>{{ data.label }}</span>
              <span
                v-if="data.diag?.orphan || data.diag?.unreachable"
                class="badge"
                :title="data.diag.orphan ? 'Orphan: no transitions in or out' : 'Unreachable from any start state'"
              >⚠</span>
              <Handle type="source" :position="Position.Right" />
            </div>
          </template>
        </VueFlow>
      </div>

      <aside class="wf-inspector">
        <h4>Inspector</h4>
        <template v-if="selState">
          <div class="insp-row"><label>state id</label><code class="pill">{{ selState.id }}</code></div>
          <div class="insp-row"><label>label</label><input v-model="selState.label" /></div>
          <button class="danger" @click="removeState(store.def, selState.id); sel = null">Delete state</button>
        </template>
        <template v-else-if="selTransition">
          <div class="insp-row"><label>transition</label><code class="pill">{{ selTransition.id }}</code></div>
          <div class="insp-row"><label>from</label><code class="pill">{{ selTransition.from }}</code></div>
          <div class="insp-row"><label>to</label><code class="pill">{{ selTransition.to }}</code></div>
          <div class="insp-row"><label>action</label><input v-model="selTransition.action" /></div>
          <div class="insp-row"><label>role</label><input v-model="selTransition.role" /></div>
          <div class="insp-row"><label>condition</label><input v-model="selTransition.condition" placeholder="optional" /></div>
          <button class="danger" @click="removeTransition(store.def, selTransition.id); sel = null">Delete transition</button>
        </template>
        <p v-else class="muted tiny">Select a state or transition to edit it.</p>
      </aside>
    </div>

    <ContextMenu :menu="menu" />
  </div>
</template>

<style scoped>
.wf { display: flex; flex-direction: column; gap: 10px; }
.wf-toolbar { display: flex; align-items: center; gap: 10px; }
.wf-body { display: grid; grid-template-columns: 1fr 260px; gap: 12px; }
.wf-canvas { height: 62vh; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--panel); }
.wf-inspector { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 10px; height: fit-content; }
.wf-node { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--panel); font-weight: 600; }
.wf-node.warn { border-color: var(--err); }
.badge { color: var(--err); }
.spacer { flex: 1; }
.tiny { font-size: 11px; }
.insp-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 8px 0; }
.insp-row label { color: var(--muted); font-size: 12px; }
.insp-row input { flex: 1; min-width: 0; }
h4 { margin: 4px 0 10px; }
button.danger { margin-top: 8px; }
button.danger:hover { border-color: var(--err); color: var(--err); }
:deep(.vue-flow__node.selected) .wf-node { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(44,123,229,.2); }
:deep(.vue-flow__edge.selected) .vue-flow__edge-path { stroke: var(--accent); stroke-width: 2; }
</style>
