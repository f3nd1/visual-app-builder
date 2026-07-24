// SYNTHETIC DATA ONLY. Nothing here is real UCC/SMS data. These fixtures exist
// so the Runtime can render and behave without an ERPNext connection. Values
// are obviously fabricated. A real FrappeDataAdapter replaces all of this.

export const SYNTHETIC_NOTICE = 'Synthetic sample data — not real records.'

const STATUSES = ['planned', 'assigned', 'in_review', 'action_required', 'uat', 'qa_approval', 'closed', 'draft', 'issued', 'obsolete', 'submitted', 'approval', 'released']
const PEOPLE = ['Ada Sample', 'Ben Mock', 'Chen Demo', 'Dev Placeholder', 'Eve Fixture']

// Heuristic value for a field, by field-name convention. Deterministic per
// (field, row index) so tests are stable (no Date.now / Math.random).
function valueFor(field, i) {
  const f = field.toLowerCase()
  if (f === 'name') return null // assigned by the adapter
  if (f.includes('status') || f.includes('result') || f.includes('decision')) return STATUSES[i % STATUSES.length]
  if (f.includes('date')) return `2026-0${(i % 9) + 1}-15`
  if (f.includes('owner') || f.includes('reviewer') || f.includes('tester') || f.includes('assigned') || f.includes('by') || f.includes('user')) return PEOPLE[i % PEOPLE.length]
  if (f.includes('version')) return `0.${i + 1}.0`
  if (f.includes('score')) return String(60 + ((i * 7) % 40))
  if (f.includes('sign_off') || f.includes('signoff')) return i % 2 ? 'Signed' : 'Pending'
  if (f.includes('file') || f.includes('attachment')) return `synthetic_${field}_${i + 1}.pdf`
  if (f.includes('title') || f.includes('subject')) return `Synthetic ${field} ${i + 1}`
  return `Synthetic ${field} ${i + 1}`
}

// Generate `count` synthetic rows for an entity from its declared field list.
export function generateSynthetic(entity, count = 5) {
  const rows = []
  for (let i = 0; i < count; i++) {
    const row = {}
    for (const field of entity.fields || []) row[field] = valueFor(field, i)
    rows.push(row)
  }
  return rows
}

// Nicer, story-consistent seed data for QA Lifecycle Manager, so the demo reads
// like a real QA workflow rather than "Synthetic field 1". Keyed by entity id.
export const QA_SEED = {
  qa_review: [
    { title: 'Annual QA review — Admissions', scope: 'Admissions process', owner: 'Ada Sample', reviewer: 'Ben Mock', due_date: '2026-08-15', status: 'in_review' },
    { title: 'Annual QA review — Library', scope: 'Library services', owner: 'Chen Demo', reviewer: 'Ben Mock', due_date: '2026-09-01', status: 'assigned' },
    { title: 'Annual QA review — Exams', scope: 'Examinations', owner: 'Dev Placeholder', reviewer: 'Eve Fixture', due_date: '2026-07-30', status: 'action_required' },
    { title: 'Annual QA review — IT', scope: 'IT operations', owner: 'Ada Sample', reviewer: 'Eve Fixture', due_date: '2026-10-10', status: 'planned' },
  ],
  quality_action: [
    { name: 'QA-ACT-0001', status: 'open', assigned_to: 'Ben Mock', completion_date: '2026-08-20' },
    { name: 'QA-ACT-0002', status: 'closed', assigned_to: 'Chen Demo', completion_date: '2026-07-10' },
  ],
  uat_run: [
    { application: 'qa_lifecycle_manager', version: '0.1.0', tester: 'Eve Fixture', result: 'pass', sign_off: 'Signed' },
    { application: 'qa_lifecycle_manager', version: '0.1.0', tester: 'Dev Placeholder', result: 'fail', sign_off: 'Pending' },
  ],
}

// Seed sets keyed by application code. Apps without an explicit seed fall back
// to generateSynthetic, so any Studio export still renders with data.
export const SEED_BY_APP = {
  qa_lifecycle_manager: QA_SEED,
}
