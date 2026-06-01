import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

interface NotificationState {
  notifications: any[]
  unreadCount: number
  loading: boolean
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
}

export const fetchNotifications = createAsyncThunk('notification/fetchAll', async () => {
  const response = await api.get('/api/v1/notifications')
  return response.data
})

export const fetchUnreadCount = createAsyncThunk('notification/fetchCount', async () => {
  const response = await api.get('/api/v1/notifications/count')
  return response.data
})

export const markAllRead = createAsyncThunk('notification/markAllRead', async () => {
  await api.patch('/api/v1/notifications/read-all')
})

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.notifications = action.payload
        state.unreadCount = action.payload.filter((n: any) => !n.read).length
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count || 0
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.unreadCount = 0
        state.notifications = state.notifications.map(n => ({ ...n, read: true }))
      })
  },
})

export default notificationSlice.reducer
