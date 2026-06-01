import React, { useState, useEffect } from 'react'

import { useNavigate } from 'react-router-dom'

import {

  Box, Card, CardContent, TextField, Button, Typography, Alert,

  InputAdornment, IconButton, CircularProgress

} from '@mui/material'

import { Visibility, VisibilityOff, Lock, Person } from '@mui/icons-material'

import { useAppDispatch, useAppSelector } from '../../app/hooks'

import { login, clearError, selectIsAuthenticated } from '../../features/auth/authSlice'

import { getDefaultRoute } from '../../config/roles'



const LoginPage: React.FC = () => {

  const [username, setUsername] = useState('')

  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const dispatch = useAppDispatch()

  const navigate = useNavigate()

  const { loading, error } = useAppSelector((state) => state.auth)

  const isAuthenticated = useAppSelector(selectIsAuthenticated)



  useEffect(() => () => { dispatch(clearError()) }, [dispatch])



  useEffect(() => {

    if (isAuthenticated) {

      navigate(getDefaultRoute(null), { replace: true })

    }

  }, [isAuthenticated, navigate])



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    dispatch(clearError())

    const result = await dispatch(login({
      username: username.trim(),
      password: password.trim(),
    }))

    if (login.fulfilled.match(result)) {

      const role = result.payload.user?.role

      navigate(getDefaultRoute(role), { replace: true })

    }

  }



  return (

    <Box sx={{

      minHeight: '100vh',

      display: 'flex',

      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',

      position: 'relative',

      overflow: 'hidden',

    }}>

      <Box sx={{

        position: 'absolute', top: -100, right: -100,

        width: 400, height: 400, borderRadius: '50%',

        background: 'radial-gradient(circle, rgba(25,118,210,0.15) 0%, transparent 70%)',

      }} />

      <Box sx={{

        position: 'absolute', bottom: -100, left: -100,

        width: 400, height: 400, borderRadius: '50%',

        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',

      }} />



      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>

        <Box sx={{ width: '100%', maxWidth: 440 }}>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/ascendion-icon.png"
              alt="Ascendion"
              sx={{ width: 64, height: 64, mx: 'auto', mb: 2, display: 'block', borderRadius: 2 }}
            />
            <Box
              component="img"
              src="/ascendion-logo.png"
              alt="Ascendion"
              sx={{ height: 36, maxWidth: 280, mx: 'auto', mb: 1, display: 'block', objectFit: 'contain' }}
            />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              HR Platform
            </Typography>
          </Box>



          <Card sx={{ borderRadius: 3, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>

            <CardContent sx={{ p: 4 }}>

              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>

                Welcome back

              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>

                Sign in with your organization credentials

              </Typography>



              {error && (

                <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>

                  {error}

                </Alert>

              )}



              <form onSubmit={handleSubmit}>

                <TextField

                  fullWidth label="Username" value={username}

                  onChange={(e) => setUsername(e.target.value)}

                  InputProps={{

                    startAdornment: <InputAdornment position="start"><Person sx={{ color: '#94a3b8' }} /></InputAdornment>

                  }}

                  sx={{ mb: 2 }} required autoComplete="username"

                />

                <TextField

                  fullWidth label="Password" type={showPassword ? 'text' : 'password'}

                  value={password} onChange={(e) => setPassword(e.target.value)}

                  InputProps={{

                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#94a3b8' }} /></InputAdornment>,

                    endAdornment: (

                      <InputAdornment position="end">

                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">

                          {showPassword ? <VisibilityOff /> : <Visibility />}

                        </IconButton>

                      </InputAdornment>

                    )

                  }}

                  sx={{ mb: 3 }} required autoComplete="current-password"

                />

                <Button

                  type="submit" fullWidth variant="contained" size="large"

                  disabled={loading}

                  sx={{

                    py: 1.5, fontSize: 16, fontWeight: 700,

                    background: 'linear-gradient(135deg, #1976d2, #7c3aed)',

                    '&:hover': { background: 'linear-gradient(135deg, #1565c0, #6d28d9)' }

                  }}

                >

                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}

                </Button>

              </form>

            </CardContent>

          </Card>

        </Box>

      </Box>

    </Box>

  )

}



export default LoginPage

