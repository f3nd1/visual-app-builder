// Synthetic users with different roles, for exercising permission behaviour in
// the Runtime without a real ERPNext login. A real deployment gets the current
// user and roles from the Frappe session instead.
export const MOCK_USERS = [
  { name: 'Administrator', roles: ['System Manager'] },
  { name: 'app_user', roles: ['App User'] },
  { name: 'qa_manager', roles: ['App User', 'QA Manager'] },
  { name: 'reviewer', roles: ['App User', 'Reviewer'] },
  { name: 'guest', roles: [] },
]
