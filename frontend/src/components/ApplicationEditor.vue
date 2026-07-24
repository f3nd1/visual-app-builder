<script setup>
// The application header: code, title, description, status, version. `code`
// must match the schema pattern ^[a-z][a-z0-9_]*$; the live issue counter
// reflects a bad value immediately.
import { store } from '../store.js'
import { ID_PATTERN } from '../lib/ids.js'
import { computed } from 'vue'

const app = () => store.def.application
const STATUSES = ['draft', 'technical_review', 'uat', 'approved', 'published', 'archived']
const codeOk = computed(() => ID_PATTERN.test(app().code || ''))
</script>

<template>
  <div class="app-editor">
    <div class="row"><label>Code</label>
      <input v-model="app().code" :class="{ bad: !codeOk }" data-testid="app-code" />
      <span class="muted tiny">lowercase, letters/digits/underscore, must start with a letter</span>
    </div>
    <div class="row"><label>Title</label><input v-model="app().title" class="wide" /></div>
    <div class="row"><label>Description</label><textarea v-model="app().description" rows="2" class="wide"></textarea></div>
    <div class="row"><label>Status</label>
      <select v-model="app().status"><option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option></select>
      <span class="muted tiny">Draft → Technical Review → UAT → Approved → Published → Archived; published versions are immutable</span>
    </div>
    <div class="row"><label>Version</label><input v-model="app().version" /></div>
  </div>
</template>

<style scoped>
.app-editor { max-width: 720px; display: flex; flex-direction: column; gap: 12px; }
.row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.row label { color: var(--muted); font-size: 12px; min-width: 84px; }
.wide { flex: 1; min-width: 260px; }
.bad { border-color: var(--err); box-shadow: 0 0 0 2px rgba(209,52,75,.15); }
.tiny { font-size: 11px; }
</style>
