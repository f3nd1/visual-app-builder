import { describe, it, expect } from 'vitest'
import { MockPermissionAdapter } from '../../src/runtime/adapters/MockPermissionAdapter.js'
import { MockDataAdapter } from '../../src/runtime/adapters/MockDataAdapter.js'
import { MOCK_USERS } from '../../src/runtime/fixtures/users.js'
import qa from '../../../examples/qa_lifecycle_manager.json'

const user = (name) => MOCK_USERS.find((u) => u.name === name)

describe('MockPermissionAdapter mirrors the definition permissions array', () => {
  const perms = new MockPermissionAdapter(qa)

  it('System Manager is a superuser', () => {
    for (const action of ['read', 'write', 'create', 'submit']) {
      expect(perms.can('qa_review', action, user('Administrator'))).toBe(true)
    }
  })

  it('App User gets read/write/create but not submit (per definition)', () => {
    expect(perms.can('qa_review', 'read', user('app_user'))).toBe(true)
    expect(perms.can('qa_review', 'write', user('app_user'))).toBe(true)
    expect(perms.can('qa_review', 'create', user('app_user'))).toBe(true)
    expect(perms.can('qa_review', 'submit', user('app_user'))).toBe(false)
  })

  it('a user with no matching role is denied', () => {
    expect(perms.can('qa_review', 'read', user('guest'))).toBe(false)
  })

  it('no user (no session) is denied', () => {
    expect(perms.can('qa_review', 'read', null)).toBe(false)
  })
})

describe('DataAdapter routes permission checks through the adapter', () => {
  it('checkPermission delegates to the wired permission adapter', async () => {
    const perms = new MockPermissionAdapter(qa)
    const data = new MockDataAdapter(qa, { permissionAdapter: perms })
    expect(await data.checkPermission('qa_review', 'submit', user('app_user'))).toBe(false)
    expect(await data.checkPermission('qa_review', 'submit', user('Administrator'))).toBe(true)
  })
})
