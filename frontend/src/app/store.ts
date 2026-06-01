import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import employeeReducer from '../features/employee/employeeSlice'
import payrollReducer from '../features/payroll/payrollSlice'
import notificationReducer from '../features/analytics/notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employee: employeeReducer,
    payroll: payrollReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
