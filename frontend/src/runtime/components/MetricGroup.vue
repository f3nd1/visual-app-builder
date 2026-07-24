<script setup>
// Dashboard metric_group: total records for the bound entity plus a status
// breakdown when the entity has a status field. Definition-driven.
import { ref, watch, computed } from 'vue'
import { resolveEntity, computeMetrics } from '../engine/resolve.js'

const props = defineProps({
  component: { type: Object, required: true },
  ctx: { type: Object, required: true },
})
const entity = computed(() => resolveEntity(props.ctx.def, props.component))
const metrics = ref([])

async function load() {
  if (!entity.value) { metrics.value = []; return }
  if (!(await props.ctx.can(entity.value.id, 'read'))) { metrics.value = []; return }
  const rows = await props.ctx.adapter.listRecords(entity.value.id)
  metrics.value = computeMetrics(rows, entity.value)
}
watch(() => [props.ctx.user, entity.value?.id], load, { immediate: true, deep: true })
</script>

<template>
  <div class="metrics" :data-testid="`metrics-${component.id}`">
    <div class="mhead"><strong>{{ component.title || 'Summary' }}</strong> <span class="muted">{{ entity?.doctype }}</span></div>
    <div class="cards">
      <div v-for="m in metrics" :key="m.label" class="card">
        <div class="val">{{ m.value }}</div>
        <div class="lbl">{{ m.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mhead { margin-bottom: 8px; }
.muted { color: #6b7680; }
.cards { display: flex; gap: 10px; flex-wrap: wrap; }
.card { border: 1px solid #e3e8ec; border-radius: 8px; padding: 10px 16px; background: #fff; min-width: 90px; }
.val { font-size: 22px; font-weight: 700; }
.lbl { color: #6b7680; font-size: 12px; }
</style>
