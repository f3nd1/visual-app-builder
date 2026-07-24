<script setup>
import { issues } from '../store.js'
</script>

<template>
  <div>
    <p v-if="issues.length === 0" class="muted">No validation issues. The definition matches the schema and the stable-ID rules.</p>
    <ul v-else>
      <li v-for="(iss, i) in issues" :key="i">
        <code>{{ iss.path }}</code> — {{ iss.message }}
      </li>
    </ul>
  </div>
</template>
