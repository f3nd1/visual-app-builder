<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { store } from '../store.js'
import { COMPONENT_TYPES, paletteByCategory } from '../lib/componentRegistry.js'
import {
  addPage, removePage, addComponent, addFieldComponent,
  duplicateComponent, removeComponent, moveComponent, PAGE_TYPES,
} from '../lib/pageMutations.js'
import ContextMenu from './ContextMenu.vue'

const palette = paletteByCategory()
const pageIdx = ref(0)
const selectedId = ref(null)
const dropIndex = ref(null) // where a live drop would land; drives the placeholder
const menu = ref({ open: false, x: 0, y: 0, items: [] })

const pages = computed(() => store.def.pages)
const page = computed(() => pages.value[pageIdx.value] || null)
const entities = computed(() => store.def.data_model.entities)
const selected = computed(() => page.value?.components.find((c) => c.id === selectedId.value) || null)

function selectPage(i) { pageIdx.value = i; selectedId.value = null }
function newPage() {
  addPage(store.def)
  pageIdx.value = pages.value.length - 1
}

// --- drag sources ---
function dragPalette(ev, type) {
  ev.dataTransfer.setData('application/json', JSON.stringify({ kind: 'palette', type }))
  ev.dataTransfer.effectAllowed = 'copy'
}
function dragField(ev, entityId, field) {
  ev.dataTransfer.setData('application/json', JSON.stringify({ kind: 'field', entity: entityId, field }))
  ev.dataTransfer.effectAllowed = 'copy'
}

// --- drop target: compute placeholder index from pointer position ---
const cardEls = ref([])
function onCanvasDragOver(ev) {
  ev.preventDefault()
  ev.dataTransfer.dropEffect = 'copy'
  const cards = cardEls.value.filter(Boolean)
  let idx = cards.length
  for (let i = 0; i < cards.length; i++) {
    const r = cards[i].getBoundingClientRect()
    if (ev.clientY < r.top + r.height / 2) { idx = i; break }
  }
  dropIndex.value = idx
}
function onCanvasLeave() { dropIndex.value = null }
function onDrop(ev) {
  ev.preventDefault()
  if (!page.value) return
  let payload
  try { payload = JSON.parse(ev.dataTransfer.getData('application/json')) } catch { return }
  const at = dropIndex.value
  let newId
  if (payload.kind === 'palette') {
    newId = addComponent(store.def, page.value, payload.type, {}, at)
  } else if (payload.kind === 'field') {
    newId = addFieldComponent(store.def, page.value, payload.entity, payload.field, at)
  }
  dropIndex.value = null
  if (newId) selectedId.value = newId
}

// --- context menu (shared by right-click and the kebab button) ---
function itemsFor(comp) {
  return [
    { label: 'Edit', shortcut: '↵', action: () => (selectedId.value = comp.id) },
    { label: 'Duplicate', shortcut: '⌘D', action: () => (selectedId.value = duplicateComponent(store.def, page.value, comp.id)) },
    { label: 'Bind data', action: () => { selectedId.value = comp.id; focusBind.value = true } },
    { label: 'Add visibility condition', action: () => { comp.visible_if = comp.visible_if || ''; selectedId.value = comp.id } },
    { label: 'Move up', action: () => moveComponent(page.value, comp.id, -1) },
    { label: 'Move down', action: () => moveComponent(page.value, comp.id, +1) },
    { label: 'Delete', shortcut: '⌫', danger: true, action: () => { removeComponent(page.value, comp.id); if (selectedId.value === comp.id) selectedId.value = null } },
  ]
}
function openMenu(ev, comp) {
  selectedId.value = comp.id
  menu.value = { open: true, x: ev.clientX, y: ev.clientY, items: itemsFor(comp) }
}
const focusBind = ref(false)

// --- keyboard accelerators ---
function onKey(e) {
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  if (!selected.value) return
  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault()
    removeComponent(page.value, selected.value.id)
    selectedId.value = null
  } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
    e.preventDefault()
    selectedId.value = duplicateComponent(store.def, page.value, selected.value.id)
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

function reg(type) { return COMPONENT_TYPES[type] || { label: type, icon: '?', props: [] } }
function fieldsOf(entityId) { return entities.value.find((e) => e.id === entityId)?.fields || [] }
function summary(c) {
  return c.title || c.label || c.field || ''
}
</script>

<template>
  <div class="pc">
    <!-- LEFT: palette + data-model fields -->
    <aside class="palette">
      <div v-for="(items, cat) in palette" :key="cat" class="pal-group">
        <div class="pal-cat">{{ cat }}</div>
        <div
          v-for="it in items"
          :key="it.type"
          class="pal-item"
          draggable="true"
          @dragstart="dragPalette($event, it.type)"
          :title="it.type"
          :data-testid="`pal-${it.type}`"
        >
          <span class="ic">{{ it.icon }}</span>{{ it.label }}
        </div>
      </div>

      <div class="pal-group">
        <div class="pal-cat">Data Model fields</div>
        <p class="muted tiny" v-if="entities.length === 0">Define entities in the Data Model tab first.</p>
        <template v-for="e in entities" :key="e.id">
          <div class="ent-name">{{ e.id }}</div>
          <div
            v-for="f in e.fields"
            :key="e.id + '.' + f"
            class="pal-item field"
            draggable="true"
            @dragstart="dragField($event, e.id, f)"
            title="Drag onto the canvas to create a bound field"
            :data-testid="`field-${e.id}-${f}`"
          >
            <span class="ic">·</span>{{ f }}
          </div>
        </template>
      </div>
    </aside>

    <!-- CENTER: page tabs + canvas -->
    <main class="canvas-wrap">
      <div class="page-tabs">
        <button
          v-for="(p, i) in pages"
          :key="p.id"
          class="ptab"
          :class="{ active: i === pageIdx }"
          @click="selectPage(i)"
        >{{ p.title }} <span class="muted tiny">({{ p.type }})</span></button>
        <button class="ptab add" @click="newPage">+ Page</button>
      </div>

      <div v-if="page" class="page-settings">
        <label>Page title</label>
        <input v-model="page.title" />
        <label>type</label>
        <select v-model="page.type">
          <option v-for="t in PAGE_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
        <code class="pill">{{ page.id }}</code>
        <span class="spacer"></span>
        <button class="danger" @click="removePage(store.def, page.id); pageIdx = 0">Delete page</button>
      </div>

      <div
        v-if="page"
        class="canvas"
        data-testid="page-canvas"
        @dragover="onCanvasDragOver"
        @dragleave="onCanvasLeave"
        @drop="onDrop"
      >
        <p v-if="page.components.length === 0 && dropIndex === null" class="muted drop-hint">
          Drag components from the palette, or fields from the Data Model, onto this canvas.
        </p>
        <template v-for="(c, i) in page.components" :key="c.id">
          <div v-if="dropIndex === i" class="placeholder"></div>
          <div
            class="comp"
            :class="{ sel: c.id === selectedId }"
            :ref="(el) => (cardEls[i] = el)"
            :data-testid="`comp-${c.id}`"
            @click="selectedId = c.id"
            @contextmenu.prevent="openMenu($event, c)"
          >
            <span class="ic">{{ reg(c.type).icon }}</span>
            <div class="comp-main">
              <div class="comp-type">{{ reg(c.type).label }}</div>
              <div class="comp-sum muted">{{ summary(c) }}</div>
            </div>
            <code class="pill tiny">{{ c.id }}</code>
            <button class="kebab" :data-testid="`kebab-${c.id}`" @click.stop="openMenu($event, c)" title="Component menu">⋯</button>
          </div>
        </template>
        <div v-if="dropIndex === page.components.length" class="placeholder"></div>
      </div>
      <p v-else class="muted" style="padding: 16px">No pages yet — add one to begin.</p>
    </main>

    <!-- RIGHT: data-driven inspector -->
    <aside class="inspector">
      <h4>Inspector</h4>
      <p v-if="!selected" class="muted tiny">Select a component to edit its properties.</p>
      <template v-else>
        <div class="insp-row"><label>type</label><code class="pill">{{ selected.type }}</code></div>
        <div class="insp-row"><label>id</label><code class="pill">{{ selected.id }}</code></div>
        <div v-for="p in reg(selected.type).props" :key="p.key" class="insp-row">
          <label>{{ p.label }}</label>
          <input v-if="p.kind === 'text'" v-model="selected[p.key]" />
          <input v-else-if="p.kind === 'bool'" type="checkbox" v-model="selected[p.key]" />
          <select v-else-if="p.kind === 'entity'" v-model="selected[p.key]" :autofocus="focusBind">
            <option :value="undefined">—</option>
            <option v-for="e in entities" :key="e.id" :value="e.id">{{ e.id }}</option>
          </select>
          <select v-else-if="p.kind === 'field'" v-model="selected[p.key]">
            <option :value="undefined">—</option>
            <option v-for="f in fieldsOf(selected.entity)" :key="f" :value="f">{{ f }}</option>
          </select>
          <input v-else v-model="selected[p.key]" />
        </div>
        <div v-if="'visible_if' in selected" class="insp-row">
          <label>visible_if</label>
          <input v-model="selected.visible_if" placeholder="e.g. status == 'open'" />
        </div>
      </template>
    </aside>

    <ContextMenu :menu="menu" />
  </div>
</template>

<style scoped>
.pc { display: grid; grid-template-columns: 210px 1fr 260px; gap: 12px; align-items: start; }
.palette, .inspector { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 10px; position: sticky; top: 96px; }
.pal-group { margin-bottom: 14px; }
.pal-cat { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin: 6px 0; }
.pal-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; margin: 4px 0; cursor: grab; background: var(--panel); }
.pal-item:hover { border-color: var(--accent); }
.pal-item.field { padding: 3px 8px; font-size: 13px; }
.ent-name { font-size: 12px; font-weight: 600; margin-top: 6px; }
.ic { display: inline-block; width: 18px; text-align: center; color: var(--muted); }
.page-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
.ptab { background: var(--panel); }
.ptab.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.page-settings { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.page-settings label { color: var(--muted); font-size: 12px; }
.canvas { min-height: 320px; background: var(--panel); border: 1px dashed var(--border); border-radius: 8px; padding: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-content: start; }
.drop-hint { grid-column: 1 / -1; text-align: center; padding: 40px 0; }
.comp { grid-column: span 2; display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 8px; padding: 10px; background: var(--bg); cursor: pointer; }
.comp.sel { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(44,123,229,.18); }
.comp-main { flex: 1; }
.comp-type { font-weight: 600; }
.comp-sum { font-size: 12px; }
.kebab { border: none; background: transparent; font-size: 18px; line-height: 1; padding: 2px 6px; }
.placeholder { grid-column: 1 / -1; height: 6px; border-radius: 3px; background: var(--accent); opacity: .5; }
.pill { background: var(--chip); padding: 2px 8px; border-radius: 12px; }
.tiny { font-size: 11px; }
.spacer { flex: 1; }
.insp-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 8px 0; }
.insp-row label { color: var(--muted); font-size: 12px; }
.insp-row input[type=text], .insp-row input:not([type]), .insp-row select { flex: 1; min-width: 0; }
h4 { margin: 4px 0 10px; }
button.danger:hover { border-color: var(--err); color: var(--err); }
</style>
