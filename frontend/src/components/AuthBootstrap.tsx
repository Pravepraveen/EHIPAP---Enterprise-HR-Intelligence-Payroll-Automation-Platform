import { useEffect } from 'react'
import { useAppDispatch } from '../app/hooks'
import { hydrateFromStorage } from '../features/auth/authSlice'

/** Sync Redux auth state from localStorage once on app load */
const AuthBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(hydrateFromStorage())
  }, [dispatch])

  return <>{children}</>
}

export default AuthBootstrap
