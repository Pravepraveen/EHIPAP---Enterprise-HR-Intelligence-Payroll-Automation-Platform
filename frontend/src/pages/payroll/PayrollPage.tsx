import React, { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Alert
} from '@mui/material'
import { PlayArrow, Download, Refresh, AccountBalanceWallet } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
  fetchPayrollRuns, fetchPayrollStats, processPayroll,
  fetchMyPayslips, fetchMySalary
} from '../../features/payroll/payrollSlice'
import { canProcessPayroll } from '../../config/roles'
import api from '../../api/axios'

const statusColors: Record<string, any> = { PROCESSED: 'success', DRAFT: 'warning', FAILED: 'error' }
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const EmployeePayrollView: React.FC = () => {
  const dispatch = useAppDispatch()
  const { myPayslips, mySalary, loading } = useAppSelector(state => state.payroll)

  useEffect(() => {
    dispatch(fetchMyPayslips())
    dispatch(fetchMySalary())
  }, [dispatch])

  const latestPayslip = myPayslips.length > 0
    ? [...myPayslips].sort((a, b) => b.year - a.year || b.month - a.month)[0]
    : null

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>My Payroll</Typography>
        <Typography variant="body2" color="text.secondary">View your salary breakdown and payslip history</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Basic Salary</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#1976d2', mt: 0.5 }}>
                ₹{Number(mySalary?.basicSalary || latestPayslip?.basicSalary || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Latest Net Pay</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#10b981', mt: 0.5 }}>
                ₹{Number(latestPayslip?.netSalary || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Payslips</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
                {myPayslips.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Latest Period</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#f59e0b', mt: 0.5 }}>
                {latestPayslip ? `${MONTHS[latestPayslip.month - 1]} ${latestPayslip.year}` : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {mySalary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccountBalanceWallet color="primary" />
              <Typography variant="h6" fontWeight={700}>My Salary Breakdown</Typography>
            </Box>
            <Grid container spacing={2}>
              {[
                { label: 'Basic Salary', value: mySalary.basicSalary },
                { label: 'HRA', value: `${mySalary.hraPercent || 40}%` },
                { label: 'DA', value: `${mySalary.daPercent || 10}%` },
                { label: 'TA', value: mySalary.taAmount },
                { label: 'Medical Allowance', value: mySalary.medicalAllowance },
                { label: 'Special Allowance', value: mySalary.specialAllowance },
              ].map(({ label, value }) => (
                <Grid item xs={12} sm={6} md={4} key={label}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {typeof value === 'number' ? `₹${Number(value).toLocaleString()}` : value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>My Payslips</Typography>
            <Button size="small" startIcon={<Refresh />} onClick={() => dispatch(fetchMyPayslips())}>Refresh</Button>
          </Box>
          <TableContainer className="mobile-table-wrap">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Basic</TableCell>
                  <TableCell>Gross</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
                ) : myPayslips.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No payslips available yet</Typography>
                  </TableCell></TableRow>
                ) : [...myPayslips].sort((a, b) => b.year - a.year || b.month - a.month).map((p: any) => (
                  <TableRow key={p.id} hover>
                    <TableCell><Typography fontWeight={600}>{MONTHS[p.month - 1]} {p.year}</Typography></TableCell>
                    <TableCell>₹{Number(p.basicSalary || 0).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(p.grossSalary || 0).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(p.totalDeductions || 0).toLocaleString()}</TableCell>
                    <TableCell><Typography fontWeight={700} color="success.main">₹{Number(p.netSalary || 0).toLocaleString()}</Typography></TableCell>
                    <TableCell><Chip label={p.status || 'GENERATED'} size="small" color="success" /></TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" startIcon={<Download />}>Download</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}

const AdminPayrollView: React.FC = () => {
  const dispatch = useAppDispatch()
  const { runs, stats, loading } = useAppSelector(state => state.payroll)
  const [openProcess, setOpenProcess] = useState(false)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedRun, setSelectedRun] = useState<any>(null)
  const [payslips, setPayslips] = useState<any[]>([])

  useEffect(() => {
    dispatch(fetchPayrollRuns())
    dispatch(fetchPayrollStats())
  }, [dispatch])

  const handleProcess = async () => {
    setProcessing(true)
    try {
      await dispatch(processPayroll({ month, year }))
      setMessage('Payroll processed successfully!')
      setOpenProcess(false)
      dispatch(fetchPayrollRuns())
    } catch {
      setMessage('Failed to process payroll')
    } finally {
      setProcessing(false)
    }
  }

  const viewPayslips = async (run: any) => {
    setSelectedRun(run)
    try {
      const r = await api.get(`/api/v1/payroll/payslips/run/${run.id}`)
      setPayslips(r.data)
    } catch { setPayslips([]) }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Payroll</Typography>
          <Typography variant="body2" color="text.secondary">Manage payroll runs and payslips</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => dispatch(fetchPayrollRuns())}>Refresh</Button>
          <Button variant="contained" startIcon={<PlayArrow />} onClick={() => setOpenProcess(true)}
            sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
            Process Payroll
          </Button>
        </Box>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Total Runs', value: stats?.totalRuns || runs.length, color: '#1976d2' },
          { label: 'Processed', value: stats?.processedRuns || runs.filter((r: any) => r.status === 'PROCESSED').length, color: '#10b981' },
          { label: 'Total Paid', value: `₹${((Number(stats?.totalPaid) || 0) / 100000).toFixed(1)}L`, color: '#7c3aed' },
          { label: 'Latest Month', value: runs[0] ? `${MONTHS[(runs[0] as any).month - 1]} ${(runs[0] as any).year}` : 'N/A', color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Card className="stat-card">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5 }}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" fontWeight={700}>Payroll Runs</Typography>
          </Box>
          <TableContainer className="mobile-table-wrap">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Employees</TableCell>
                  <TableCell>Gross Salary</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
                ) : runs.map((run: any) => (
                  <TableRow key={run.id} hover>
                    <TableCell><Typography fontWeight={600}>{MONTHS[run.month - 1]} {run.year}</Typography></TableCell>
                    <TableCell>{run.totalEmployees}</TableCell>
                    <TableCell>₹{Number(run.totalGross || 0).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(run.totalDeductions || 0).toLocaleString()}</TableCell>
                    <TableCell><Typography fontWeight={700} color="success.main">₹{Number(run.totalNet || 0).toLocaleString()}</Typography></TableCell>
                    <TableCell><Chip label={run.status} size="small" color={statusColors[run.status] || 'default'} /></TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => viewPayslips(run)}>View Payslips</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {selectedRun && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>
                Payslips - {MONTHS[selectedRun.month - 1]} {selectedRun.year}
              </Typography>
              <Button size="small" startIcon={<Download />}>Export</Button>
            </Box>
            <TableContainer className="mobile-table-wrap">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Basic</TableCell>
                    <TableCell>HRA</TableCell>
                    <TableCell>DA</TableCell>
                    <TableCell>Gross</TableCell>
                    <TableCell>PF</TableCell>
                    <TableCell>ESI</TableCell>
                    <TableCell>PT</TableCell>
                    <TableCell>Net Salary</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payslips.map((p: any) => (
                    <TableRow key={p.id} hover>
                      <TableCell><Typography variant="caption">{p.employeeId?.substring(0, 8)}...</Typography></TableCell>
                      <TableCell>₹{Number(p.basicSalary || 0).toLocaleString()}</TableCell>
                      <TableCell>₹{Number(p.hra || 0).toLocaleString()}</TableCell>
                      <TableCell>₹{Number(p.da || 0).toLocaleString()}</TableCell>
                      <TableCell><Typography fontWeight={600}>₹{Number(p.grossSalary || 0).toLocaleString()}</Typography></TableCell>
                      <TableCell>₹{Number(p.pfEmployee || 0).toLocaleString()}</TableCell>
                      <TableCell>₹{Number(p.esiEmployee || 0).toLocaleString()}</TableCell>
                      <TableCell>₹{Number(p.professionalTax || 0).toLocaleString()}</TableCell>
                      <TableCell><Typography fontWeight={700} color="success.main">₹{Number(p.netSalary || 0).toLocaleString()}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={openProcess} onClose={() => setOpenProcess(false)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight={700}>Process Payroll</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Month" type="number" value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                inputProps={{ min: 1, max: 12 }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Year" type="number" value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                inputProps={{ min: 2020, max: 2030 }} />
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>
            This will compute payroll for all active employees for {MONTHS[month - 1]} {year}.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenProcess(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleProcess} disabled={processing}
            sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
            {processing ? <CircularProgress size={20} color="inherit" /> : 'Process'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

const PayrollPage: React.FC = () => {
  const role = useAppSelector(state => state.auth.user?.role)
  const isAdmin = canProcessPayroll(role)

  return isAdmin ? <AdminPayrollView /> : <EmployeePayrollView />
}

export default PayrollPage
