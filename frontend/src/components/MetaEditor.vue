<script setup>
// Permissions, translations, notifications and test cases — the flat sections,
// each matching its schema shape. Grouped on one page with sub-navigation.
import { ref } from 'vue'
import { store } from '../store.js'
import {
  addPermission, removePermission,
  addTranslationKey, renameTranslationKey, removeTranslationKey, LANGS,
  addNotification, removeNotification,
  addTest, removeTest,
} from '../lib/sectionMutations.js'

const sub = ref('permissions')
const subs = [
  { id: 'permissions', label: 'Permissions' },
  { id: 'translations', label: 'Translations' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'tests', label: 'Test Cases' },
]
const def = () => store.def
const entities = () => store.def.data_model.entities
</script>

<template>
  <div>
    <div class="subnav">
      <button v-for="s in subs" :key="s.id" class="subtab" :class="{ active: sub === s.id }" @click="sub = s.id">
        {{ s.label }}
      </button>
    </div>

    <!-- PERMISSIONS -->
    <section v-if="sub === 'permissions'">
      <div class="section-head"><h3>Permissions</h3><button @click="addPermission(def(), entities()[0]?.id || '')">+ Permission</button></div>
      <p class="muted" v-if="def().permissions.length === 0">No permissions. Each row grants a role access to an entity.</p>
      <table v-else class="grid">
        <thead><tr><th>Role</th><th>Entity</th><th>Read</th><th>Write</th><th>Create</th><th>Submit</th><th></th></tr></thead>
        <tbody>
          <tr v-for="(p, i) in def().permissions" :key="i">
            <td><input v-model="p.role" /></td>
            <td>
              <select v-model="p.entity">
                <option v-for="e in entities()" :key="e.id" :value="e.id">{{ e.id }}</option>
              </select>
            </td>
            <td><input type="checkbox" v-model="p.read" /></td>
            <td><input type="checkbox" v-model="p.write" /></td>
            <td><input type="checkbox" v-model="p.create" /></td>
            <td><input type="checkbox" v-model="p.submit" /></td>
            <td><button class="chip-x" @click="removePermission(def(), i)">×</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- TRANSLATIONS -->
    <section v-if="sub === 'translations'">
      <div class="section-head"><h3>Translations</h3><button @click="addTranslationKey(def())">+ Key</button></div>
      <p class="muted" v-if="Object.keys(def().translations).length === 0">No translation keys.</p>
      <table v-else class="grid">
        <thead><tr><th>Key</th><th v-for="l in LANGS" :key="l">{{ l }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="(val, key) in def().translations" :key="key">
            <td><input :value="key" @change="renameTranslationKey(def(), key, $event.target.value)" /></td>
            <td v-for="l in LANGS" :key="l"><input v-model="def().translations[key][l]" /></td>
            <td><button class="chip-x" @click="removeTranslationKey(def(), key)">×</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- NOTIFICATIONS -->
    <section v-if="sub === 'notifications'">
      <div class="section-head"><h3>Notifications</h3><button @click="addNotification(def())">+ Notification</button></div>
      <p class="muted" v-if="def().notifications.length === 0">No notification templates.</p>
      <div class="card" v-for="n in def().notifications" :key="n.id">
        <div class="card-row">
          <code class="pill">{{ n.id }}</code>
          <label>channel</label>
          <select v-model="n.channel"><option value="email">email</option><option value="system">system</option></select>
          <span class="spacer"></span>
          <button class="chip-x" @click="removeNotification(def(), n.id)">×</button>
        </div>
        <div class="card-row"><label>subject</label><input v-model="n.subject" class="wide" /></div>
        <div class="card-row"><label>body</label><textarea v-model="n.body" rows="2" class="wide"></textarea></div>
      </div>
    </section>

    <!-- TESTS -->
    <section v-if="sub === 'tests'">
      <div class="section-head"><h3>Test Cases</h3><button @click="addTest(def())">+ Test</button></div>
      <p class="muted" v-if="def().tests.length === 0">No test cases.</p>
      <div class="card" v-for="t in def().tests" :key="t.id">
        <div class="card-row"><code class="pill">{{ t.id }}</code><span class="spacer"></span><button class="chip-x" @click="removeTest(def(), t.id)">×</button></div>
        <div class="card-row"><label>title</label><input v-model="t.title" class="wide" /></div>
        <div class="card-row"><label>expected</label><input v-model="t.expected" class="wide" /></div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.subnav { display: flex; gap: 4px; margin-bottom: 14px; }
.subtab { color: var(--muted); }
.subtab.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.section-head { display: flex; align-items: center; gap: 10px; }
.section-head h3 { margin: 0 0 8px; }
.grid { border-collapse: collapse; width: 100%; background: var(--panel); }
.grid th, .grid td { border: 1px solid var(--border); padding: 5px 8px; text-align: left; }
.grid th { background: var(--chip); font-size: 12px; }
.grid input:not([type=checkbox]), .grid select { width: 100%; border: none; background: transparent; }
.card { border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin: 10px 0; background: var(--panel); }
.card-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; }
.card-row label { color: var(--muted); font-size: 12px; min-width: 56px; }
.wide { flex: 1; }
.pill { background: var(--chip); padding: 2px 8px; border-radius: 12px; }
.spacer { flex: 1; }
.chip-x { border: none; background: transparent; color: var(--muted); font-size: 16px; cursor: pointer; }
</style>
