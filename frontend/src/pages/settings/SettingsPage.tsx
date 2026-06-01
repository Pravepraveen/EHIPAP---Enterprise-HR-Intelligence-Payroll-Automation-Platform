import React, { useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Switch, FormControlLabel, Divider, Alert, Chip, List, ListItem,
  ListItemText, ListItemSecondaryAction, Avatar
} from '@mui/material'
import { Save, Security, Notifications, Palette, Business } from '@mui/icons-material'
import { useAppSelector } from '../../app/hooks'

const SettingsPage: React.FC = () => {
  const user = useAppSelector(s => s.auth.user)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    leaveApprovalAlert: true,
    payrollAlert: true,
    performanceAlert: false,
    twoFactorAuth: false,
    sessionTimeout: '30',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggle = (key: keyof typeof settings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>Settings</Typography>
        <Typography variant="body2" color="text.secondary">Manage your account and application preferences</Typography>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved successfully!</Alert>}

      <Grid container spacing={3}>
        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Notifications color="primary" />
                <Typography variant="h6" fontWeight={700}>Notifications</Typography>
              </Box>
              <List disablePadding>
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                  { key: 'leaveApprovalAlert', label: 'Leave Approval Alerts', desc: 'When leave is approved/rejected' },
                  { key: 'payrollAlert', label: 'Payroll Alerts', desc: 'When payslip is generated' },
                  { key: 'performanceAlert', label: 'Performance Alerts', desc: 'Review reminders' },
                ].map(({ key, label, desc }) => (
                  <ListItem key={key} disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={500}>{label}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary">{desc}</Typography>}
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings[key as keyof typeof settings] as boolean}
                        onChange={() => toggle(key as keyof typeof settings)}
                        color="primary" size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Security color="primary" />
                <Typography variant="h6" fontWeight={700}>Security</Typography>
              </Box>
              <List disablePadding>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={500}>Two-Factor Authentication</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">Add extra security to your account</Typography>}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onChange={() => toggle('twoFactorAuth')}
                      color="primary" size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              <Divider sx={{ my: 2 }} />
              <TextField
                fullWidth size="small" label="Session Timeout (minutes)"
                type="number" value={settings.sessionTimeout}
                onChange={e => setSettings({ ...settings, sessionTimeout: e.target.value })}
                sx={{ mb: 2 }}
              />
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Current Session</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">User</Typography>
                  <Typography variant="caption" fontWeight={600}>{user?.username}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Role</Typography>
                  <Chip label={user?.role} size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Regional Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Palette color="primary" />
                <Typography variant="h6" fontWeight={700}>Regional & Display</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Date Format" value={settings.dateFormat}
                    onChange={e => setSettings({ ...settings, dateFormat: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Currency" value={settings.currency}
                    onChange={e => setSettings({ ...settings, currency: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Timezone" value={settings.timezone}
                    onChange={e => setSettings({ ...settings, timezone: e.target.value })} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* System Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Business color="primary" />
                <Typography variant="h6" fontWeight={700}>System Information</Typography>
              </Box>
              {[
                { label: 'Platform', value: 'EHIPAP v1.0.0' },
                { label: 'Backend', value: 'Spring Boot 3.3 / Java 21' },
                { label: 'Frontend', value: 'React 18 / TypeScript' },
                { label: 'Database', value: 'PostgreSQL 16' },
                { label: 'Cache', value: 'Redis 7' },
                { label: 'Message Broker', value: 'Apache Kafka' },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<Save />} onClick={handleSave}
              sx={{ background: 'linear-gradient(135deg, #1976d2, #7c3aed)', px: 4 }}>
              Save Settings
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SettingsPage
