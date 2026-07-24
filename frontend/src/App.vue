<script setup>
import { ref, computed } from 'vue'
import { store, issues } from './store.js'
import qaExample from '../../examples/qa_lifecycle_manager.json'
import JsonView from './components/JsonView.vue'
import IssuePanel from './components/IssuePanel.vue'
import DataModelEditor from './components/DataModelEditor.vue'
import PageCanvas from './components/PageCanvas.vue'
import WorkflowEditor from './components/WorkflowEditor.vue'
import AutomationEditor from './components/AutomationEditor.vue'
import MetaEditor from './components/MetaEditor.vue'
import ApplicationEditor from './components/ApplicationEditor.vue'
import { publicationStore } from './lib/publicationStore.js'
import { approvedRegistry, registryIssues } from './lib/approvedRegistry.js'

// Editors are registered here; each later step adds one. Keeping them in a
// single list keeps App.vue a thin shell around the shared store.
const tabs = [
  { id: 'application', label: 'Application', comp: ApplicationEditor },
  { id: 'data_model', label: 'Data Model', comp: DataModelEditor },
  { id: 'pages', label: 'Pages', comp: PageCanvas },
  { id: 'workflow', label: 'Workflow', comp: WorkflowEditor },
  { id: 'automations', label: 'Automations', comp: AutomationEditor },
  { id: 'meta', label: 'Permissions & Meta', comp: MetaEditor },
  { id: 'issues', label: 'Issues', comp: IssuePanel },
  { id: 'json', label: 'Definition JSON', comp: JsonView },
]
const active = ref('application')
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

// Publish is gated on validity: a published version must be schema-valid AND
// only reference approved DocTypes/fields (D-004). Publishing creates a new
// immutable version in the publication store, which the Runtime reads from.
const registryProblems = computed(() => registryIssues(store.def, approvedRegistry))
const publishMsg = ref('')
function publish() {
  if (issues.value.length || registryProblems.value.length) {
    publishMsg.value = `Cannot publish: ${issues.value.length} schema issue(s), ${registryProblems.value.length} registry issue(s).`
    return
  }
  const res = publicationStore.publish(store.def)
  publishMsg.value = `Published ${res.appCode} v${res.version} (checksum ${res.checksum}).`
}
</script>

<template>
  <div class="topbar">
    <strong>Visual App Builder — Studio</strong>
    <button @click="loadExample" data-testid="load-example">Load QA example</button>
    <label class="filebtn">
      <button type="button" onclick="this.nextElementSibling.click()">Load file…</button>
      <input type="file" accept="application/json" style="display: none" @change="loadFile" />
    </label>
    <button class="primary" @click="exportDef" :title="issues.length ? 'Exports, but the definition still has validation issues' : 'Export a schema-valid definition'">
      Save / Export
    </button>
    <button
      class="primary"
      @click="publish"
      data-testid="publish"
      :title="issues.length || registryProblems.length ? 'Fix validation and registry issues before publishing' : 'Publish an immutable version to the Runtime'"
    >
      Publish
    </button>
    <span v-if="publishMsg" class="publish-msg" data-testid="publish-msg">{{ publishMsg }}</span>
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
      :data-testid="`tab-${t.id}`"
      @click="active = t.id"
    >
      {{ t.label }}
    </div>
  </div>

  <div class="body">
    <component :is="activeComp" />
  </div>
</template>
