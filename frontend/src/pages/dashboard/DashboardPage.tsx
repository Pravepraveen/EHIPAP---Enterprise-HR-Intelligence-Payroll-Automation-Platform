import React from 'react'
import { useAppSelector } from '../../app/hooks'
import { isAdminRole, isEmployeeRole, normalizeRole } from '../../config/roles'
import AdminDashboard from './AdminDashboard'
import ManagerDashboard from './ManagerDashboard'
import EmployeeDashboard from './EmployeeDashboard'

const DashboardPage: React.FC = () => {
  const role = useAppSelector((state) => state.auth.user?.role)

  if (isEmployeeRole(role)) {
    return <EmployeeDashboard />
  }

  if (isAdminRole(role)) {
    return <AdminDashboard />
  }

  // HR_MANAGER, FINANCE_MANAGER, RECRUITER
  const r = normalizeRole(role)
  if (r === 'FINANCE_MANAGER' || r === 'RECRUITER' || r === 'HR_MANAGER') {
    return <ManagerDashboard />
  }

  return <EmployeeDashboard />
}

export default DashboardPage
