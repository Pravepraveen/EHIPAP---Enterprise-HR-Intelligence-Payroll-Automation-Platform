import React, { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Badge, Tooltip,
  Divider, useTheme, useMediaQuery, Menu, MenuItem, Chip, Button, CircularProgress
} from '@mui/material'
import {
  Dashboard, People, AttachMoney, AccessTime, Work, TrendingUp,
  Analytics, Notifications, Settings, Menu as MenuIcon, ChevronLeft,
  Logout, Person, EventNote, DoneAll
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import { fetchNotifications, markAllRead } from '../features/analytics/notificationSlice'
import { canAccessRoute, canProcessPayroll, ROLE_LABELS, normalizeRole } from '../config/roles'

const DRAWER_WIDTH = 260

const allNavItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Employees', icon: <People />, path: '/employees' },
  { label: 'Payroll', icon: <AttachMoney />, path: '/payroll' },
  { label: 'Attendance', icon: <AccessTime />, path: '/attendance' },
  { label: 'Leave', icon: <EventNote />, path: '/leaves' },
  { label: 'Recruitment', icon: <Work />, path: '/recruitment' },
  { label: 'Performance', icon: <TrendingUp />, path: '/performance' },
  { label: 'Analytics', icon: <Analytics />, path: '/analytics' },
  { label: 'Notifications', icon: <Notifications />, path: '/notifications' },
]

const bottomItems = [
  { label: 'Settings', icon: <Settings />, path: '/settings' },
]

const MainLayout: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(!isMobile)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const user = useAppSelector(state => state.auth.user)
  const notifications = useAppSelector(state => state.notification.notifications)
  const unreadCount = useAppSelector(state => state.notification.unreadCount)
  const notificationLoading = useAppSelector(state => state.notification.loading)
  const navItems = allNavItems
    .filter((item) => canAccessRoute(user?.role, item.path))
    .map((item) => item.path === '/payroll' && !canProcessPayroll(user?.role)
      ? { ...item, label: 'My Payroll' }
      : item)
  const roleLabel = ROLE_LABELS[normalizeRole(user?.role)]
  const safeAreaInsetTop = 'env(safe-area-inset-top, 20px)'
  const desktopSafeAreaInsetTop = 'env(safe-area-inset-top, 0px)'
  const topSpacerHeight = {
    xs: `calc(56px + ${safeAreaInsetTop})`,
    sm: `calc(64px + ${safeAreaInsetTop})`,
    md: `calc(64px + ${desktopSafeAreaInsetTop})`,
  }

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  useEffect(() => {
    if (!notificationOpen) return
    dispatch(fetchNotifications())

    const closeOnOutsideTap = (event: Event) => {
      const target = event.target as Node
      if (notificationRef.current?.contains(target)) return
      setNotificationOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideTap)
    document.addEventListener('touchstart', closeOnOutsideTap, { passive: true })
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideTap)
      document.removeEventListener('touchstart', closeOnOutsideTap)
    }
  }, [dispatch, notificationOpen])

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login', { replace: true })
  }

  const handleMarkAllNotificationsRead = async () => {
    await dispatch(markAllRead())
    await dispatch(fetchNotifications())
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'error'
      case 'HR_MANAGER': return 'warning'
      default: return 'primary'
    }
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/ascendion-icon.png"
          alt="Ascendion"
          sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'contain' }}
        />
        <Box>
          <Box
            component="img"
            src="/ascendion-logo.png"
            alt="Ascendion"
            sx={{ height: 22, maxWidth: 160, objectFit: 'contain', display: 'block' }}
          />
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            HR Platform
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#1e293b' }} />

      <Box sx={{ p: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#1976d2', fontSize: 14 }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </Typography>
            <Chip
              label={roleLabel}
              size="small"
              color={getRoleColor(user?.role || '') as any}
              sx={{ height: 18, fontSize: 10, mt: 0.3 }}
            />
          </Box>
        </Box>
      </Box>

      <List sx={{
        flex: 1,
        px: 1.5,
        py: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y',
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); if (isMobile) setOpen(false) }}
                sx={{
                  borderRadius: 2,
                  color: isActive ? 'white' : '#94a3b8',
                  bgcolor: isActive ? '#1976d2' : 'transparent',
                  '&:hover': { bgcolor: isActive ? '#1565c0' : '#1e293b', color: 'white' },
                  py: 1,
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36, '& svg': { fontSize: 20 } }}>
                  {item.label === 'Notifications' ? (
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                      {item.icon}
                    </Badge>
                  ) : item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider sx={{ borderColor: '#1e293b' }} />
      <List sx={{ px: 1.5, py: 1 }}>
        {bottomItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{ borderRadius: 2, color: '#94a3b8', '&:hover': { bgcolor: '#1e293b', color: 'white' }, py: 1 }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36, '& svg': { fontSize: 20 } }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{ borderRadius: 2, color: '#ef4444', '&:hover': { bgcolor: '#1e293b' }, py: 1 }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><Logout sx={{ fontSize: 20 }} /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      minHeight: '100vh',
      overflow: 'hidden',
      '@supports (height: 100dvh)': {
        height: '100dvh',
        minHeight: '100dvh',
      },
    }}>
      <AppBar position="fixed" elevation={0} sx={{
        zIndex: 9000,
        bgcolor: 'white',
        borderBottom: '1px solid #e2e8f0',
        pt: { xs: safeAreaInsetTop, md: desktopSafeAreaInsetTop },
        width: { md: open ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
        ml: { md: open ? `${DRAWER_WIDTH}px` : 0 },
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2 }, gap: { xs: 0.5, sm: 1 } }}>
          <IconButton
            onClick={() => setOpen(!open)}
            sx={{ mr: { xs: 0.5, sm: 1 }, color: '#64748b', width: 44, height: 44 }}
            aria-label="Toggle navigation"
          >
            {open ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flex: 1, color: '#1e293b', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {navItems.find(n => n.path === location.pathname)?.label ||
             bottomItems.find(n => n.path === location.pathname)?.label || 'Ascendion'}
          </Typography>
          <Box ref={notificationRef} sx={{ position: 'relative', display: 'flex' }}>
            <Tooltip title="Notifications">
              <IconButton
                onClick={() => setNotificationOpen((current) => !current)}
                sx={{ color: '#64748b', width: 44, height: 44 }}
                aria-label="Open notifications"
                aria-expanded={notificationOpen}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            {notificationOpen && (
              <Box
                role="dialog"
                aria-label="Notifications"
                sx={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  zIndex: 9999,
                  width: { xs: 'min(92vw, 360px)', sm: 360 },
                  maxHeight: 'min(24rem, calc(100vh - 120px))',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  bgcolor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28)',
                }}
              >
                <Box sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e2e8f0',
                }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </Typography>
                  </Box>
                  {unreadCount > 0 && (
                    <IconButton
                      size="small"
                      onClick={handleMarkAllNotificationsRead}
                      sx={{ width: 44, height: 44 }}
                      aria-label="Mark all notifications read"
                    >
                      <DoneAll fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {notificationLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No notifications</Typography>
                  </Box>
                ) : (
                  notifications.slice(0, 6).map((notification: any) => (
                    <Box
                      key={notification.id}
                      onClick={() => {
                        setNotificationOpen(false)
                        navigate('/notifications')
                      }}
                      sx={{
                        p: 1.5,
                        borderBottom: '1px solid #f1f5f9',
                        bgcolor: notification.read ? 'white' : '#f0f9ff',
                        cursor: 'pointer',
                        minHeight: 64,
                        '&:active': { bgcolor: '#e0f2fe' },
                      }}
                    >
                      <Typography variant="body2" fontWeight={notification.read ? 500 : 700} noWrap>
                        {notification.title || 'Notification'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {notification.message || ''}
                      </Typography>
                    </Box>
                  ))
                )}

                <Box sx={{ p: 1.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setNotificationOpen(false)
                      navigate('/notifications')
                    }}
                    sx={{ minHeight: 44 }}
                  >
                    View All
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
          <Tooltip title="Profile">
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ ml: { xs: 0, sm: 0.5 }, width: 44, height: 44 }}
              aria-label="Open profile menu"
            >
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#1976d2', fontSize: 14 }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { zIndex: 10000, mt: 1, minWidth: 180, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.2)' } }}
          >
            <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null) }}>
              <Person sx={{ mr: 1, fontSize: 18 }} /> Profile
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null) }}>
              <Settings sx={{ mr: 1, fontSize: 18 }} /> Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <Logout sx={{ mr: 1, fontSize: 18 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: { xs: 0, md: open ? DRAWER_WIDTH : 0 },
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            pt: { xs: safeAreaInsetTop, md: 0 },
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{
        flexGrow: 1,
        bgcolor: '#f8fafc',
        height: '100vh',
        minHeight: 0,
        minWidth: 0,
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y',
        overscrollBehaviorY: 'contain',
        '@supports (height: 100dvh)': {
          height: '100dvh',
        },
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}>
        <Box aria-hidden sx={{ minHeight: topSpacerHeight }} />
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: '100%', minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default MainLayout
