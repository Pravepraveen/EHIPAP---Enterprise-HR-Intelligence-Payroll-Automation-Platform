import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { getApiBaseUrl } from '../../config/api'

const API_BASE = getApiBaseUrl()

const authHttp = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export interface UserInfo {
  id: string
  username: string
  email: string
  role: string
}

interface AuthState {
  user: UserInfo | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
  hydrated: boolean
}

function readStoredUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  hydrated: false,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authHttp.post('/api/v1/auth/login', credentials)
      return response.data
    } catch (error: unknown) {
      const err = error as {
        code?: string
        message?: string
        response?: { data?: { message?: string }; status?: number }
      }
      const status = err.response?.status
      const serverMessage = err.response?.data?.message

      if (serverMessage) return rejectWithValue(serverMessage)
      if (status === 401 || status === 403) return rejectWithValue('Invalid username or password')
      if (err.code === 'ECONNABORTED') {
        return rejectWithValue(`Backend timeout. Check ${API_BASE || '/api'} is reachable.`)
      }
      if (!err.response) {
        return rejectWithValue(`Cannot reach backend at ${API_BASE || '/api'}. Check Wi-Fi, PC IP, and backend.`)
      }

      return rejectWithValue(`Login failed (${status ?? 'unknown error'})`)
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const state = getState() as { auth: AuthState }
  if (state.auth.refreshToken) {
    try {
      await authHttp.post('/api/v1/auth/logout', { refreshToken: state.auth.refreshToken })
    } catch {
      /* ignore */
    }
  }
})

function persistSession(user: UserInfo, accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
  localStorage.setItem('user', JSON.stringify(user))
}

function wipeSessionStorage() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    hydrateFromStorage: (state) => {
      state.accessToken = localStorage.getItem('accessToken')
      state.refreshToken = localStorage.getItem('refreshToken')
      state.user = readStoredUser()
      state.hydrated = true
    },
    setSession: (
      state,
      action: PayloadAction<{ user: UserInfo; accessToken: string; refreshToken: string }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload
      state.user = user
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.error = null
      persistSession(user, accessToken, refreshToken)
    },
    updateAccessToken: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
      state.accessToken = action.payload.accessToken
      localStorage.setItem('accessToken', action.payload.accessToken)
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken
        localStorage.setItem('refreshToken', action.payload.refreshToken)
      }
    },
    clearSession: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.loading = false
      state.error = null
      wipeSessionStorage()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{
        user: UserInfo
        accessToken: string
        refreshToken: string
      }>) => {
        state.loading = false
        state.error = null
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        persistSession(
          action.payload.user,
          action.payload.accessToken,
          action.payload.refreshToken
        )
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        wipeSessionStorage()
      })
  },
})

export const { clearError, hydrateFromStorage, setSession, updateAccessToken, clearSession } =
  authSlice.actions
export default authSlice.reducer

/** Use in route guards — Redux + localStorage stay in sync after hydrate */
export function selectIsAuthenticated(state: { auth: AuthState }): boolean {
  return Boolean(state.auth.accessToken || localStorage.getItem('accessToken'))
}
