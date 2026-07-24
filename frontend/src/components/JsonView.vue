<script setup>
import { store } from '../store.js'
</script>

<template>
  <div>
    <p class="muted">Live serialisation of the current definition — exactly what Export writes.</p>
    <pre class="json">{{ store.export() }}</pre>
  </div>
</template>
