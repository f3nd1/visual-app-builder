// Round-trip proof: load the QA example the same way the Studio does, apply a
// trivial edit, serialise it exactly as store.export() would, then run the
// REAL scripts/check_repository.py validator against the output. If the repo's
// own validator accepts it unchanged, the Studio's shape is genuinely locked
// to the schema.
//
// Run: npm run roundtrip

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = join(here, '..', '..')
const examplePath = join(repoRoot, 'examples', 'qa_lifecycle_manager.json')

// 1. Load exactly as the Studio does.
const def = JSON.parse(readFileSync(examplePath, 'utf8'))

// 2. Trivial edit (what a designer might do in the Studio) — including real
// Simplified Chinese, so the round-trip also proves unicode survives the
// write + python re-read.
def.application.description = def.application.description + ' (edited in Studio)'
def.translations['app.title']['zh-CN'] = '质量生命周期管理器'

// 3. Serialise exactly as store.export().
const out = JSON.stringify(def, null, 2)

// 4. Write to a temp file and validate with the real check_repository.py.
const dir = mkdtempSync(join(tmpdir(), 'vab-roundtrip-'))
const outPath = join(dir, 'qa_lifecycle_manager.json')
writeFileSync(outPath, out)

const py = `
import sys
sys.path.insert(0, ${JSON.stringify(join(repoRoot, 'scripts'))})
from pathlib import Path
from check_repository import validate_definition
errs = validate_definition(Path(${JSON.stringify(outPath)}))
if errs:
    print("\\n".join(errs))
    sys.exit(1)
print("check_repository.py: OK")
`

try {
  const result = execFileSync('python3', ['-c', py], { encoding: 'utf8' })
  process.stdout.write(result)
  console.log('Round-trip PASSED — Studio export validates unchanged.')
} catch (e) {
  console.error('Round-trip FAILED:')
  console.error(e.stdout || e.message)
  process.exit(1)
}
