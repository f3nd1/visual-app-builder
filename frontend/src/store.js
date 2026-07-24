// The single shared store. Its state IS the schema document — no separate
// internal model, no mapping layer. Load = assign parsed JSON; export =
// stringify. This is the deliberate defence against the old prototype, which
// kept its own shape and produced exports that matched nothing.

import { reactive, computed } from 'vue'
import { blankDefinition } from './lib/blank.js'
import { validateDefinition } from './lib/validate.js'

export const store = reactive({
  def: blankDefinition(),

  // Replace the whole definition (used by Load). Accepts a parsed object.
  load(def) {
    this.def = def
  },

  // Serialise exactly what will be written to disk / sent to the backend.
  export() {
    return JSON.stringify(this.def, null, 2)
  },
})

// Live validation — recomputes on every mutation to store.def because it is a
// Vue computed over reactive state. Components read `.value`.
export const issues = computed(() => validateDefinition(store.def))
