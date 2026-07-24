<script setup>
// Form-based automation editor (NOT a node canvas). Trigger dropdown ->
// condition list -> action list, from the fixed MVP_SCOPE catalogue. Output is
// the schema's { id, trigger, conditions, actions } shape.
import { store } from '../store.js'
import { TRIGGERS, CONDITIONS, ACTIONS } from '../lib/automationCatalogue.js'
import {
  addAutomation, removeAutomation, setPartType,
  addCondition, removeCondition, addAction, removeAction,
} from '../lib/automationMutations.js'

const autos = () => store.def.automations
const paramsFor = (map, type) => map[type]?.params || []
</script>

<template>
  <div class="auto">
    <div class="section-head">
      <h3>Automations</h3>
      <button @click="addAutomation(store.def)">+ Automation</button>
    </div>
    <p class="muted" v-if="autos().length === 0">
      No automations. Each is a flat trigger → conditions → actions rule from the Phase-1 catalogue.
    </p>

    <div class="card" v-for="a in autos()" :key="a.id">
      <div class="card-head">
        <code class="pill">{{ a.id }}</code>
        <span class="spacer"></span>
        <button class="danger" @click="removeAutomation(store.def, a.id)">Delete</button>
      </div>

      <!-- WHEN -->
      <div class="block">
        <div class="block-label">WHEN</div>
        <select v-model="a.trigger.type" @change="setPartType(a.trigger, 'trigger')">
          <option v-for="(t, k) in TRIGGERS" :key="k" :value="k">{{ t.label }}</option>
        </select>
        <template v-for="p in paramsFor(TRIGGERS, a.trigger.type)" :key="p.key">
          <label>{{ p.label }}</label>
          <input v-model="a.trigger[p.key]" />
        </template>
      </div>

      <!-- IF -->
      <div class="block">
        <div class="block-label">IF <button class="mini" @click="addCondition(a)">+ condition</button></div>
        <p class="muted tiny" v-if="a.conditions.length === 0">No conditions — the rule always runs when triggered.</p>
        <div class="row" v-for="(c, i) in a.conditions" :key="i">
          <select v-model="c.type" @change="setPartType(c, 'condition')">
            <option v-for="(cd, k) in CONDITIONS" :key="k" :value="k">{{ cd.label }}</option>
          </select>
          <template v-for="p in paramsFor(CONDITIONS, c.type)" :key="p.key">
            <input v-model="c[p.key]" :placeholder="p.label" />
          </template>
          <button class="chip-x" @click="removeCondition(a, i)" title="Remove">×</button>
        </div>
      </div>

      <!-- THEN -->
      <div class="block">
        <div class="block-label">THEN <button class="mini" @click="addAction(a)">+ action</button></div>
        <div class="row" v-for="(ac, i) in a.actions" :key="i">
          <select v-model="ac.type" @change="setPartType(ac, 'action')">
            <option v-for="(ad, k) in ACTIONS" :key="k" :value="k">{{ ad.label }}</option>
          </select>
          <template v-for="p in paramsFor(ACTIONS, ac.type)" :key="p.key">
            <input v-model="ac[p.key]" :placeholder="p.label" />
          </template>
          <button class="chip-x" @click="removeAction(a, i)" title="Remove" :disabled="a.actions.length === 1">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-head { display: flex; align-items: center; gap: 10px; }
.section-head h3 { margin: 0; }
.card { border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin: 12px 0; background: var(--panel); }
.card-head { display: flex; align-items: center; margin-bottom: 8px; }
.pill { background: var(--chip); padding: 2px 8px; border-radius: 12px; }
.spacer { flex: 1; }
.block { border-left: 3px solid var(--border); padding: 6px 0 6px 12px; margin: 8px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.block-label { font-weight: 700; font-size: 12px; color: var(--muted); width: 100%; display: flex; align-items: center; gap: 8px; }
.row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%; }
.mini { font-size: 11px; padding: 2px 8px; }
.chip-x { border: none; background: transparent; color: var(--muted); font-size: 16px; cursor: pointer; }
.tiny { font-size: 11px; }
label { color: var(--muted); font-size: 12px; }
button.danger:hover { border-color: var(--err); color: var(--err); }
</style>
