import React, { useCallback, useEffect, useState } from 'react'

import {

  Box, Grid, Card, CardContent, Typography, Button, Chip,

  List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider,

  CircularProgress, Alert, IconButton, Tooltip

} from '@mui/material'

import {

  People, AccessTime, Work, HowToReg, Groups, PendingActions,

  CheckCircle, Cancel, Refresh

} from '@mui/icons-material'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

import { useNavigate } from 'react-router-dom'

import api from '../../api/axios'

import { useAppSelector } from '../../app/hooks'

import StatCard from '../../components/StatCard'

import { ROLE_LABELS, normalizeRole } from '../../config/roles'



interface LeaveRow {

  id: string

  employeeId: string

  startDate: string

  endDate: string

  totalDays: number

  reason?: string

  status: string

}



const ManagerDashboard: React.FC = () => {

  const [analytics, setAnalytics] = useState<any>(null)

  const [pendingLeaves, setPendingLeaves] = useState<LeaveRow[]>([])

  const [loading, setLoading] = useState(true)

  const [leaveActionId, setLeaveActionId] = useState<string | null>(null)

  const [leaveMessage, setLeaveMessage] = useState('')

  const user = useAppSelector((state) => state.auth.user)

  const navigate = useNavigate()

  const role = normalizeRole(user?.role)



  const loadPendingLeaves = useCallback(async () => {

    try {

      const r = await api.get('/api/v1/leaves', { params: { status: 'PENDING' }, skipAuthRedirect: true })

      const list = Array.isArray(r.data) ? r.data : []

      setPendingLeaves(list)

      return list.length

    } catch {

      setPendingLeaves([])

      return 0

    }

  }, [])



  const fetchData = useCallback(async () => {

    setLoading(true)

    try {

      const [analyticsRes, pendingCount] = await Promise.all([

        api.get('/api/v1/analytics/dashboard', { skipAuthRedirect: true }).catch(() => null),

        loadPendingLeaves(),

      ])

      if (analyticsRes?.data) {

        setAnalytics({ ...analyticsRes.data, pendingLeaves: pendingCount })

      } else {

        setAnalytics({

          totalEmployees: 10,

          activeEmployees: 10,

          pendingLeaves: pendingCount,

          openJobs: 3,

          totalCandidates: 18,

          employeesByDepartment: [

            { name: 'Engineering', count: 4 },

            { name: 'HR', count: 2 },

            { name: 'Finance', count: 2 },

          ],

        })

      }

    } finally {

      setLoading(false)

    }

  }, [loadPendingLeaves])



  useEffect(() => {

    fetchData()

  }, [fetchData])



  const handleApprove = async (id: string) => {

    setLeaveActionId(id)

  try {

      await api.patch(`/api/v1/leaves/${id}/approve`)

      setLeaveMessage('Leave request approved.')

      const count = await loadPendingLeaves()

      setAnalytics((prev: any) => (prev ? { ...prev, pendingLeaves: count } : prev))

    } catch {

      setLeaveMessage('Failed to approve leave request.')

    } finally {

      setLeaveActionId(null)

    }

  }



  const handleReject = async (id: string) => {

    setLeaveActionId(id)

    try {

      await api.patch(`/api/v1/leaves/${id}/reject`, { reason: 'Rejected by manager' })

      setLeaveMessage('Leave request rejected.')

      const count = await loadPendingLeaves()

      setAnalytics((prev: any) => (prev ? { ...prev, pendingLeaves: count } : prev))

    } catch {

      setLeaveMessage('Failed to reject leave request.')

    } finally {

      setLeaveActionId(null)

    }

  }



  if (loading) {

    return (

      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>

        <CircularProgress />

      </Box>

    )

  }



  const deptChart = (analytics?.employeesByDepartment || []).map((d: any) => ({

    name: d.name?.split(' ')[0] || d.name,

    count: Number(d.count || 0),

  }))



  const pendingCount = pendingLeaves.length



  return (

    <Box>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

        <Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>

            <Groups sx={{ color: '#f59e0b' }} />

            <Typography variant="overline" sx={{ color: '#f59e0b', fontWeight: 700 }}>

              {ROLE_LABELS[role]} workspace

            </Typography>

          </Box>

          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>

            Team & HR operations

          </Typography>

          <Typography variant="body1" color="text.secondary">

            Approvals, hiring, and workforce metrics — {user?.username}

          </Typography>

        </Box>

        <Tooltip title="Refresh dashboard">

          <IconButton onClick={() => fetchData()} color="primary">

            <Refresh />

          </IconButton>

        </Tooltip>

      </Box>



      {leaveMessage && (

        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setLeaveMessage('')}>

          {leaveMessage}

        </Alert>

      )}



      <Grid container spacing={3} sx={{ mb: 3 }}>

        <Grid item xs={12} sm={6} md={3}>

          <StatCard

            title="Team size"

            value={analytics?.activeEmployees || 0}

            subtitle="Active employees"

            icon={<People />}

            color="#1976d2"

          />

        </Grid>

        <Grid item xs={12} sm={6} md={3}>

          <StatCard

            title="Pending approvals"

            value={pendingCount}

            subtitle="Leave requests"

            icon={<PendingActions />}

            color="#f59e0b"

          />

        </Grid>

        <Grid item xs={12} sm={6} md={3}>

          <StatCard

            title="Open roles"

            value={analytics?.openJobs || 0}

            subtitle={`${analytics?.totalCandidates || 0} applicants`}

            icon={<Work />}

            color="#7c3aed"

          />

        </Grid>

        <Grid item xs={12} sm={6} md={3}>

          <StatCard

            title="Attendance today"

            value="92%"

            subtitle="Team present"

            icon={<AccessTime />}

            color="#10b981"

            trend={1}

          />

        </Grid>

      </Grid>



      <Grid container spacing={3}>

        <Grid item xs={12} md={5}>

          <Card sx={{ borderLeft: '4px solid #f59e0b' }}>

            <CardContent sx={{ p: 3 }}>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>

                <HowToReg /> Pending leave approvals ({pendingCount})

              </Typography>

              {pendingCount === 0 ? (

                <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>

                  No pending leave requests.

                </Typography>

              ) : (

                <List disablePadding>

                  {pendingLeaves.slice(0, 8).map((item, i) => (

                    <React.Fragment key={item.id}>

                      <ListItem sx={{ px: 0, alignItems: 'flex-start', flexDirection: 'column' }}>

                        <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 1 }}>

                          <ListItemAvatar sx={{ minWidth: 40 }}>

                            <Avatar sx={{ bgcolor: '#f59e0b', width: 36, height: 36, fontSize: 14 }}>

                              {item.employeeId?.substring(0, 1).toUpperCase()}

                            </Avatar>

                          </ListItemAvatar>

                          <ListItemText

                            sx={{ flex: 1 }}

                            primary={`Employee ${item.employeeId?.substring(0, 8)}...`}

                            secondary={`${item.startDate} to ${item.endDate} · ${item.totalDays} day(s)${item.reason ? ` · ${item.reason}` : ''}`}

                          />

                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mt: 1, ml: 5 }}>

                          <Button

                            size="small"

                            color="success"

                            variant="outlined"

                            disabled={leaveActionId === item.id}

                            startIcon={leaveActionId === item.id ? <CircularProgress size={14} /> : <CheckCircle fontSize="small" />}

                            onClick={() => handleApprove(item.id)}

                          >

                            Approve

                          </Button>

                          <Button

                            size="small"

                            color="error"

                            variant="outlined"

                            disabled={leaveActionId === item.id}

                            startIcon={<Cancel fontSize="small" />}

                            onClick={() => handleReject(item.id)}

                          >

                            Reject

                          </Button>

                        </Box>

                      </ListItem>

                      {i < Math.min(pendingLeaves.length, 8) - 1 && <Divider />}

                    </React.Fragment>

                  ))}

                </List>

              )}

              <Button

                fullWidth

                variant="contained"

                sx={{ mt: 2, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}

                onClick={() => navigate('/leaves')}

              >

                Open leave management

              </Button>

            </CardContent>

          </Card>

        </Grid>



        <Grid item xs={12} md={7}>

          <Card>

            <CardContent sx={{ p: 3 }}>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>

                Headcount by department

              </Typography>

              <ResponsiveContainer width="100%" height={260}>

                <BarChart data={deptChart}>

                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />

                  <YAxis allowDecimals={false} />

                  <RechartsTooltip />

                  <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />

                </BarChart>

              </ResponsiveContainer>

            </CardContent>

          </Card>

        </Grid>



        <Grid item xs={12}>

          <Card>

            <CardContent sx={{ p: 3 }}>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>

                Manager quick links

              </Typography>

              <Grid container spacing={2}>

                {[

                  { label: 'Add / edit employees', path: '/employees', color: '#1976d2' },

                  { label: 'Post a job', path: '/recruitment', color: '#7c3aed' },

                  { label: 'Attendance report', path: '/attendance', color: '#10b981' },

                  { label: 'Performance reviews', path: '/performance', color: '#6366f1' },

                ].map((link) => (

                  <Grid item xs={12} sm={6} md={3} key={link.label}>

                    <Button

                      fullWidth

                      variant="outlined"

                      onClick={() => navigate(link.path)}

                      sx={{ py: 2, borderColor: `${link.color}50`, color: link.color }}

                    >

                      {link.label}

                    </Button>

                  </Grid>

                ))}

              </Grid>

            </CardContent>

          </Card>

        </Grid>

      </Grid>

    </Box>

  )

}



export default ManagerDashboard

