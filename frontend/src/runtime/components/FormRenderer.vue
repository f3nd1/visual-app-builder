<script setup>
// Form renderer: reads a form component's bound entity, renders one field per
// entity field via FieldWidget, and creates/updates via the DataAdapter. Write
// and create are gated through ctx.can(). Child-table relationships (if any)
// render as read-only sub-tables. No app-specific knowledge.
import { ref, watch, computed } from 'vue'
import { resolveEntity, fieldsOf } from '../engine/resolve.js'
import FieldWidget from './FieldWidget.vue'

const props = defineProps({
  component: { type: Object, required: true },
  ctx: { type: Object, required: true },
  recordName: { type: String, default: null }, // null => create mode
})
const emit = defineEmits(['saved'])

const entity = computed(() => resolveEntity(props.ctx.def, props.component))
const fields = computed(() => fieldsOf(entity.value))
const childRels = computed(() =>
  (props.ctx.def.data_model?.relationships || []).filter((r) => r.type === 'child_table' && r.source === entity.value?.id),
)
const record = ref({})
const canWrite = ref(true)
const message = ref('')

async function load() {
  if (!entity.value) return
  const action = props.recordName ? 'write' : 'create'
  canWrite.value = await props.ctx.can(entity.value.id, action)
  record.value = props.recordName ? (await props.ctx.adapter.getRecord(entity.value.id, props.recordName)) || {} : {}
}
watch(() => [props.recordName, entity.value?.id, props.ctx.user], load, { immediate: true, deep: true })

async function save() {
  if (!canWrite.value) return
  if (props.recordName) {
    await props.ctx.adapter.updateRecord(entity.value.id, props.recordName, record.value)
    message.value = 'Updated.'
  } else {
    const created = await props.ctx.adapter.createRecord(entity.value.id, record.value)
    message.value = `Created ${created.name}.`
    emit('saved', { entityId: entity.value.id, record: created })
  }
}
async function childRows(rel) {
  return props.ctx.adapter.listRecords(rel.target)
}
</script>

<template>
  <div class="form" :data-testid="`form-${component.id}`">
    <div class="form-head">
      <strong>{{ component.title || entity?.doctype || 'Record' }}</strong>
      <span class="muted">{{ recordName || '(new)' }}</span>
    </div>
    <p v-if="!canWrite" class="denied" data-testid="write-denied">
      Read-only — you cannot {{ recordName ? 'edit' : 'create' }} {{ entity?.doctype }}.
    </p>
    <div class="fields">
      <div v-for="f in fields" :key="f" class="field-row">
        <label>{{ f }}</label>
        <FieldWidget :def="ctx.def" :entity-id="entity.id" :field="f" v-model="record[f]" :readonly="!canWrite" />
      </div>
    </div>

    <div v-for="rel in childRels" :key="rel.id" class="child">
      <div class="muted">child table → {{ rel.target }}</div>
    </div>

    <div class="actions">
      <button class="primary" :disabled="!canWrite" @click="save" data-testid="form-save">
        {{ recordName ? 'Save' : 'Create' }}
      </button>
      <span class="ok" v-if="message" data-testid="form-message">{{ message }}</span>
    </div>
  </div>
</template>

<style scoped>
.form-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
.muted { color: #6b7680; }
.denied { color: #d1344b; }
.fields { display: flex; flex-direction: column; gap: 10px; max-width: 560px; }
.field-row { display: grid; grid-template-columns: 140px 1fr; align-items: center; gap: 10px; }
.field-row label { color: #6b7680; font-size: 12px; }
.actions { margin-top: 14px; display: flex; align-items: center; gap: 10px; }
.ok { color: #1a883b; }
button { border: 1px solid #d9dee3; border-radius: 6px; padding: 6px 12px; cursor: pointer; }
button.primary { background: #2c7be5; color: #fff; border-color: #2c7be5; }
button:disabled { opacity: .5; cursor: not-allowed; }
</style>
