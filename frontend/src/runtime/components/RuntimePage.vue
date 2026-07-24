<script setup>
// Renders one page by dispatching each of its components to the right renderer,
// purely from component.type. Unknown types render a labelled placeholder
// rather than failing, so a page never breaks on an unrecognised component.
import ListRenderer from './ListRenderer.vue'
import FormRenderer from './FormRenderer.vue'
import MetricGroup from './MetricGroup.vue'
import WorkflowHistory from './WorkflowHistory.vue'

defineProps({
  page: { type: Object, required: true },
  ctx: { type: Object, required: true },
  recordName: { type: String, default: null },
})
const emit = defineEmits(['open', 'saved', 'transition'])

// which renderer handles a component type
function rendererFor(type) {
  if (type === 'record_form') return 'form'
  if (type === 'metric_group') return 'metric'
  if (type === 'workflow_history') return 'workflow'
  if (type === 'record_list' || type === 'checklist' || type.endsWith('_list')) return 'list'
  return 'unknown'
}
</script>

<template>
  <div class="page" :data-testid="`page-${page.id}`">
    <h2>{{ page.title }} <span class="ptype">{{ page.type }}</span></h2>
    <div v-for="c in page.components" :key="c.id" class="comp-block">
      <ListRenderer v-if="rendererFor(c.type) === 'list'" :component="c" :ctx="ctx" @open="emit('open', $event)" />
      <FormRenderer
        v-else-if="rendererFor(c.type) === 'form'"
        :component="c"
        :ctx="ctx"
        :record-name="recordName"
        @saved="emit('saved', $event)"
      />
      <MetricGroup v-else-if="rendererFor(c.type) === 'metric'" :component="c" :ctx="ctx" />
      <WorkflowHistory
        v-else-if="rendererFor(c.type) === 'workflow'"
        :component="c"
        :ctx="ctx"
        :record-name="recordName"
        @transition="emit('transition', $event)"
      />
      <div v-else class="placeholder" :data-testid="`unknown-${c.id}`">
        Component type “{{ c.type }}” has no runtime renderer yet.
      </div>
    </div>
  </div>
</template>

<style scoped>
h2 { margin: 0 0 12px; }
.ptype { font-size: 12px; color: #6b7680; font-weight: 400; }
.comp-block { margin-bottom: 20px; }
.placeholder { border: 1px dashed #d9dee3; border-radius: 8px; padding: 12px; color: #6b7680; }
</style>
