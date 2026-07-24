<script setup>
// Renders one bound field by its inferred widget type. text / select / date /
// attachment are fully handled; link falls back to text unless target options
// are supplied (no example exercises links yet). child-table is handled at the
// form level, not here.
import { computed } from 'vue'
import { inferFieldType } from '../engine/resolve.js'

const props = defineProps({
  def: { type: Object, required: true },
  entityId: { type: String, required: true },
  field: { type: String, required: true },
  modelValue: { default: '' },
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const spec = computed(() => inferFieldType(props.def, props.entityId, props.field))
const val = computed({
  get: () => props.modelValue ?? '',
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <select v-if="spec.widget === 'select'" v-model="val" :disabled="readonly" :data-testid="`field-${field}`">
    <option value="">—</option>
    <option v-for="o in spec.options" :key="o.value" :value="o.value">{{ o.label }}</option>
  </select>
  <input v-else-if="spec.widget === 'date'" type="date" v-model="val" :disabled="readonly" :data-testid="`field-${field}`" />
  <span v-else-if="spec.widget === 'attachment'" class="attach" :data-testid="`field-${field}`">
    📎 {{ val || '(no file)' }}
  </span>
  <input v-else v-model="val" :disabled="readonly" :data-testid="`field-${field}`" />
</template>

<style scoped>
.attach { font-size: 13px; color: #444; }
input, select { padding: 5px 8px; border: 1px solid #d9dee3; border-radius: 6px; width: 100%; }
</style>
