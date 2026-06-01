import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import { canAccessRoute, getDefaultRoute } from '../config/roles'

const RoleRoute: React.FC<{ path: string; children: React.ReactNode }> = ({ path, children }) => {
  const role = useAppSelector((state) => state.auth.user?.role)
  if (!canAccessRoute(role, path)) {
    return <Navigate to={getDefaultRoute(role)} replace />
  }
  return <>{children}</>
}

export default RoleRoute
