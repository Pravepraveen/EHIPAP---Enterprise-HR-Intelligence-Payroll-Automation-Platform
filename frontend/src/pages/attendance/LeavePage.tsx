import React, { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, CircularProgress, Alert
} from '@mui/material'
import { Add, CheckCircle, Cancel } from '@mui/icons-material'
import api from '../../api/axios'
import { useAppSelector } from '../../app/hooks'
import { isEmployeeRole, canApproveLeave } from '../../config/roles'

/** Auth user id -> employees.id (demo seed data) */
const DEMO_USER_TO_EMPLOYEE: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002': '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003': '20000000-0000-0000-0000-000000000003',
}

const statusColors: Record<string, any> = {
  PENDING: 'warning', APPROVED: 'success', REJECTED: 'error'
}

const LeavePage: React.FC = () => {
  const user = useAppSelector(s => s.auth.user)
  const [leaves, setLeaves] = useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [message, setMessage] = useState('')
  const [messageSeverity, setMessageSeverity] = useState<'success' | 'error'>('success')
  const [resolvedEmployeeId, setResolvedEmployeeId] = useState('')
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '', employeeId: '' })

  const fetchLeaves = () => {
    setLoading(true)
    const url =
      isEmployeeRole(user?.role) && resolvedEmployeeId
        ? `/api/v1/leaves/employee/${resolvedEmployeeId}`
        : '/api/v1/leaves'
    api.get(url)
      .then(r => setLeaves(r.data))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLeaves()
    api.get('/api/v1/leaves/types').then(r => setLeaveTypes(r.data)).catch(() => {})
  }, [resolvedEmployeeId, user?.role])

  useEffect(() => {
    if (!user) return
    const resolveEmployee = async () => {
      try {
        const r = await api.get('/api/v1/employees/me', { skipAuthRedirect: true })
        if (r.data?.id) {
          setResolvedEmployeeId(r.data.id)
          setForm((f) => ({ ...f, employeeId: r.data.id }))
          return
        }
      } catch {
        /* fall through to search/demo mapping */
      }
      if (user.email) {
        try {
          const r = await api.get('/api/v1/employees', {
            params: { search: user.email, size: 5 },
            skipAuthRedirect: true,
          })
          const list = r.data?.content ?? r.data ?? []
          const match = list.find((e: { email?: string }) => e.email === user.email) ?? list[0]
          if (match?.id) {
            setResolvedEmployeeId(match.id)
            setForm((f) => ({ ...f, employeeId: match.id }))
            return
          }
        } catch {
          /* fall through to demo map */
        }
      }
      const mapped = user.id ? DEMO_USER_TO_EMPLOYEE[user.id] : ''
      if (mapped) {
        setResolvedEmployeeId(mapped)
        setForm((f) => ({ ...f, employeeId: mapped }))
      }
    }
    resolveEmployee()
  }, [user])

  const handleApply = async () => {
    setMessage('')
    if (!form.leaveTypeId || !form.startDate || !form.endDate) {
      setMessageSeverity('error')
      setMessage('Please select leave type and dates.')
      return
    }
    const employeeId =
      (isEmployeeRole(user?.role) ? resolvedEmployeeId : form.employeeId.trim()) ||
      resolvedEmployeeId ||
      form.employeeId.trim()
    if (!employeeId) {
      setMessageSeverity('error')
      setMessage('Could not determine your employee profile. Contact HR.')
      return
    }
    if (form.endDate < form.startDate) {
      setMessageSeverity('error')
      setMessage('End date must be on or after start date.')
      return
    }
    const start = new Date(`${form.startDate}T00:00:00`)
    const end = new Date(`${form.endDate}T00:00:00`)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (days < 1) {
      setMessageSeverity('error')
      setMessage('Leave must be at least 1 day.')
      return
    }
    try {
      await api.post('/api/v1/leaves', {
        employeeId,
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
        totalDays: days,
      })
      setMessageSeverity('success')
      setMessage('Leave request submitted successfully!')
      setOpenDialog(false)
      setForm({
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        employeeId: resolvedEmployeeId,
      })
      fetchLeaves()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setMessageSeverity('error')
      const raw = err.response?.data?.message || 'Failed to submit leave request'
      setMessage(
        raw.includes('leave_requests_employee_id_fkey')
          ? 'Invalid employee profile. Use your HR employee record, not your login user ID.'
          : raw
      )
    }
  }

  const handleApprove = async (id: string) => {
    await api.patch(`/api/v1/leaves/${id}/approve`)
    fetchLeaves()
  }

  const handleReject = async (id: string) => {
    await api.patch(`/api/v1/leaves/${id}/reject`, { reason: 'Rejected by manager' })
    fetchLeaves()
  }

  const canApprove = canApproveLeave(user?.role)
  const isEmployee = isEmployeeRole(user?.role)
  const pendingCount = leaves.filter(l => l.status === 'PENDING').length
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {isEmployee ? 'My Leave Requests' : 'Leave Management'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEmployee
              ? 'Apply for leave and track your request status'
              : 'Review and manage employee leave requests'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}
          sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
          Apply Leave
        </Button>
      </Box>

      {message && (
        <Alert severity={messageSeverity} sx={{ mb: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Pending', value: pendingCount, color: '#f59e0b' },
          { label: 'Approved', value: approvedCount, color: '#10b981' },
          { label: 'Total Requests', value: leaves.length, color: '#1976d2' },
        ].map(({ label, value, color }) => (
          <Grid item xs={12} sm={4} key={label}>
            <Card className="stat-card">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" fontWeight={700}>Leave Requests</Typography>
          </Box>
          <TableContainer className="mobile-table-wrap">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  {canApprove && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={canApprove ? 8 : 7} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
                ) : leaves.length === 0 ? (
                  <TableRow><TableCell colSpan={canApprove ? 8 : 7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No leave requests found</Typography>
                  </TableCell></TableRow>
                ) : leaves.map((l: any) => (
                  <TableRow key={l.id} hover>
                    <TableCell><Typography variant="caption">{l.employeeId?.substring(0, 8)}...</Typography></TableCell>
                    <TableCell>{l.leaveTypeId?.substring(0, 8)}...</TableCell>
                    <TableCell>{l.startDate ? new Date(l.startDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{l.endDate ? new Date(l.endDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell><Chip label={`${l.totalDays}d`} size="small" /></TableCell>
                    <TableCell sx={{ maxWidth: 150 }}>
                      <Typography variant="caption" noWrap>{l.reason || '-'}</Typography>
                    </TableCell>
                    <TableCell><Chip label={l.status} size="small" color={statusColors[l.status] || 'default'} /></TableCell>
                    {canApprove && (
                      <TableCell>
                        {l.status === 'PENDING' && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button size="small" color="success" variant="outlined"
                              startIcon={<CheckCircle fontSize="small" />}
                              onClick={() => handleApprove(l.id)}>Approve</Button>
                            <Button size="small" color="error" variant="outlined"
                              startIcon={<Cancel fontSize="small" />}
                              onClick={() => handleReject(l.id)}>Reject</Button>
                          </Box>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Apply for Leave</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Leave Type</InputLabel>
              <Select value={form.leaveTypeId} label="Leave Type"
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}>
                {leaveTypes.map((lt: any) => (
                  <MenuItem key={lt.id} value={lt.id}>{lt.name} ({lt.code})</MenuItem>
                ))}
              </Select>
            </FormControl>
            {!isEmployeeRole(user?.role) && (
              <TextField size="small" label="Employee ID" value={form.employeeId} required
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                placeholder="e.g. 20000000-0000-0000-0000-000000000003"
                helperText="Use employees.id from HR records, not login user id" />
            )}
            <TextField size="small" label="Start Date" type="date" required
              value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }} />
            <TextField size="small" label="End Date" type="date" required
              value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }} />
            <TextField size="small" label="Reason" multiline rows={3}
              value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApply}
            sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LeavePage
