import React, { useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Avatar, Divider, Alert, Chip, IconButton
} from '@mui/material'
import { Edit, Save, Lock, Person } from '@mui/icons-material'
import { useAppSelector } from '../../app/hooks'

const ProfilePage: React.FC = () => {
  const user = useAppSelector(s => s.auth.user)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    firstName: user?.username?.split('.')[0] || 'User',
    lastName: user?.username?.split('.')[1] || '',
    email: user?.email || '',
    phone: '+91-9000000001',
    department: 'Human Resources',
    designation: 'System Administrator',
    location: 'Bangalore, India',
    bio: 'Enterprise HR Platform Administrator',
  })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [pwError, setPwError] = useState('')

  const handleSave = () => {
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordChange = () => {
    if (passwords.newPass !== passwords.confirm) {
      setPwError('Passwords do not match')
      return
    }
    if (passwords.newPass.length < 8) {
      setPwError('Password must be at least 8 characters')
      return
    }
    setPwError('')
    setPasswords({ current: '', newPass: '', confirm: '' })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0) || ''}`.toUpperCase()

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>My Profile</Typography>
        <Typography variant="body2" color="text.secondary">Manage your personal information</Typography>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Profile updated successfully!</Alert>}

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar sx={{
                  width: 96, height: 96, fontSize: 32, fontWeight: 700,
                  background: 'linear-gradient(135deg, #1976d2, #7c3aed)',
                  mx: 'auto'
                }}>
                  {initials}
                </Avatar>
                <IconButton size="small" sx={{
                  position: 'absolute', bottom: 0, right: 0,
                  bgcolor: 'white', border: '2px solid #e2e8f0',
                  '&:hover': { bgcolor: '#f8fafc' }
                }}>
                  <Edit fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h6" fontWeight={700}>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {profile.designation}
              </Typography>
              <Chip
                label={user?.role?.replace('_', ' ')}
                color="primary" size="small" sx={{ mb: 2 }}
              />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                {[
                  { label: 'Email', value: profile.email },
                  { label: 'Phone', value: profile.phone },
                  { label: 'Department', value: profile.department },
                  { label: 'Location', value: profile.location },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Profile */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  <Typography variant="h6" fontWeight={700}>Personal Information</Typography>
                </Box>
                <Button
                  variant={editing ? 'contained' : 'outlined'}
                  startIcon={editing ? <Save /> : <Edit />}
                  onClick={editing ? handleSave : () => setEditing(true)}
                  size="small"
                  sx={editing ? { background: 'linear-gradient(135deg, #1976d2, #7c3aed)' } : {}}
                >
                  {editing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="First Name" value={profile.firstName}
                    disabled={!editing}
                    onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Last Name" value={profile.lastName}
                    disabled={!editing}
                    onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Email" value={profile.email}
                    disabled={!editing} type="email"
                    onChange={e => setProfile({ ...profile, email: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Phone" value={profile.phone}
                    disabled={!editing}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Department" value={profile.department}
                    disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Designation" value={profile.designation}
                    disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Location" value={profile.location}
                    disabled={!editing}
                    onChange={e => setProfile({ ...profile, location: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Bio" value={profile.bio}
                    disabled={!editing} multiline rows={2}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Lock color="primary" />
                <Typography variant="h6" fontWeight={700}>Change Password</Typography>
              </Box>
              {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Current Password" type="password"
                    value={passwords.current}
                    onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="New Password" type="password"
                    value={passwords.newPass}
                    onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Confirm New Password" type="password"
                    value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handlePasswordChange}
                    sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)' }}>
                    Update Password
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProfilePage
