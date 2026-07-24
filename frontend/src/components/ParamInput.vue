<script setup>
// Renders one automation parameter. If the param declares a `source` and the
// Studio currently has options for it, show a dropdown; otherwise fall back to
// free text (a literal value, or a bound source with nothing defined yet). The
// bound value is always a plain string, so definition_json is unchanged.
import { computed } from 'vue'
import { store } from '../store.js'
import { optionsFor } from '../lib/automationOptions.js'

const props = defineProps({
  part: { type: Object, required: true }, // the trigger/condition/action object
  param: { type: Object, required: true }, // { key, label, source? }
})

const options = computed(() => (props.param.source ? optionsFor(store.def, props.param.source) : []))
const asSelect = computed(() => options.value.length > 0)
</script>

<template>
  <select v-if="asSelect" v-model="part[param.key]" :title="param.label">
    <option value="">{{ param.label }}…</option>
    <!-- keep an existing value even if it is no longer in the source list -->
    <option v-if="part[param.key] && !options.includes(part[param.key])" :value="part[param.key]">
      {{ part[param.key] }} (unlisted)
    </option>
    <option v-for="o in options" :key="o" :value="o">{{ o }}</option>
  </select>
  <input v-else v-model="part[param.key]" :placeholder="param.label" />
</template>
