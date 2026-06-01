import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

interface PayrollState {
  runs: any[]
  payslips: any[]
  stats: any
  myPayslips: any[]
  mySalary: any
  loading: boolean
  error: string | null
}

const initialState: PayrollState = {
  runs: [],
  payslips: [],
  stats: null,
  myPayslips: [],
  mySalary: null,
  loading: false,
  error: null,
}

export const fetchPayrollRuns = createAsyncThunk('payroll/fetchRuns', async () => {
  const response = await api.get('/api/v1/payroll/runs', { skipAuthRedirect: true })
  return response.data
})

export const fetchPayrollStats = createAsyncThunk('payroll/fetchStats', async () => {
  const response = await api.get('/api/v1/payroll/stats', { skipAuthRedirect: true })
  return response.data
})

export const fetchMyPayslips = createAsyncThunk('payroll/fetchMyPayslips', async () => {
  const response = await api.get('/api/v1/payroll/my/payslips', { skipAuthRedirect: true })
  return response.data
})

export const fetchMySalary = createAsyncThunk('payroll/fetchMySalary', async () => {
  const response = await api.get('/api/v1/payroll/my/salary', { skipAuthRedirect: true })
  return response.data
})

export const processPayroll = createAsyncThunk(
  'payroll/process',
  async ({ month, year }: { month: number; year: number }) => {
    const response = await api.post(`/api/v1/payroll/process?month=${month}&year=${year}`)
    return response.data
  }
)

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollRuns.pending, (state) => { state.loading = true })
      .addCase(fetchPayrollRuns.fulfilled, (state, action) => {
        state.loading = false
        state.runs = action.payload
      })
      .addCase(fetchPayrollRuns.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed'
      })
      .addCase(fetchPayrollStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      .addCase(fetchMyPayslips.pending, (state) => { state.loading = true })
      .addCase(fetchMyPayslips.fulfilled, (state, action) => {
        state.loading = false
        state.myPayslips = action.payload
      })
      .addCase(fetchMyPayslips.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed'
      })
      .addCase(fetchMySalary.fulfilled, (state, action) => {
        state.mySalary = action.payload
      })
      .addCase(processPayroll.fulfilled, (state, action) => {
        state.runs = [action.payload, ...state.runs.filter(r => r.id !== action.payload.id)]
      })
  },
})

export default payrollSlice.reducer
