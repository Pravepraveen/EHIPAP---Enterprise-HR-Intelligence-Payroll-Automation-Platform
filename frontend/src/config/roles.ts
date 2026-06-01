export type UserRole =
  | 'SUPER_ADMIN'
  | 'HR_MANAGER'
  | 'EMPLOYEE'
  | 'RECRUITER'
  | 'FINANCE_MANAGER'

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  HR_MANAGER: 'HR Manager',
  EMPLOYEE: 'Employee',
  RECRUITER: 'Recruiter',
  FINANCE_MANAGER: 'Finance Manager',
}

export function normalizeRole(role?: string | null): UserRole {
  const r = (role || 'EMPLOYEE').toUpperCase()
  if (r in ROLE_LABELS) return r as UserRole
  return 'EMPLOYEE'
}

/** Routes each role may open in the sidebar */
const ROLE_ALLOWED_PATHS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    '/dashboard', '/employees', '/payroll', '/attendance', '/leaves',
    '/recruitment', '/performance', '/analytics', '/notifications', '/settings', '/profile',
  ],
  HR_MANAGER: [
    '/dashboard', '/employees', '/payroll', '/attendance', '/leaves',
    '/recruitment', '/performance', '/analytics', '/notifications', '/settings', '/profile',
  ],
  FINANCE_MANAGER: [
    '/dashboard', '/payroll', '/analytics', '/employees', '/notifications', '/settings', '/profile',
  ],
  RECRUITER: [
    '/dashboard', '/recruitment', '/employees', '/notifications', '/profile', '/settings',
  ],
  EMPLOYEE: [
    '/dashboard', '/leaves', '/payroll', '/notifications', '/profile', '/settings',
  ],
}

export function canAccessRoute(role: string | undefined | null, path: string): boolean {
  const r = normalizeRole(role)
  const allowed = ROLE_ALLOWED_PATHS[r]
  if (path === '/dashboard' || path === '/') return true
  return allowed.some((p) => path === p || path.startsWith(p + '/'))
}

export function getDefaultRoute(role: string | undefined | null): string {
  return '/dashboard'
}

export function isAdminRole(role: string | undefined | null): boolean {
  return normalizeRole(role) === 'SUPER_ADMIN'
}

export function isManagerRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role)
  return r === 'HR_MANAGER' || r === 'FINANCE_MANAGER' || r === 'RECRUITER'
}

export function isEmployeeRole(role: string | undefined | null): boolean {
  return normalizeRole(role) === 'EMPLOYEE'
}

/** Admin or HR Manager may approve/reject leave */
export function canApproveLeave(role: string | undefined | null): boolean {
  const r = normalizeRole(role)
  return r === 'SUPER_ADMIN' || r === 'HR_MANAGER'
}

/** Admin or HR Manager may create/manage employees */
export function canManageEmployees(role: string | undefined | null): boolean {
  const r = normalizeRole(role)
  return r === 'SUPER_ADMIN' || r === 'HR_MANAGER'
}

/** Only Admin may process payroll and view org-wide payroll data */
export function canProcessPayroll(role: string | undefined | null): boolean {
  const r = normalizeRole(role)
  return r === 'SUPER_ADMIN'
}

/** Alias for org-wide payroll visibility (runs, stats, all payslips) */
export function canViewAllPayroll(role: string | undefined | null): boolean {
  return canProcessPayroll(role)
}
