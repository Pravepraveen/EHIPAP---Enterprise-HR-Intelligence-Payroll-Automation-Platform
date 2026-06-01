import React from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, LinearProgress
} from '@mui/material'
import {
  AccessTime, EventAvailable, AccountBalanceWallet, TrendingUp,
  CalendarMonth, CheckCircle, Person
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import StatCard from '../../components/StatCard'

const EmployeeDashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const displayName = user?.username?.replace('.', ' ') || 'Employee'

  const leaveBalance = { annual: 12, used: 4, sick: 6, usedSick: 1 }
  const attendanceRate = 96
  const nextPayday = '30 May 2026'

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Person sx={{ color: '#10b981' }} />
          <Typography variant="overline" sx={{ color: '#10b981', fontWeight: 700 }}>
            Employee self-service
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'capitalize' }}>
          Hi, {displayName} 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your attendance, leave, and pay at a glance
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Attendance this month"
            value={`${attendanceRate}%`}
            subtitle="22 of 23 days present"
            icon={<AccessTime />}
            color="#10b981"
            trend={2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Annual leave left"
            value={leaveBalance.annual - leaveBalance.used}
            subtitle={`${leaveBalance.used} days used`}
            icon={<EventAvailable />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Next payday"
            value={nextPayday.split(' ')[0]}
            subtitle={nextPayday}
            icon={<AccountBalanceWallet />}
            color="#7c3aed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Performance"
            value="On track"
            subtitle="Q2 goals 75% complete"
            icon={<TrendingUp />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderLeft: '4px solid #10b981' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Leave balance
              </Typography>
              {[
                { label: 'Annual leave', total: leaveBalance.annual, used: leaveBalance.used, color: '#1976d2' },
                { label: 'Sick leave', total: leaveBalance.sick, used: leaveBalance.usedSick, color: '#10b981' },
              ].map((row) => (
                <Box key={row.label} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{row.label}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {row.total - row.used} / {row.total} days left
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(row.used / row.total) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: `${row.color}20`,
                      '& .MuiLinearProgress-bar': { bgcolor: row.color, borderRadius: 4 },
                    }}
                  />
                </Box>
              ))}
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 1, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                onClick={() => navigate('/leaves')}
              >
                Apply for leave
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth /> This week
              </Typography>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                <Box
                  key={day}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {day}
                  </Typography>
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: 16 }} />}
                    label={i === 4 ? 'Today' : 'Present'}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
              ))}
              <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/attendance')}>
                View full attendance
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                My shortcuts
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Request leave', path: '/leaves', color: '#10b981' },
                  { label: 'View payslips', path: '/payroll', color: '#7c3aed' },
                  { label: 'My performance', path: '/performance', color: '#1976d2' },
                  { label: 'Update profile', path: '/profile', color: '#64748b' },
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

export default EmployeeDashboard
