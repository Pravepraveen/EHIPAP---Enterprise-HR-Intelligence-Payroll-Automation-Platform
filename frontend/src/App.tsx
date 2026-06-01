import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAppSelector } from './app/hooks'
import { selectIsAuthenticated } from './features/auth/authSlice'
import AuthBootstrap from './components/AuthBootstrap'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EmployeesPage from './pages/employee/EmployeesPage'
import EmployeeDetailPage from './pages/employee/EmployeeDetailPage'
import PayrollPage from './pages/payroll/PayrollPage'
import AttendancePage from './pages/attendance/AttendancePage'
import LeavePage from './pages/attendance/LeavePage'
import RecruitmentPage from './pages/recruitment/RecruitmentPage'
import PerformancePage from './pages/performance/PerformancePage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import SettingsPage from './pages/settings/SettingsPage'
import ProfilePage from './pages/settings/ProfilePage'
import RoleRoute from './components/RoleRoute'
import { getDefaultRoute } from './config/roles'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const hydrated = useAppSelector((state) => state.auth.hydrated)
  const isAuth = useAppSelector(selectIsAuthenticated)

  if (!hydrated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return isAuth ? <>{children}</> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

const App: React.FC = () => {
  const role = useAppSelector((state) => state.auth.user?.role)

  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to={getDefaultRoute(role)} replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="employees" element={<RoleRoute path="/employees"><EmployeesPage /></RoleRoute>} />
          <Route path="employees/:id" element={<RoleRoute path="/employees"><EmployeeDetailPage /></RoleRoute>} />
          <Route path="payroll" element={<RoleRoute path="/payroll"><PayrollPage /></RoleRoute>} />
          <Route path="attendance" element={<RoleRoute path="/attendance"><AttendancePage /></RoleRoute>} />
          <Route path="leaves" element={<RoleRoute path="/leaves"><LeavePage /></RoleRoute>} />
          <Route path="recruitment" element={<RoleRoute path="/recruitment"><RecruitmentPage /></RoleRoute>} />
          <Route path="performance" element={<RoleRoute path="/performance"><PerformancePage /></RoleRoute>} />
          <Route path="analytics" element={<RoleRoute path="/analytics"><AnalyticsPage /></RoleRoute>} />
          <Route path="notifications" element={<RoleRoute path="/notifications"><NotificationsPage /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute path="/settings"><SettingsPage /></RoleRoute>} />
          <Route path="profile" element={<RoleRoute path="/profile"><ProfilePage /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to={getDefaultRoute(role)} replace />} />
      </Routes>
    </AuthBootstrap>
  )
}

export default App
