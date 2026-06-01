import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  departmentId: string
  departmentName: string
  designation: string
  status: string
  joiningDate: string
  basicSalary: number
  employmentType: string
}

interface EmployeeState {
  employees: Employee[]
  total: number
  loading: boolean
  error: string | null
  stats: any
}

const initialState: EmployeeState = {
  employees: [],
  total: 0,
  loading: false,
  error: null,
  stats: null,
}

export const fetchEmployees = createAsyncThunk(
  'employee/fetchAll',
  async (params: { page?: number; size?: number; search?: string; status?: string } = {}) => {
    const response = await api.get('/api/v1/employees', { params })
    return response.data
  }
)

export const fetchEmployeeStats = createAsyncThunk('employee/fetchStats', async () => {
  const response = await api.get('/api/v1/employees/stats')
  return response.data
})

export const createEmployee = createAsyncThunk(
  'employee/create',
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/employees', data)
      return response.data
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      return rejectWithValue(err.response?.data?.message || 'Failed to create employee')
    }
  }
)

export const updateEmployee = createAsyncThunk(
  'employee/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/v1/employees/${id}`, data)
      return response.data
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      return rejectWithValue(err.response?.data?.message || 'Failed to update employee')
    }
  }
)

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => { state.loading = true })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false
        state.employees = action.payload.content || action.payload
        state.total = action.payload.totalElements || action.payload.length || 0
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch employees'
      })
      .addCase(fetchEmployeeStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export default employeeSlice.reducer
