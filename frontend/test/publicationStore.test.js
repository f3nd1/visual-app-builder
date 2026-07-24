import { describe, it, expect } from 'vitest'
import { MockPublicationStore, checksum } from '../src/lib/publicationStore.js'
import { validateDefinition } from '../src/lib/validate.js'
import qa from '../../examples/qa_lifecycle_manager.json'

const fresh = () => new MockPublicationStore({ persist: false })

describe('MockPublicationStore', () => {
  it('publishes with a version and checksum, and lists it active', () => {
    const store = fresh()
    const res = store.publish(qa)
    expect(res.appCode).toBe('qa_lifecycle_manager')
    expect(res.version).toBe(1)
    expect(res.checksum).toBe(checksum(JSON.stringify(qa)))
    const apps = store.listApplications()
    expect(apps).toHaveLength(1)
    expect(apps[0].active).toBe(1)
  })

  it('republishing creates a new version and never overwrites the active one', () => {
    const store = fresh()
    store.publish(qa)
    const v1 = store.getVersion('qa_lifecycle_manager', 1)
    const edited = structuredClone(qa)
    edited.application.description += ' v2'
    const res = store.publish(edited)
    expect(res.version).toBe(2)
    expect(store.listVersions('qa_lifecycle_manager')).toHaveLength(2)
    // v1 is unchanged (immutable)
    expect(store.getVersion('qa_lifecycle_manager', 1).definition).toEqual(v1.definition)
    // active is now v2
    expect(store.getActive('qa_lifecycle_manager').version).toBe(2)
  })

  it('getActive returns a clone that cannot mutate the stored version', () => {
    const store = fresh()
    store.publish(qa)
    const a = store.getActive('qa_lifecycle_manager')
    a.definition.application.title = 'HACKED'
    expect(store.getActive('qa_lifecycle_manager').definition.application.title).toBe(qa.application.title)
  })

  it('published definition still validates (schema-lock preserved)', () => {
    const store = fresh()
    store.publish(qa)
    expect(validateDefinition(store.getActive('qa_lifecycle_manager').definition)).toEqual([])
  })

  it('rollback re-points active at a prior version without creating one', () => {
    const store = fresh()
    store.publish(qa)
    store.publish(qa)
    expect(store.getActive('qa_lifecycle_manager').version).toBe(2)
    store.rollback('qa_lifecycle_manager', 1)
    expect(store.getActive('qa_lifecycle_manager').version).toBe(1)
    expect(store.listVersions('qa_lifecycle_manager')).toHaveLength(2) // no new version made
  })

  it('rollback to a missing version throws', () => {
    const store = fresh()
    store.publish(qa)
    expect(() => store.rollback('qa_lifecycle_manager', 9)).toThrow(/no such version/)
  })

  it('refuses to publish a definition without an application code', () => {
    const store = fresh()
    expect(() => store.publish({ application: {} })).toThrow(/application.code/)
  })

  it('different content yields different checksums (a constant checksum would fail here)', () => {
    const edited = structuredClone(qa)
    edited.application.description += ' changed'
    expect(checksum(JSON.stringify(qa))).not.toBe(checksum(JSON.stringify(edited)))
  })

  it('unicode (zh-CN) survives publish and read-back byte-identical', () => {
    const store = fresh()
    const def = structuredClone(qa)
    def.translations['app.title']['zh-CN'] = '质量生命周期管理器'
    def.translations['common.save']['zh-CN'] = '保存 🈶 ✓'
    store.publish(def)
    const back = store.getActive('qa_lifecycle_manager').definition
    expect(back).toEqual(def)
    expect(JSON.stringify(back)).toBe(JSON.stringify(def))
    expect(validateDefinition(back)).toEqual([])
  })
})
