import React, { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Divider, Badge
} from '@mui/material'
import { Add, Work, People, TrendingUp, Visibility, Edit, DragIndicator } from '@mui/icons-material'
import api from '../../api/axios'

const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']
const stageColors: Record<string, string> = {
  APPLIED: '#64748b', SCREENING: '#1976d2', INTERVIEW: '#7c3aed',
  OFFER: '#f59e0b', HIRED: '#10b981', REJECTED: '#ef4444'
}

const RecruitmentPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'jobs' | 'kanban'>('jobs')
  const [openJobDialog, setOpenJobDialog] = useState(false)
  const [openCandDialog, setOpenCandDialog] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [jobForm, setJobForm] = useState({
    title: '', description: '', requirements: '', location: '',
    employmentType: 'FULL_TIME', experienceMin: 0, experienceMax: 5,
    salaryMin: '', salaryMax: '', openings: 1, closingDate: ''
  })
  const [candForm, setCandForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    currentCompany: '', currentDesignation: '', experienceYears: '',
    currentSalary: '', expectedSalary: '', jobPostingId: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [jobsRes, candsRes] = await Promise.all([
        api.get('/api/v1/jobs'),
        api.get('/api/v1/candidates')
      ])
      setJobs(jobsRes.data)
      setCandidates(candsRes.data)
    } catch { setJobs([]); setCandidates([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreateJob = async () => {
    try {
      await api.post('/api/v1/jobs', {
        ...jobForm,
        salaryMin: Number(jobForm.salaryMin) || null,
        salaryMax: Number(jobForm.salaryMax) || null,
        status: 'OPEN'
      })
      setOpenJobDialog(false)
      fetchData()
    } catch {}
  }

  const handleCreateCandidate = async () => {
    try {
      await api.post('/api/v1/candidates', {
        ...candForm,
        experienceYears: Number(candForm.experienceYears) || 0,
        currentSalary: Number(candForm.currentSalary) || null,
        expectedSalary: Number(candForm.expectedSalary) || null,
        stage: 'APPLIED'
      })
      setOpenCandDialog(false)
      fetchData()
    } catch {}
  }

  const moveStage = async (candidateId: string, newStage: string) => {
    try {
      await api.patch(`/api/v1/candidates/${candidateId}/stage`, { stage: newStage })
      fetchData()
    } catch {}
  }

  const openJobs = jobs.filter(j => j.status === 'OPEN').length
  const totalCandidates = candidates.length
  const inInterview = candidates.filter(c => c.stage === 'INTERVIEW').length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Recruitment ATS</Typography>
          <Typography variant="body2" color="text.secondary">Applicant Tracking System</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant={view === 'jobs' ? 'contained' : 'outlined'} onClick={() => setView('jobs')}>Jobs</Button>
          <Button variant={view === 'kanban' ? 'contained' : 'outlined'} onClick={() => setView('kanban')}>Kanban</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenJobDialog(true)}
            sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
            Post Job
          </Button>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setOpenCandDialog(true)}>
            Add Candidate
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Open Positions', value: openJobs, icon: <Work />, color: '#1976d2' },
          { label: 'Total Candidates', value: totalCandidates, icon: <People />, color: '#7c3aed' },
          { label: 'In Interview', value: inInterview, icon: <TrendingUp />, color: '#10b981' },
          { label: 'Offers Extended', value: candidates.filter(c => c.stage === 'OFFER').length, icon: <Work />, color: '#f59e0b' },
        ].map(({ label, value, icon, color }) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Card className="stat-card">
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${color}20`, color }}>{icon}</Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {view === 'jobs' ? (
        /* Jobs Table */
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight={700}>Job Postings</Typography>
            </Box>
            <TableContainer className="mobile-table-wrap">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Experience</TableCell>
                    <TableCell>Salary Range</TableCell>
                    <TableCell>Openings</TableCell>
                    <TableCell>Candidates</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
                  ) : jobs.map((job: any) => (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{job.title}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                          {job.description?.substring(0, 60)}...
                        </Typography>
                      </TableCell>
                      <TableCell>{job.location || '-'}</TableCell>
                      <TableCell><Chip label={job.employmentType} size="small" variant="outlined" /></TableCell>
                      <TableCell>{job.experienceMin}-{job.experienceMax} yrs</TableCell>
                      <TableCell>
                        {job.salaryMin && job.salaryMax
                          ? `₹${(job.salaryMin/100000).toFixed(1)}L - ₹${(job.salaryMax/100000).toFixed(1)}L`
                          : '-'}
                      </TableCell>
                      <TableCell>{job.openings}</TableCell>
                      <TableCell>
                        <Badge badgeContent={candidates.filter(c => c.jobPostingId === job.id).length} color="primary">
                          <People fontSize="small" />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Chip label={job.status} size="small"
                          color={job.status === 'OPEN' ? 'success' : job.status === 'CLOSED' ? 'error' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Candidates">
                          <IconButton size="small" color="primary" onClick={() => { setSelectedJob(job); setView('kanban') }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        /* Kanban Board */
        <Box>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              Candidate Pipeline {selectedJob ? `— ${selectedJob.title}` : '(All Jobs)'}
            </Typography>
            {selectedJob && (
              <Button size="small" onClick={() => setSelectedJob(null)}>Show All</Button>
            )}
          </Box>
          <Box className="mobile-scroll-x" sx={{ display: 'flex', gap: 2, pb: 2 }}>
            {STAGES.map(stage => {
              const stageCandidates = candidates.filter(c =>
                c.stage === stage && (!selectedJob || c.jobPostingId === selectedJob.id)
              )
              return (
                <Box key={stage} sx={{ minWidth: 240, flex: '0 0 240px' }}>
                  <Box sx={{
                    p: 1.5, borderRadius: '8px 8px 0 0',
                    bgcolor: stageColors[stage], color: 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <Typography variant="subtitle2" fontWeight={700}>{stage}</Typography>
                    <Chip label={stageCandidates.length} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', height: 20, fontSize: 11 }} />
                  </Box>
                  <Box sx={{
                    bgcolor: '#f8fafc', borderRadius: '0 0 8px 8px',
                    border: '1px solid #e2e8f0', borderTop: 'none',
                    minHeight: 400, p: 1, display: 'flex', flexDirection: 'column', gap: 1
                  }}>
                    {stageCandidates.map((c: any) => (
                      <Card key={c.id} sx={{ cursor: 'grab', '&:hover': { boxShadow: 3 } }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: stageColors[stage] }}>
                              {c.firstName?.charAt(0)}{c.lastName?.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" fontWeight={700} noWrap>
                                {c.firstName} {c.lastName}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {c.currentDesignation || 'N/A'} @ {c.currentCompany || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {c.experienceYears} yrs exp
                          </Typography>
                          {c.expectedSalary && (
                            <Typography variant="caption" color="primary" display="block">
                              Exp: ₹{(c.expectedSalary/100000).toFixed(1)}L
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                            {STAGES.filter(s => s !== stage && s !== 'REJECTED').slice(0, 2).map(s => (
                              <Button key={s} size="small" variant="outlined"
                                sx={{ fontSize: 9, py: 0, px: 0.5, minWidth: 0, height: 20 }}
                                onClick={() => moveStage(c.id, s)}>
                                → {s.substring(0, 4)}
                              </Button>
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                    {stageCandidates.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                        <Typography variant="caption">No candidates</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Create Job Dialog */}
      <Dialog open={openJobDialog} onClose={() => setOpenJobDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>Post New Job</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth size="small" label="Job Title" required value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={3} value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Requirements" multiline rows={2} value={jobForm.requirements} onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Location" value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Employment Type</InputLabel>
                <Select value={jobForm.employmentType} label="Employment Type" onChange={e => setJobForm({ ...jobForm, employmentType: e.target.value })}>
                  {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Min Exp (yrs)" type="number" value={jobForm.experienceMin} onChange={e => setJobForm({ ...jobForm, experienceMin: Number(e.target.value) })} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Max Exp (yrs)" type="number" value={jobForm.experienceMax} onChange={e => setJobForm({ ...jobForm, experienceMax: Number(e.target.value) })} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Min Salary (₹)" type="number" value={jobForm.salaryMin} onChange={e => setJobForm({ ...jobForm, salaryMin: e.target.value })} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Max Salary (₹)" type="number" value={jobForm.salaryMax} onChange={e => setJobForm({ ...jobForm, salaryMax: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Openings" type="number" value={jobForm.openings} onChange={e => setJobForm({ ...jobForm, openings: Number(e.target.value) })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Closing Date" type="date" value={jobForm.closingDate} onChange={e => setJobForm({ ...jobForm, closingDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenJobDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateJob} sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>Post Job</Button>
        </DialogActions>
      </Dialog>

      {/* Add Candidate Dialog */}
      <Dialog open={openCandDialog} onClose={() => setOpenCandDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add Candidate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth size="small" label="First Name" required value={candForm.firstName} onChange={e => setCandForm({ ...candForm, firstName: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Last Name" required value={candForm.lastName} onChange={e => setCandForm({ ...candForm, lastName: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Email" required type="email" value={candForm.email} onChange={e => setCandForm({ ...candForm, email: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Phone" value={candForm.phone} onChange={e => setCandForm({ ...candForm, phone: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Current Company" value={candForm.currentCompany} onChange={e => setCandForm({ ...candForm, currentCompany: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Current Designation" value={candForm.currentDesignation} onChange={e => setCandForm({ ...candForm, currentDesignation: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Experience (yrs)" type="number" value={candForm.experienceYears} onChange={e => setCandForm({ ...candForm, experienceYears: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Current Salary" type="number" value={candForm.currentSalary} onChange={e => setCandForm({ ...candForm, currentSalary: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Expected Salary" type="number" value={candForm.expectedSalary} onChange={e => setCandForm({ ...candForm, expectedSalary: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Job Posting</InputLabel>
                <Select value={candForm.jobPostingId} label="Job Posting" onChange={e => setCandForm({ ...candForm, jobPostingId: e.target.value })}>
                  {jobs.map((j: any) => <MenuItem key={j.id} value={j.id}>{j.title}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCandDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCandidate} sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>Add Candidate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RecruitmentPage
