import React, { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, Pagination, Alert
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Search, Add, Edit, Visibility, PersonOff, Refresh } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchEmployees, createEmployee, updateEmployee } from '../../features/employee/employeeSlice'
import api from '../../api/axios'
import { canManageEmployees } from '../../config/roles'

const statusColors: Record<string, any> = {
  ACTIVE: 'success', TERMINATED: 'error', ON_LEAVE: 'warning', PROBATION: 'info'
}

const EmployeesPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { employees, total, loading } = useAppSelector(state => state.employee)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [deptLoading, setDeptLoading] = useState(false)
  const [deptError, setDeptError] = useState('')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    departmentId: '', designation: '', joiningDate: '', basicSalary: '',
    employmentType: 'FULL_TIME', gender: '', city: '', state: '',
    username: '', password: '',
  })
  const [formError, setFormError] = useState('')
  const [editFormError, setEditFormError] = useState('')
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', phone: '',
    departmentId: '', designation: '', basicSalary: '',
    city: '', state: '', gender: '',
  })
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null)
  const role = useAppSelector(state => state.auth.user?.role)
  const canCreate = canManageEmployees(role)

  useEffect(() => {
    dispatch(fetchEmployees({ page, size: 10, search: search || undefined, status: status || undefined }))
  }, [dispatch, page, search, status])

  const loadDepartments = async () => {
    setDeptLoading(true)
    setDeptError('')
    try {
      const r = await api.get('/api/v1/departments', { skipAuthRedirect: true })
      const list = Array.isArray(r.data) ? r.data : (r.data?.content ?? [])
      setDepartments(list)
      if (list.length === 0) {
        setDeptError('No departments available. Ensure the employee service is running.')
      }
    } catch {
      setDepartments([])
      setDeptError('Failed to load departments. Restart backend with .\\scripts\\start-local.ps1')
    } finally {
      setDeptLoading(false)
    }
  }

  useEffect(() => {
    if (openDialog || openEditDialog) {
      loadDepartments()
    }
  }, [openDialog, openEditDialog])

  const suggestUsername = (email: string) => {
    if (!email.includes('@')) return ''
    return email.split('@')[0].toLowerCase().replace(/[^a-z0-9.]/g, '')
  }

  const handleCreate = async () => {
    setFormError('')
    if (!form.firstName?.trim() || !form.email?.trim() || !form.departmentId || !form.joiningDate) {
      setFormError('First name, email, department, and joining date are required.')
      return
    }
    if (!form.designation?.trim()) {
      setFormError('Designation is required.')
      return
    }
    if (!form.username?.trim() || form.username.trim().length < 3) {
      setFormError('Login username is required (minimum 3 characters).')
      return
    }
    if (!form.password || form.password.length < 8) {
      setFormError('Login password is required (minimum 8 characters).')
      return
    }
    const result = await dispatch(createEmployee({
      firstName: form.firstName.trim(),
      lastName: (form.lastName || form.firstName).trim(),
      email: form.email.trim(),
      phone: form.phone || undefined,
      departmentId: form.departmentId,
      designation: form.designation.trim(),
      joiningDate: form.joiningDate,
      basicSalary: Number(form.basicSalary) || 0,
      employmentType: form.employmentType,
      gender: form.gender || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      username: form.username.trim(),
      password: form.password,
    }))
    if (createEmployee.rejected.match(result)) {
      setFormError(typeof result.payload === 'string' ? result.payload : 'Failed to create employee.')
      return
    }
    const payload = result.payload as { loginUsername?: string; initialPassword?: string }
    if (payload?.loginUsername && payload?.initialPassword) {
      setCreatedCredentials({ username: payload.loginUsername, password: payload.initialPassword })
    }
    setOpenDialog(false)
    setForm({
      firstName: '', lastName: '', email: '', phone: '', departmentId: '', designation: '',
      joiningDate: '', basicSalary: '', employmentType: 'FULL_TIME', gender: '', city: '', state: '',
      username: '', password: '',
    })
    dispatch(fetchEmployees({ page: 0, size: 10 }))
  }

  const openEdit = (emp: any) => {
    setEditingEmployee(emp)
    setEditForm({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      phone: emp.phone || '',
      departmentId: emp.departmentId ? String(emp.departmentId) : '',
      designation: emp.designation || '',
      basicSalary: emp.basicSalary != null ? String(emp.basicSalary) : '',
      city: emp.city || '',
      state: emp.state || '',
      gender: emp.gender || '',
    })
    setEditFormError('')
    setOpenEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editingEmployee) return
    setEditFormError('')
    if (!editForm.firstName?.trim() || !editForm.departmentId || !editForm.designation?.trim()) {
      setEditFormError('First name, department, and designation are required.')
      return
    }
    const result = await dispatch(updateEmployee({
      id: editingEmployee.id,
      data: {
        firstName: editForm.firstName.trim(),
        lastName: (editForm.lastName || editForm.firstName).trim(),
        email: editingEmployee.email,
        phone: editForm.phone || undefined,
        departmentId: editForm.departmentId,
        designation: editForm.designation.trim(),
        joiningDate: editingEmployee.joiningDate,
        basicSalary: Number(editForm.basicSalary) || 0,
        employmentType: editingEmployee.employmentType || 'FULL_TIME',
        gender: editForm.gender || undefined,
        city: editForm.city || undefined,
        state: editForm.state || undefined,
      },
    }))
    if (updateEmployee.rejected.match(result)) {
      setEditFormError(typeof result.payload === 'string' ? result.payload : 'Failed to update employee.')
      return
    }
    setOpenEditDialog(false)
    setEditingEmployee(null)
    dispatch(fetchEmployees({ page, size: 10, search: search || undefined, status: status || undefined }))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Employees</Typography>
          <Typography variant="body2" color="text.secondary">{total} total employees</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}
          disabled={!canCreate}
          sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
          Add Employee
        </Button>
      </Box>

      {createdCredentials && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setCreatedCredentials(null)}>
          Employee login created — share securely with the employee:
          <strong> Username:</strong> {createdCredentials.username}
          <strong> Temporary password:</strong> {createdCredentials.password}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Search employees..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ flex: 1, minWidth: 200 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(0) }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="TERMINATED">Terminated</MenuItem>
                <MenuItem value="ON_LEAVE">On Leave</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={() => dispatch(fetchEmployees({ page, size: 10 }))} color="primary">
              <Refresh />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer className="mobile-table-wrap">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Joining Date</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell></TableRow>
              ) : employees.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No employees found</Typography>
                </TableCell></TableRow>
              ) : employees.map((emp: any) => (
                <TableRow key={emp.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#1976d2', fontSize: 14 }}>
                        {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{emp.fullName || `${emp.firstName} ${emp.lastName}`}</Typography>
                        <Typography variant="caption" color="text.secondary">{emp.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Chip label={emp.employeeCode} size="small" variant="outlined" /></TableCell>
                  <TableCell>{emp.departmentName || '-'}</TableCell>
                  <TableCell>{emp.designation || '-'}</TableCell>
                  <TableCell>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>₹{Number(emp.basicSalary || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={emp.status} size="small" color={statusColors[emp.status] || 'default'} />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View">
                      <IconButton size="small" color="primary" onClick={() => navigate(`/employees/${emp.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canCreate && (
                      <Tooltip title="Edit">
                        <IconButton size="small" color="info" onClick={() => openEdit(emp)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {emp.status === 'ACTIVE' && (
                      <Tooltip title="Terminate">
                        <IconButton size="small" color="error"
                          onClick={() => api.patch(`/api/v1/employees/${emp.id}/terminate`).then(() => dispatch(fetchEmployees({ page, size: 10 })))}>
                          <PersonOff fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={Math.ceil(total / 10)} page={page + 1}
            onChange={(_, p) => setPage(p - 1)} color="primary" />
        </Box>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Employee</DialogTitle>
        <DialogContent>
          {formError && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>{formError}</Typography>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {[
              { label: 'First Name', key: 'firstName', required: true },
              { label: 'Last Name', key: 'lastName' },
              { label: 'Phone', key: 'phone' },
              { label: 'Designation', key: 'designation', required: true },
              { label: 'Basic Salary', key: 'basicSalary', type: 'number' },
              { label: 'City', key: 'city' },
              { label: 'State', key: 'state' },
            ].map(({ label, key, required, type }) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField fullWidth size="small" label={label} required={required} type={type || 'text'}
                  value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </Grid>
            ))}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Email" required type="email"
                value={form.email}
                onChange={(e) => {
                  const email = e.target.value
                  setForm((f) => ({
                    ...f,
                    email,
                    username: f.username || suggestUsername(email),
                  }))
                }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mt: 1 }}>
                Employee login credentials
              </Typography>
              <Typography variant="caption" color="text.secondary">
                The employee will use these to sign in on the login page.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Login Username" required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '') })}
                helperText="Min 3 characters (e.g. john.doe)" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Login Password" required type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                helperText="Min 8 characters — share securely with employee" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required error={Boolean(deptError)}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={form.departmentId}
                  label="Department"
                  disabled={deptLoading}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                >
                  {deptLoading && (
                    <MenuItem disabled value="">
                      <CircularProgress size={18} sx={{ mr: 1 }} /> Loading departments...
                    </MenuItem>
                  )}
                  {!deptLoading && departments.length === 0 && (
                    <MenuItem disabled value="">No departments found</MenuItem>
                  )}
                  {departments.map((d: any) => (
                    <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
                  ))}
                </Select>
                {deptError && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {deptError}{' '}
                    <Button size="small" onClick={loadDepartments}>Retry</Button>
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Joining Date" type="date" required
                value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Employment Type</InputLabel>
                <Select value={form.employmentType} label="Employment Type"
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                  <MenuItem value="FULL_TIME">Full Time</MenuItem>
                  <MenuItem value="PART_TIME">Part Time</MenuItem>
                  <MenuItem value="CONTRACT">Contract</MenuItem>
                  <MenuItem value="INTERN">Intern</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}
            sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
            Create Employee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Employee{editingEmployee ? ` — ${editingEmployee.fullName || editingEmployee.firstName}` : ''}
        </DialogTitle>
        <DialogContent>
          {editFormError && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>{editFormError}</Typography>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {[
              { label: 'First Name', key: 'firstName', required: true },
              { label: 'Last Name', key: 'lastName' },
              { label: 'Phone', key: 'phone' },
              { label: 'Designation', key: 'designation', required: true },
              { label: 'Basic Salary', key: 'basicSalary', type: 'number' },
              { label: 'City', key: 'city' },
              { label: 'State', key: 'state' },
            ].map(({ label, key, required, type }) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField fullWidth size="small" label={label} required={required} type={type || 'text'}
                  value={(editForm as any)[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} />
              </Grid>
            ))}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Email" value={editingEmployee?.email || ''} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Department</InputLabel>
                <Select
                  value={editForm.departmentId}
                  label="Department"
                  disabled={deptLoading}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                >
                  {departments.map((d: any) => (
                    <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}
            sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeesPage
