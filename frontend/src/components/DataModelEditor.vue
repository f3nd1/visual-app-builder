<script setup>
import { store } from '../store.js'
import { addEntity, removeEntity, addRelationship, removeRelationship } from '../lib/mutations.js'

const dm = () => store.def.data_model
const REL_TYPES = ['link', 'child_table', 'dynamic_link', 'reference']

function addField(entity) {
  entity.fields.push('new_field')
}
function removeField(entity, i) {
  entity.fields.splice(i, 1)
}

function newRelationship() {
  const ents = dm().entities
  if (ents.length < 1) return
  addRelationship(store.def, ents[0].id, ents[ents.length - 1].id, 'link')
}
</script>

<template>
  <div class="dm">
    <section>
      <div class="section-head">
        <h3>Approved DocTypes</h3>
        <button @click="addEntity(store.def)">+ DocType</button>
      </div>
      <p class="muted" v-if="dm().entities.length === 0">
        No entities yet. Each entity maps a definition dataset to an ERPNext DocType and lists the fields the app may touch.
      </p>
      <div class="card" v-for="e in dm().entities" :key="e.id">
        <div class="card-row">
          <label>DocType</label>
          <input v-model="e.doctype" />
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
          <span class="field-chip" v-for="(f, i) in e.fields" :key="i">
            <input v-model="e.fields[i]" class="field-input" />
            <button class="chip-x" @click="removeField(e, i)" title="Remove field">×</button>
          </span>
          <button class="addfield" @click="addField(e)">+ field</button>
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
.section-head { display: flex; align-items: center; gap: 10px; }
.section-head h3 { margin: 0; }
.card { border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin: 10px 0; background: var(--panel); }
.card-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 6px 0; }
.card-row label, .fields label { color: var(--muted); font-size: 12px; }
.pill { background: var(--chip); padding: 2px 8px; border-radius: 12px; }
.spacer { flex: 1; }
.fields { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.field-chip { display: inline-flex; align-items: center; background: var(--chip); border-radius: 12px; padding: 1px 4px 1px 8px; }
.field-input { border: none; background: transparent; width: 110px; padding: 3px 2px; }
.chip-x { border: none; background: transparent; color: var(--muted); padding: 0 4px; cursor: pointer; }
.addfield { font-size: 12px; }
button.danger:hover { border-color: var(--err); color: var(--err); }
</style>
