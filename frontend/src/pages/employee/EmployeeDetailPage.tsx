import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Avatar, Chip, Grid, Button, Divider, CircularProgress } from '@mui/material'
import { ArrowBack, Email, Phone, Business, CalendarToday, AttachMoney } from '@mui/icons-material'
import api from '../../api/axios'

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api.get(`/api/v1/employees/${id}`)
        .then(r => setEmployee(r.data))
        .catch(() => navigate('/employees'))
        .finally(() => setLoading(false))
    }
  }, [id, navigate])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
  if (!employee) return null

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/employees')} sx={{ mb: 2 }}>
        Back to Employees
      </Button>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#1976d2', fontSize: 28, mx: 'auto', mb: 2 }}>
                {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
              </Avatar>
              <Typography variant="h5" fontWeight={700}>{employee.fullName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{employee.designation}</Typography>
              <Chip label={employee.status} color={employee.status === 'ACTIVE' ? 'success' : 'error'} sx={{ mb: 2 }} />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                {[
                  { icon: <Email fontSize="small" />, label: employee.email },
                  { icon: <Phone fontSize="small" />, label: employee.phone || 'N/A' },
                  { icon: <Business fontSize="small" />, label: employee.departmentName || 'N/A' },
                  { icon: <CalendarToday fontSize="small" />, label: `Joined: ${employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}` },
                  { icon: <AttachMoney fontSize="small" />, label: `₹${Number(employee.basicSalary || 0).toLocaleString()}/month` },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: '#64748b' }}>
                    {item.icon}
                    <Typography variant="body2">{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Employee Details</Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Employee Code', value: employee.employeeCode },
                  { label: 'Employment Type', value: employee.employmentType },
                  { label: 'Gender', value: employee.gender || 'N/A' },
                  { label: 'City', value: employee.city || 'N/A' },
                  { label: 'State', value: employee.state || 'N/A' },
                  { label: 'Country', value: employee.country || 'India' },
                  { label: 'PAN Number', value: employee.panNumber || 'N/A' },
                  { label: 'Bank Account', value: employee.bankAccount || 'N/A' },
                  { label: 'Bank Name', value: employee.bankName || 'N/A' },
                  { label: 'IFSC Code', value: employee.ifscCode || 'N/A' },
                ].map(({ label, value }) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{value}</Typography>
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

export default EmployeeDetailPage
