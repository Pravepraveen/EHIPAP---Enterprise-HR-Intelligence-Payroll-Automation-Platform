import React, { useEffect, useState } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Button,
  List, ListItem, ListItemText, ListItemAvatar,
  Divider, CircularProgress
} from '@mui/material'
import {
  People, AttachMoney, AccessTime, Work, TrendingUp,
  CheckCircle, Warning, Info, AdminPanelSettings
} from '@mui/icons-material'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAppSelector } from '../../app/hooks'
import StatCard from '../../components/StatCard'
import { ROLE_LABELS, normalizeRole } from '../../config/roles'

const COLORS = ['#1976d2', '#7c3aed', '#10b981', '#f59e0b', '#ef4444']

const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const user = useAppSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const role = normalizeRole(user?.role)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/api/v1/analytics/dashboard', { skipAuthRedirect: true })
        setAnalytics(response.data)
      } catch {
        setAnalytics({
          totalEmployees: 10,
          activeEmployees: 10,
          openJobs: 4,
          totalCandidates: 25,
          pendingLeaves: 3,
          employeesByDepartment: [
            { name: 'Engineering', count: 4 },
            { name: 'Human Resources', count: 2 },
            { name: 'Finance', count: 2 },
          ],
          payrollTrend: [
            { month: 4, year: 2025, total_net: 671440 },
            { month: 3, year: 2025, total_net: 650000 },
          ],
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={48} />
      </Box>
    )
  }

  const payrollChartData = (analytics?.payrollTrend || []).map((p: any) => ({
    name: `${p.month}/${p.year}`,
    amount: Number(p.total_net || 0),
  }))

  const deptData = (analytics?.employeesByDepartment || []).map((d: any) => ({
    name: d.name,
    value: Number(d.count || 0),
  }))

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AdminPanelSettings sx={{ color: '#ef4444' }} />
            <Typography variant="overline" sx={{ color: '#ef4444', fontWeight: 700 }}>
              {ROLE_LABELS[role]} Console
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Organization overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Full system control — {user?.username}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={analytics?.totalEmployees || 0}
            subtitle={`${analytics?.activeEmployees || 0} active`}
            icon={<People />}
            color="#1976d2"
            trend={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Payroll"
            value={`₹${((analytics?.payrollTrend?.[0]?.total_net || 671440) / 100000).toFixed(1)}L`}
            subtitle="Latest run"
            icon={<AttachMoney />}
            color="#10b981"
            trend={2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Positions"
            value={analytics?.openJobs || 0}
            subtitle={`${analytics?.totalCandidates || 0} candidates`}
            icon={<Work />}
            color="#7c3aed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Leaves"
            value={analytics?.pendingLeaves || 0}
            subtitle="Needs action"
            icon={<AccessTime />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Payroll trend (org-wide)
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={payrollChartData}>
                  <defs>
                    <linearGradient id="adminPayroll" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: number) => [`₹${Number(v).toLocaleString()}`, 'Net']} />
                  <Area type="monotone" dataKey="amount" stroke="#1976d2" strokeWidth={2} fill="url(#adminPayroll)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Headcount by department
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {deptData.map((_: unknown, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Admin actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Manage all employees', color: '#1976d2', path: '/employees' },
                  { label: 'Run payroll', color: '#10b981', path: '/payroll' },
                  { label: 'System analytics', color: '#7c3aed', path: '/analytics' },
                  { label: 'Platform settings', color: '#64748b', path: '/settings' },
                ].map((action) => (
                  <Button
                    key={action.label}
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate(action.path)}
                    sx={{ justifyContent: 'flex-start', borderColor: `${action.color}40`, color: action.color }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                System activity
              </Typography>
              <List disablePadding>
                {[
                  { icon: <CheckCircle sx={{ color: '#10b981' }} />, text: 'Payroll batch processed', time: '2h ago' },
                  { icon: <Warning sx={{ color: '#f59e0b' }} />, text: `${analytics?.pendingLeaves || 0} leave requests pending`, time: 'Today' },
                  { icon: <Info sx={{ color: '#1976d2' }} />, text: 'New candidates in pipeline', time: '4h ago' },
                  { icon: <TrendingUp sx={{ color: '#7c3aed' }} />, text: 'Performance cycle Q1 closed', time: '2d ago' },
                ].map((item, i, arr) => (
                  <React.Fragment key={i}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>{item.icon}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={item.text} secondary={item.time} />
                    </ListItem>
                    {i < arr.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdminDashboard
