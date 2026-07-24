<script setup>
// Shows a record's current workflow state and the transitions available from
// it. In step 2 this is display-only; step 4 wires the buttons to actual
// transition execution against the mock data.
import { ref, watch, computed } from 'vue'
import { resolveEntity, availableTransitions } from '../engine/resolve.js'

const props = defineProps({
  component: { type: Object, required: true },
  ctx: { type: Object, required: true },
  recordName: { type: String, default: null },
})
const emit = defineEmits(['transition'])

const entity = computed(() => resolveEntity(props.ctx.def, props.component))
const record = ref(null)

async function load() {
  record.value = props.recordName && entity.value
    ? await props.ctx.adapter.getRecord(entity.value.id, props.recordName)
    : null
}
watch(() => [props.recordName, entity.value?.id], load, { immediate: true, deep: true })

const currentState = computed(() => {
  const id = record.value?.status
  return (props.ctx.def.workflow?.states || []).find((s) => s.id === id) || null
})
const roles = computed(() => props.ctx.user?.roles || null)
const transitions = computed(() =>
  currentState.value ? availableTransitions(props.ctx.def, currentState.value.id, null) : [],
)
function roleAllows(t) {
  return !roles.value || roles.value.includes(t.role)
}
</script>

<template>
  <div class="wfh" :data-testid="`wfh-${component.id}`">
    <div class="mhead"><strong>{{ component.title || 'Workflow' }}</strong></div>
    <p v-if="!record" class="muted">Select a record to see its workflow.</p>
    <template v-else>
      <div>Current state: <strong data-testid="wfh-state">{{ currentState?.label || record.status || '—' }}</strong></div>
      <div class="trans">
        <button
          v-for="t in transitions"
          :key="t.id"
          :disabled="!roleAllows(t)"
          :title="roleAllows(t) ? '' : `Requires role: ${t.role}`"
          :data-testid="`transition-${t.id}`"
          @click="emit('transition', { transition: t, record })"
        >
          {{ t.action }} <span class="role">({{ t.role }})</span>
        </button>
        <span v-if="transitions.length === 0" class="muted">No onward transitions.</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mhead { margin-bottom: 8px; }
.muted { color: #6b7680; }
.trans { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
button { border: 1px solid #d9dee3; border-radius: 6px; padding: 5px 10px; cursor: pointer; background: #fff; }
button:disabled { opacity: .5; cursor: not-allowed; }
.role { color: #6b7680; font-size: 12px; }
</style>
