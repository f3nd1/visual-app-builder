<script setup>
import { computed } from 'vue'
import { store } from '../store.js'
import { addEntity, removeEntity, addRelationship, removeRelationship } from '../lib/mutations.js'
import { approvedRegistry as registry, registryIssues, seedFromFrappeExport } from '../lib/approvedRegistry.js'

const dm = () => store.def.data_model
const REL_TYPES = ['link', 'child_table', 'dynamic_link', 'reference']

// computed (not a snapshot): re-lists when the registry is reseeded via import
const approvedDocTypes = computed(() => registry.listDocTypes())
const issues = computed(() => registryIssues(store.def, registry))

// Import a real Frappe DocType export and reseed the whitelist from it —
// the path for swapping the demo-derived seed for UCC's actual field list.
function importRegistry(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const seed = seedFromFrappeExport(JSON.parse(reader.result))
      registry.reseed(seed)
      alert(`Registry reseeded: ${seed.length} approved DocType(s).`)
    } catch (e) {
      alert('Registry import failed: ' + e.message)
    }
  }
  reader.readAsText(file)
  ev.target.value = ''
}

function removeField(entity, i) {
  entity.fields.splice(i, 1)
}
function addApprovedField(entity, ev) {
  const f = ev.target.value
  if (f && !entity.fields.includes(f)) entity.fields.push(f)
  ev.target.value = ''
}
function fieldsToAdd(entity) {
  return registry.approvedFields(entity.doctype).filter((f) => !entity.fields.includes(f))
}
const docApproved = (dt) => registry.isApprovedDocType(dt)
const fieldApproved = (dt, f) => registry.isApprovedField(dt, f)

function newRelationship() {
  const ents = dm().entities
  if (ents.length < 1) return
  addRelationship(store.def, ents[0].id, ents[ents.length - 1].id, 'link')
}
</script>

<template>
  <div class="dm">
    <p v-if="issues.length" class="reg-warn" data-testid="registry-warning">
      ⚠ {{ issues.length }} reference{{ issues.length > 1 ? 's' : '' }} not in the Approved DocType Registry.
      A published app may only use approved DocTypes and fields (D-004).
    </p>

    <section>
      <div class="section-head">
        <h3>Approved DocTypes</h3>
        <button @click="addEntity(store.def)">+ DocType</button>
        <label class="filebtn">
          <button type="button" onclick="this.nextElementSibling.click()" title="Reseed the whitelist from a real Frappe DocType export JSON">Import registry…</button>
          <input type="file" accept="application/json" style="display: none" data-testid="import-registry-input" @change="importRegistry" />
        </label>
      </div>
      <datalist id="approved-doctypes">
        <option v-for="dt in approvedDocTypes" :key="dt" :value="dt" />
      </datalist>
      <p class="muted" v-if="dm().entities.length === 0">
        No entities yet. Each entity maps a definition dataset to an approved ERPNext DocType and lists the fields the app may touch.
      </p>
      <div class="card" v-for="e in dm().entities" :key="e.id" :data-testid="`entity-${e.id}`">
        <div class="card-row">
          <label>DocType</label>
          <input
            v-model="e.doctype"
            list="approved-doctypes"
            :class="{ bad: !docApproved(e.doctype) }"
            :data-testid="`doctype-${e.id}`"
          />
          <span v-if="!docApproved(e.doctype)" class="flag" title="Not in the Approved DocType Registry">not approved</span>
          <label>id</label>
          <code class="pill">{{ e.id }}</code>
          <label>mode</label>
          <select v-model="e.mode">
            <option value="existing">existing</option>
            <option value="new">new</option>
          </select>
          <span class="spacer"></span>
          <button class="danger" @click="removeEntity(store.def, e.id)">Delete</button>
        </div>
        <div class="fields">
          <label>Fields</label>
          <span
            class="field-chip"
            :class="{ bad: docApproved(e.doctype) && !fieldApproved(e.doctype, f) }"
            v-for="(f, i) in e.fields"
            :key="i"
            :title="docApproved(e.doctype) && !fieldApproved(e.doctype, f) ? 'Not an approved field for this DocType' : ''"
          >
            {{ f }}
            <button class="chip-x" @click="removeField(e, i)" title="Remove field">×</button>
          </span>
          <select
            v-if="docApproved(e.doctype) && fieldsToAdd(e).length"
            class="addfield"
            :data-testid="`addfield-${e.id}`"
            @change="addApprovedField(e, $event)"
          >
            <option value="">+ approved field…</option>
            <option v-for="f in fieldsToAdd(e)" :key="f" :value="f">{{ f }}</option>
          </select>
          <span v-else-if="!docApproved(e.doctype)" class="muted tiny">approve the DocType to add fields</span>
        </div>
      </div>
    </section>

    <section>
      <div class="section-head">
        <h3>Relationships</h3>
        <button @click="newRelationship" :disabled="dm().entities.length < 1">+ Relationship</button>
      </div>
      <p class="muted" v-if="dm().relationships.length === 0">
        No relationships. Link and child-table relationships connect two entities by their ids.
      </p>
      <div class="card-row" v-for="r in dm().relationships" :key="r.id">
        <code class="pill">{{ r.id }}</code>
        <label>source</label>
        <select v-model="r.source">
          <option v-for="e in dm().entities" :key="e.id" :value="e.id">{{ e.id }}</option>
        </select>
        <label>target</label>
        <select v-model="r.target">
          <option v-for="e in dm().entities" :key="e.id" :value="e.id">{{ e.id }}</option>
        </select>
        <label>type</label>
        <select v-model="r.type">
          <option v-for="t in REL_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
        <span class="spacer"></span>
        <button class="danger" @click="removeRelationship(store.def, r.id)">Delete</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dm { display: flex; flex-direction: column; gap: 24px; }
.reg-warn { background: #fdeaed; color: var(--err); border: 1px solid #f4b8c1; border-radius: 8px; padding: 8px 12px; margin: 0; }
.section-head { display: flex; align-items: center; gap: 10px; }
.section-head h3 { margin: 0; }
.card { border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin: 10px 0; background: var(--panel); }
.card-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 6px 0; }
.card-row label, .fields label { color: var(--muted); font-size: 12px; }
.pill { background: var(--chip); padding: 2px 8px; border-radius: 12px; }
.flag { color: var(--err); font-size: 11px; font-weight: 600; }
.spacer { flex: 1; }
.fields { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.field-chip { display: inline-flex; align-items: center; gap: 4px; background: var(--chip); border-radius: 12px; padding: 2px 4px 2px 10px; }
.field-chip.bad { background: #fdeaed; color: var(--err); }
.bad { border-color: var(--err); }
input.bad { box-shadow: 0 0 0 2px rgba(209, 52, 75, 0.15); }
.chip-x { border: none; background: transparent; color: inherit; padding: 0 4px; cursor: pointer; }
.addfield { font-size: 12px; }
.tiny { font-size: 11px; }
button.danger:hover { border-color: var(--err); color: var(--err); }
</style>
