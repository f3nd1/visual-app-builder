<script setup>
// Dev harness for the Runtime. Step 2: pick a definition (three examples or a
// Studio export), browse its pages, open a record. Role switching (step 3) and
// workflow/automation execution (step 4) are added in later steps.
import { ref, computed, watch } from 'vue'
import { MockDataAdapter } from './adapters/MockDataAdapter.js'
import { MockPermissionAdapter } from './adapters/MockPermissionAdapter.js'
import { createRuntimeContext } from './context.js'
import { runAutomations } from './engine/automation.js'
import { SYNTHETIC_NOTICE } from './fixtures/synthetic.js'
import { MOCK_USERS } from './fixtures/users.js'
import { publicationStore } from '../lib/publicationStore.js'
import RuntimePage from './components/RuntimePage.vue'
import qa from '../../../examples/qa_lifecycle_manager.json'
import dcm from '../../../examples/document_control_manager.json'
import mvm from '../../../examples/material_vetting_manager.json'

// The Runtime only ever runs PUBLISHED versions. So the harness can be used
// standalone, seed the three examples as published v1 the first time it opens
// (a real deployment would already have published apps). Anything the Studio
// publishes afterwards appears here automatically via the shared store.
if (publicationStore.listApplications().length === 0) {
  for (const ex of [qa, dcm, mvm]) publicationStore.publish(ex)
}

const apps = computed(() => publicationStore.listApplications())
const appCode = ref(apps.value[0]?.appCode || null)
const versionSel = ref(null) // null => active version

const def = ref(null)
const adapter = ref(null)
const ctx = ref(null)
const pageIdx = ref(0)
const recordName = ref(null)
const userName = ref(MOCK_USERS[0].name) // default: Administrator (System Manager)
const override = ref(null) // ad-hoc "Load export…" definition, bypasses the store

const currentUser = computed(() => MOCK_USERS.find((u) => u.name === userName.value) || null)
const versions = computed(() => (appCode.value ? publicationStore.listVersions(appCode.value) : []))

// Resolve the definition to run: an ad-hoc uploaded one, else the selected
// published version, else the active published version.
function resolveDef() {
  if (override.value) return override.value
  if (!appCode.value) return null
  const rec = versionSel.value
    ? publicationStore.getVersion(appCode.value, versionSel.value)
    : publicationStore.getActive(appCode.value)
  return rec?.definition || null
}

function rebuild() {
  def.value = resolveDef()
  if (!def.value) { adapter.value = null; ctx.value = null; return }
  const perms = new MockPermissionAdapter(def.value)
  adapter.value = new MockDataAdapter(def.value, { permissionAdapter: perms })
  ctx.value = createRuntimeContext(def.value, { adapter: adapter.value, user: currentUser.value })
  pageIdx.value = 0
  recordName.value = null
}
watch([appCode, versionSel, override], rebuild, { immediate: true })
// Switching role does not rebuild data (keeps edits); it just re-points the
// context user, and every renderer re-reads permissions because it watches ctx.user.
watch(currentUser, (u) => { if (ctx.value) ctx.value.user = u })

function pickApp(code) {
  override.value = null
  versionSel.value = null
  appCode.value = code
}
function pickVersion(v) {
  versionSel.value = v ? Number(v) : null
}
// Minimal structural gate for the dev-only override path. Published versions
// are fully validated at publish time; this upload is the one entry point that
// bypasses that, and renderers assume schema shape (e.g. page.components is an
// array). ponytail: structural check only, not ajv — full schema validation in
// the Runtime bundle would cost ~40kB gzip for a dev-only loader.
function sanityCheck(def) {
  if (!def || typeof def !== 'object') return 'not an object'
  if (!def.application?.code) return 'missing application.code'
  if (!Array.isArray(def.pages)) return 'pages must be an array'
  for (const p of def.pages) {
    if (!Array.isArray(p.components)) return `page "${p?.id}" has no components array`
  }
  if (!Array.isArray(def.data_model?.entities)) return 'data_model.entities must be an array'
  return null
}

function loadExport(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result)
      const problem = sanityCheck(parsed)
      if (problem) { alert('Rejected definition: ' + problem); return }
      override.value = parsed
    } catch (e) {
      alert('Not valid JSON: ' + e.message)
    }
  }
  reader.readAsText(file)
  ev.target.value = ''
}

const pages = computed(() => def.value?.pages || [])
const page = computed(() => pages.value[pageIdx.value] || null)

// Bumping this remounts RuntimePage so renderers re-read the (persisted) adapter
// data after a create/transition — WITHOUT rebuilding the adapter, which would
// discard those very changes.
const refreshKey = ref(0)
const autoLog = ref([])

// Opening a record from a list jumps to the first page that has a form, so the
// list -> detail flow works even though list and form live on separate pages.
function openRecord(name) {
  recordName.value = name
  const detailIdx = pages.value.findIndex((p) => p.components.some((c) => c.type === 'record_form'))
  if (detailIdx >= 0) pageIdx.value = detailIdx
}
function selectPage(i) { pageIdx.value = i; recordName.value = null }

async function onSaved({ entityId, record }) {
  recordName.value = record.name
  const log = await runAutomations(ctx.value, { type: 'record_created', entityId, record })
  if (log.length) autoLog.value = [`▶ record_created ${record.name}`, ...log, ...autoLog.value]
  refreshKey.value++
}
async function onChanged(event) {
  const log = await runAutomations(ctx.value, event)
  if (log.length) autoLog.value = [`▶ ${event.type} ${event.record?.name}`, ...log, ...autoLog.value]
  refreshKey.value++
}
</script>

<template>
  <div class="rt">
    <header class="rt-top">
      <strong>Runtime harness</strong>
      <span class="synthetic" :title="SYNTHETIC_NOTICE">⚠ {{ SYNTHETIC_NOTICE }}</span>
      <span class="spacer"></span>
      <label>Published app</label>
      <select :value="appCode" @change="pickApp($event.target.value)" data-testid="pick-definition">
        <option v-for="a in apps" :key="a.appCode" :value="a.appCode">{{ a.appCode }} (v{{ a.active }})</option>
      </select>
      <label>Version</label>
      <select :value="versionSel || ''" @change="pickVersion($event.target.value)" data-testid="pick-version" :disabled="!!override">
        <option value="">active (v{{ apps.find((a) => a.appCode === appCode)?.active }})</option>
        <option v-for="v in versions" :key="v.version" :value="v.version">
          v{{ v.version }}{{ v.active ? ' ●' : '' }} · {{ v.checksum }}
        </option>
      </select>
      <label>Role</label>
      <select v-model="userName" data-testid="pick-user">
        <option v-for="u in MOCK_USERS" :key="u.name" :value="u.name">
          {{ u.name }} [{{ u.roles.join(', ') || 'no roles' }}]
        </option>
      </select>
      <label class="filebtn">
        <button type="button" onclick="this.nextElementSibling.click()">Load export…</button>
        <input type="file" accept="application/json" style="display:none" data-testid="load-export-input" @change="loadExport" />
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
        :key="refreshKey"
        :page="page"
        :ctx="ctx"
        :record-name="recordName"
        @open="openRecord"
        @saved="onSaved"
        @changed="onChanged"
      />
      <p v-else class="muted">This definition has no pages.</p>

      <section v-if="autoLog.length" class="autolog" data-testid="autolog">
        <div class="al-head">
          <strong>Automation / action log</strong>
          <button @click="autoLog = []">clear</button>
        </div>
        <ul>
          <li v-for="(line, i) in autoLog" :key="i">{{ line }}</li>
        </ul>
      </section>
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
.autolog { margin-top: 20px; border: 1px solid #d9dee3; border-radius: 8px; background: #fff; padding: 10px 14px; }
.al-head { display: flex; justify-content: space-between; align-items: center; }
.autolog ul { margin: 8px 0 0; padding-left: 18px; font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
button, select { font: inherit; }
</style>
