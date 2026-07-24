<script setup>
// List renderer: reads a list component's bound entity from the definition,
// lists records via the DataAdapter, renders a column per entity field. No
// app-specific knowledge. Read access is gated through ctx.can().
import { ref, watch, computed } from 'vue'
import { resolveEntity, fieldsOf } from '../engine/resolve.js'

const props = defineProps({
  component: { type: Object, required: true },
  ctx: { type: Object, required: true },
})
const emit = defineEmits(['open'])

const entity = computed(() => resolveEntity(props.ctx.def, props.component))
const columns = computed(() => fieldsOf(entity.value))
const rows = ref([])
const allowed = ref(true)
const loading = ref(true)

async function load() {
  loading.value = true
  if (!entity.value) { rows.value = []; loading.value = false; return }
  allowed.value = await props.ctx.can(entity.value.id, 'read')
  rows.value = allowed.value ? await props.ctx.adapter.listRecords(entity.value.id) : []
  loading.value = false
}
watch(() => [props.ctx.user, entity.value?.id, props.ctx.adapter], load, { immediate: true, deep: true })
defineExpose({ reload: load })
</script>

<template>
  <div class="list" :data-testid="`list-${component.id}`">
    <div class="list-head">
      <strong>{{ component.title || entity?.doctype || 'Records' }}</strong>
      <span class="muted">{{ entity?.doctype }}</span>
    </div>
    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="!allowed" class="denied" data-testid="read-denied">You do not have read access to {{ entity?.doctype }}.</p>
    <table v-else class="grid">
      <thead><tr><th v-for="c in columns" :key="c">{{ c }}</th></tr></thead>
      <tbody>
        <tr v-for="r in rows" :key="r.name" class="row" :data-testid="`row-${r.name}`" @click="emit('open', r.name)">
          <td v-for="c in columns" :key="c">{{ r[c] }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="!loading && allowed && rows.length === 0" class="muted">No records.</p>
  </div>
</template>

<style scoped>
.list-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; }
.muted { color: #6b7680; }
.denied { color: #d1344b; }
.grid { border-collapse: collapse; width: 100%; background: #fff; }
.grid th, .grid td { border: 1px solid #e3e8ec; padding: 6px 10px; text-align: left; font-size: 13px; }
.grid th { background: #f1f4f7; }
.row { cursor: pointer; }
.row:hover td { background: #f6faff; }
</style>
