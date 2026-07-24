<script setup>
// Dev harness for the Runtime. Step 2: pick a definition (three examples or a
// Studio export), browse its pages, open a record. Role switching (step 3) and
// workflow/automation execution (step 4) are added in later steps.
import { ref, computed, watch } from 'vue'
import { MockDataAdapter } from './adapters/MockDataAdapter.js'
import { createRuntimeContext } from './context.js'
import { SYNTHETIC_NOTICE } from './fixtures/synthetic.js'
import RuntimePage from './components/RuntimePage.vue'
import qa from '../../../examples/qa_lifecycle_manager.json'
import dcm from '../../../examples/document_control_manager.json'
import mvm from '../../../examples/material_vetting_manager.json'

const EXAMPLES = {
  qa_lifecycle_manager: qa,
  document_control_manager: dcm,
  material_vetting_manager: mvm,
}

const def = ref(structuredClone(qa))
const adapter = ref(null)
const ctx = ref(null)
const pageIdx = ref(0)
const recordName = ref(null)

function rebuild() {
  adapter.value = new MockDataAdapter(def.value)
  ctx.value = createRuntimeContext(def.value, { adapter: adapter.value, user: null })
  pageIdx.value = 0
  recordName.value = null
}
watch(def, rebuild, { immediate: true })

function pickExample(code) {
  def.value = structuredClone(EXAMPLES[code])
}
function loadExport(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try { def.value = JSON.parse(reader.result) } catch (e) { alert('Not valid JSON: ' + e.message) }
  }
  reader.readAsText(file)
  ev.target.value = ''
}

const pages = computed(() => def.value.pages || [])
const page = computed(() => pages.value[pageIdx.value] || null)

function openRecord(name) { recordName.value = name }
function selectPage(i) { pageIdx.value = i; recordName.value = null }
</script>

<template>
  <div class="rt">
    <header class="rt-top">
      <strong>Runtime harness</strong>
      <span class="synthetic" :title="SYNTHETIC_NOTICE">⚠ {{ SYNTHETIC_NOTICE }}</span>
      <span class="spacer"></span>
      <label>Definition</label>
      <select :value="def.application.code" @change="pickExample($event.target.value)" data-testid="pick-definition">
        <option v-for="(_d, code) in EXAMPLES" :key="code" :value="code">{{ code }}</option>
      </select>
      <label class="filebtn">
        <button type="button" onclick="this.nextElementSibling.click()">Load export…</button>
        <input type="file" accept="application/json" style="display:none" @change="loadExport" />
      </label>
    </header>

    <nav class="rt-tabs">
      <button
        v-for="(p, i) in pages"
        :key="p.id"
        class="rt-tab"
        :class="{ active: i === pageIdx }"
        :data-testid="`page-tab-${p.id}`"
        @click="selectPage(i)"
      >{{ p.title }}</button>
    </nav>

    <main class="rt-body">
      <button v-if="recordName" class="back" @click="recordName = null" data-testid="back">← back to list</button>
      <RuntimePage
        v-if="page && ctx"
        :page="page"
        :ctx="ctx"
        :record-name="recordName"
        @open="openRecord"
        @saved="rebuild"
      />
      <p v-else class="muted">This definition has no pages.</p>
    </main>
  </div>
</template>

<style scoped>
.rt-top { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #fff; border-bottom: 1px solid #d9dee3; }
.synthetic { color: #b9770a; font-size: 12px; }
.spacer { flex: 1; }
.rt-top label { color: #6b7680; font-size: 12px; }
.rt-tabs { display: flex; gap: 4px; padding: 8px 16px 0; background: #fff; border-bottom: 1px solid #d9dee3; flex-wrap: wrap; }
.rt-tab { border: 1px solid transparent; border-bottom: none; border-radius: 6px 6px 0 0; padding: 6px 12px; background: transparent; color: #6b7680; cursor: pointer; }
.rt-tab.active { background: #f6f7f9; border-color: #d9dee3; color: #1f272e; font-weight: 600; }
.rt-body { padding: 16px; }
.back { margin-bottom: 12px; border: 1px solid #d9dee3; border-radius: 6px; padding: 4px 10px; background: #fff; cursor: pointer; }
.muted { color: #6b7680; }
button, select { font: inherit; }
</style>
