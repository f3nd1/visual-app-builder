<script setup>
// Controlled floating menu. Parent owns the state object:
//   { open: bool, x, y, items: [{ label, shortcut?, action, disabled?, danger? }] }
// Used for both right-click and the kebab ("…") button, so right-click is a
// power-user accelerator over the same menu, never the only way in.
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({ menu: { type: Object, required: true } })

function close() {
  props.menu.open = false
}
function run(item) {
  if (item.disabled) return
  item.action()
  close()
}
function onKey(e) {
  if (e.key === 'Escape') close()
}
onMounted(() => {
  window.addEventListener('click', close)
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.removeEventListener('click', close)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div
    v-if="menu.open"
    class="ctx"
    :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
    @click.stop
  >
    <button
      v-for="(item, i) in menu.items"
      :key="i"
      class="ctx-item"
      :class="{ danger: item.danger, disabled: item.disabled }"
      @click="run(item)"
    >
      <span>{{ item.label }}</span>
      <span v-if="item.shortcut" class="sc">{{ item.shortcut }}</span>
    </button>
  </div>
</template>

<style scoped>
.ctx {
  position: fixed;
  z-index: 100;
  min-width: 180px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
  padding: 4px;
}
.ctx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 6px 10px;
  border-radius: 6px;
  text-align: left;
}
.ctx-item:hover { background: var(--chip); }
.ctx-item.danger { color: var(--err); }
.ctx-item.disabled { color: var(--muted); cursor: default; }
.ctx-item.disabled:hover { background: transparent; }
.sc { color: var(--muted); font-size: 12px; }
</style>
