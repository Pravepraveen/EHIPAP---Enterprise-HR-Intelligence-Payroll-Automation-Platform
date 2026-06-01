import React, { useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Button, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Chip, IconButton, Divider, CircularProgress
} from '@mui/material'
import { CheckCircle, Info, Warning, Error, DoneAll, Delete } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchNotifications, markAllRead } from '../../features/analytics/notificationSlice'
import api from '../../api/axios'

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  SUCCESS: { icon: <CheckCircle />, color: '#10b981' },
  INFO: { icon: <Info />, color: '#1976d2' },
  WARNING: { icon: <Warning />, color: '#f59e0b' },
  ERROR: { icon: <Error />, color: '#ef4444' },
}

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const { notifications, loading } = useAppSelector(s => s.notification)

  useEffect(() => { dispatch(fetchNotifications()) }, [dispatch])

  const handleMarkRead = async (id: string) => {
    await api.patch(`/api/v1/notifications/${id}/read`)
    dispatch(fetchNotifications())
  }

  const handleDelete = async (id: string) => {
    await api.delete(`/api/v1/notifications/${id}`)
    dispatch(fetchNotifications())
  }

  const handleMarkAllRead = async () => {
    await dispatch(markAllRead())
    dispatch(fetchNotifications())
  }

  const unread = notifications.filter((n: any) => !n.read).length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {unread > 0 ? `${unread} unread notifications` : 'All caught up!'}
          </Typography>
        </Box>
        {unread > 0 && (
          <Button variant="outlined" startIcon={<DoneAll />} onClick={handleMarkAllRead}>
            Mark All Read
          </Button>
        )}
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No notifications</Typography>
              <Typography variant="body2" color="text.secondary">You're all caught up!</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((n: any, i: number) => {
                const config = typeConfig[n.type] || typeConfig.INFO
                return (
                  <React.Fragment key={n.id}>
                    <ListItem
                      sx={{
                        px: 3, py: 2,
                        bgcolor: n.read ? 'transparent' : '#f0f9ff',
                        '&:hover': { bgcolor: '#f8fafc' },
                        transition: 'background 0.2s'
                      }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {!n.read && (
                            <IconButton size="small" onClick={() => handleMarkRead(n.id)} title="Mark as read">
                              <CheckCircle fontSize="small" sx={{ color: '#10b981' }} />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={() => handleDelete(n.id)} title="Delete">
                            <Delete fontSize="small" sx={{ color: '#ef4444' }} />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${config.color}20`, color: config.color }}>
                          {config.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={n.read ? 400 : 700}>
                              {n.title}
                            </Typography>
                            {!n.read && (
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1976d2' }} />
                            )}
                            <Chip label={n.type} size="small"
                              sx={{ bgcolor: `${config.color}20`, color: config.color, height: 18, fontSize: 10 }} />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                              {n.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                )
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default NotificationsPage
