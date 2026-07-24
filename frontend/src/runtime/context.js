// Runtime context passed to every renderer: the definition, the data adapter,
// and the current (mock) user. `can()` routes every permission decision through
// the adapter so swapping in a real permission check changes nothing here.
import { reactive } from 'vue'

export function createRuntimeContext(def, { adapter, user = null } = {}) {
  return reactive({
    def,
    adapter,
    user, // { name, roles: [...] } or null
    async can(entityId, action) {
      return this.adapter.checkPermission(entityId, action, this.user)
    },
  })
}
