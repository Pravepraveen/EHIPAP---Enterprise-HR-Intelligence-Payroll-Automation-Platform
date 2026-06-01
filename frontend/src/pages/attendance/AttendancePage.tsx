import React, { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button, Grid, CircularProgress
} from '@mui/material'
import { CheckCircle, Cancel, AccessTime } from '@mui/icons-material'
import api from '../../api/axios'

const statusColors: Record<string, any> = {
  PRESENT: 'success', ABSENT: 'error', HALF_DAY: 'warning', LATE: 'info'
}

const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 })

  useEffect(() => {
    const today = new Date()
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const to = today.toISOString().split('T')[0]
    api.get(`/api/v1/attendance?from=${from}&to=${to}`)
      .then(r => {
        setAttendance(r.data.slice(0, 50))
        const present = r.data.filter((a: any) => a.status === 'PRESENT').length
        const absent = r.data.filter((a: any) => a.status === 'ABSENT').length
        setStats({ present, absent, total: r.data.length })
      })
      .catch(() => setAttendance([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>Attendance</Typography>
        <Typography variant="body2" color="text.secondary">Track employee attendance records</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Present Today', value: stats.present, icon: <CheckCircle />, color: '#10b981' },
          { label: 'Absent Today', value: stats.absent, icon: <Cancel />, color: '#ef4444' },
          { label: 'Total Records', value: stats.total, icon: <AccessTime />, color: '#1976d2' },
        ].map(({ label, value, icon, color }) => (
          <Grid item xs={12} sm={4} key={label}>
            <Card className="stat-card">
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color, '& svg': { fontSize: 36 } }}>{icon}</Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" fontWeight={700}>Attendance Records (This Month)</Typography>
          </Box>
          <TableContainer className="mobile-table-wrap">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Work Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
                ) : attendance.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No attendance records found</Typography>
                  </TableCell></TableRow>
                ) : attendance.map((a: any) => (
                  <TableRow key={a.id} hover>
                    <TableCell><Typography variant="caption">{a.employeeId?.substring(0, 8)}...</Typography></TableCell>
                    <TableCell>{a.attendanceDate ? new Date(a.attendanceDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{a.workHours ? `${Number(a.workHours).toFixed(1)}h` : '-'}</TableCell>
                    <TableCell><Chip label={a.status} size="small" color={statusColors[a.status] || 'default'} /></TableCell>
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

export default AttendancePage
