import React, { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Rating, LinearProgress, CircularProgress, Divider
} from '@mui/material'
import { Add, TrendingUp, Star, CheckCircle } from '@mui/icons-material'
import api from '../../api/axios'

const statusColors: Record<string, any> = {
  PENDING: 'warning', IN_PROGRESS: 'info', SUBMITTED: 'primary', COMPLETED: 'success'
}

const PerformancePage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [form, setForm] = useState({
    selfRating: 0, managerRating: 0, strengths: '',
    improvements: '', comments: '', goalsAchieved: 0, totalGoals: 5
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [revRes, cycRes] = await Promise.all([
        api.get('/api/v1/performance/reviews'),
        api.get('/api/v1/performance/cycles')
      ])
      setReviews(revRes.data)
      setCycles(cycRes.data)
    } catch { setReviews([]); setCycles([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleUpdate = async () => {
    if (!selectedReview) return
    try {
      await api.put(`/api/v1/performance/reviews/${selectedReview.id}`, {
        ...form, status: 'SUBMITTED'
      })
      setOpenDialog(false)
      fetchData()
    } catch {}
  }

  const openReview = (review: any) => {
    setSelectedReview(review)
    setForm({
      selfRating: review.selfRating || 0,
      managerRating: review.managerRating || 0,
      strengths: review.strengths || '',
      improvements: review.improvements || '',
      comments: review.comments || '',
      goalsAchieved: review.goalsAchieved || 0,
      totalGoals: review.totalGoals || 5
    })
    setOpenDialog(true)
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.finalRating || r.managerRating || 0), 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Performance Management</Typography>
          <Typography variant="body2" color="text.secondary">Track and manage employee performance reviews</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}
          sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}
          onClick={() => api.post('/api/v1/performance/reviews', {
            employeeId: '20000000-0000-0000-0000-000000000003',
            cycleId: cycles[0]?.id,
            status: 'PENDING', totalGoals: 5
          }).then(fetchData)}>
          Create Review
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Total Reviews', value: reviews.length, color: '#1976d2' },
          { label: 'Pending', value: reviews.filter(r => r.status === 'PENDING').length, color: '#f59e0b' },
          { label: 'Completed', value: reviews.filter(r => r.status === 'COMPLETED' || r.status === 'SUBMITTED').length, color: '#10b981' },
          { label: 'Avg Rating', value: `${avgRating}/5`, color: '#7c3aed' },
        ].map(({ label, value, color }) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Card className="stat-card">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Active Cycles */}
      {cycles.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Performance Cycles</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {cycles.map((cycle: any) => (
                <Box key={cycle.id} sx={{
                  p: 2, borderRadius: 2, border: '1px solid #e2e8f0',
                  minWidth: 200, bgcolor: cycle.status === 'ACTIVE' ? '#f0f9ff' : '#f8fafc'
                }}>
                  <Typography variant="subtitle2" fontWeight={700}>{cycle.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {cycle.startDate} → {cycle.endDate}
                  </Typography>
                  <Chip label={cycle.status} size="small"
                    color={cycle.status === 'ACTIVE' ? 'success' : 'default'} sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Reviews Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" fontWeight={700}>Performance Reviews</Typography>
          </Box>
          <TableContainer className="mobile-table-wrap">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Cycle</TableCell>
                  <TableCell>Self Rating</TableCell>
                  <TableCell>Manager Rating</TableCell>
                  <TableCell>Final Rating</TableCell>
                  <TableCell>Goals</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No reviews found. Create one to get started.</Typography>
                  </TableCell></TableRow>
                ) : reviews.map((r: any) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: 12 }}>E</Avatar>
                        <Typography variant="caption">{r.employeeId?.substring(0, 8)}...</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="caption">{r.cycleId?.substring(0, 8)}...</Typography></TableCell>
                    <TableCell>
                      {r.selfRating ? <Rating value={r.selfRating} readOnly size="small" precision={0.5} /> : '-'}
                    </TableCell>
                    <TableCell>
                      {r.managerRating ? <Rating value={r.managerRating} readOnly size="small" precision={0.5} /> : '-'}
                    </TableCell>
                    <TableCell>
                      {r.finalRating ? (
                        <Chip icon={<Star fontSize="small" />} label={r.finalRating}
                          size="small" color="warning" />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate"
                          value={r.totalGoals > 0 ? (r.goalsAchieved / r.totalGoals) * 100 : 0}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                        <Typography variant="caption">{r.goalsAchieved}/{r.totalGoals}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={r.status} size="small" color={statusColors[r.status] || 'default'} /></TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => openReview(r)}>
                        {r.status === 'PENDING' ? 'Fill Review' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Performance Review</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Self Rating</Typography>
              <Rating value={form.selfRating} onChange={(_, v) => setForm({ ...form, selfRating: v || 0 })}
                size="large" precision={0.5} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Manager Rating</Typography>
              <Rating value={form.managerRating} onChange={(_, v) => setForm({ ...form, managerRating: v || 0 })}
                size="large" precision={0.5} />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Goals Achieved" type="number"
                  value={form.goalsAchieved} onChange={e => setForm({ ...form, goalsAchieved: Number(e.target.value) })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Total Goals" type="number"
                  value={form.totalGoals} onChange={e => setForm({ ...form, totalGoals: Number(e.target.value) })} />
              </Grid>
            </Grid>
            <TextField fullWidth size="small" label="Strengths" multiline rows={2}
              value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} />
            <TextField fullWidth size="small" label="Areas for Improvement" multiline rows={2}
              value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} />
            <TextField fullWidth size="small" label="Comments" multiline rows={2}
              value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}
            sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PerformancePage
