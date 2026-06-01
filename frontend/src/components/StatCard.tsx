import React from 'react'
import { Box, Card, CardContent, Typography, Avatar } from '@mui/material'
import { ArrowUpward, ArrowDownward } from '@mui/icons-material'

const StatCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
  trend?: number
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <Card className="stat-card" sx={{ height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
              {trend >= 0 ? (
                <ArrowUpward sx={{ fontSize: 14, color: '#10b981' }} />
              ) : (
                <ArrowDownward sx={{ fontSize: 14, color: '#ef4444' }} />
              )}
              <Typography variant="caption" sx={{ color: trend >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                {Math.abs(trend)}% from last month
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, width: 52, height: 52 }}>
          <Box sx={{ color }}>{icon}</Box>
        </Avatar>
      </Box>
    </CardContent>
  </Card>
)

export default StatCard
