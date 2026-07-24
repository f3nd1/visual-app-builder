<script setup>
import { ref, computed } from 'vue'
import { store, issues } from './store.js'
import qaExample from '../../examples/qa_lifecycle_manager.json'
import JsonView from './components/JsonView.vue'
import IssuePanel from './components/IssuePanel.vue'
import DataModelEditor from './components/DataModelEditor.vue'
import PageCanvas from './components/PageCanvas.vue'

// Editors are registered here; each later step adds one. Keeping them in a
// single list keeps App.vue a thin shell around the shared store.
const tabs = [
  { id: 'data_model', label: 'Data Model', comp: DataModelEditor },
  { id: 'pages', label: 'Pages', comp: PageCanvas },
  { id: 'issues', label: 'Issues', comp: IssuePanel },
  { id: 'json', label: 'Definition JSON', comp: JsonView },
]
const active = ref('pages')
const activeComp = computed(() => tabs.find((t) => t.id === active.value)?.comp)

function loadExample() {
  // structuredClone so edits don't mutate the imported module object.
  store.load(structuredClone(qaExample))
}

function loadFile(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      store.load(JSON.parse(reader.result))
    } catch (e) {
      alert('Not valid JSON: ' + e.message)
    }
  }
  reader.readAsText(file)
  ev.target.value = ''
}

function exportDef() {
  const blob = new Blob([store.export()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (store.def.application?.code || 'application') + '.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="topbar">
    <strong>Visual App Builder — Studio</strong>
    <button @click="loadExample">Load QA example</button>
    <label class="filebtn">
      <button type="button" onclick="this.nextElementSibling.click()">Load file…</button>
      <input type="file" accept="application/json" style="display: none" @change="loadFile" />
    </label>
    <button class="primary" @click="exportDef">Export</button>
    <span class="spacer"></span>
    <span
      class="issue-chip"
      :class="issues.length ? 'err' : 'ok'"
      @click="active = 'issues'"
      style="cursor: pointer"
      :title="issues.length ? 'Click to see issues' : 'Definition is valid'"
    >
      {{ issues.length ? `${issues.length} issue${issues.length > 1 ? 's' : ''}` : 'Valid' }}
    </span>
  </div>

  <div class="tabs">
    <div
      v-for="t in tabs"
      :key="t.id"
      class="tab"
      :class="{ active: active === t.id }"
      @click="active = t.id"
    >
      {{ t.label }}
    </div>
  </div>

  <div class="body">
    <component :is="activeComp" />
  </div>
</template>
