'use client'

import { useMemo } from 'react'

interface UsageChartProps {
  callHistory: Array<{ started_at: string; duration_minutes: number }>
  smsHistory: Array<{ created_at: string; direction: string }>
}

export function UsageChart({ callHistory, smsHistory }: UsageChartProps) {
  // Group data by date
  const chartData = useMemo(() => {
    const last30Days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]

      // Sum call minutes for this date
      const minutesThisDay = callHistory
        .filter(c => c.started_at.startsWith(dateString))
        .reduce((sum, c) => sum + (c.duration_minutes || 0), 0)

      // Count SMS for this date
      const smsThisDay = smsHistory.filter(s =>
        s.created_at.startsWith(dateString) && s.direction === 'outbound'
      ).length

      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: Math.round(minutesThisDay),
        sms: smsThisDay
      })
    }
    return last30Days
  }, [callHistory, smsHistory])

  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 10)
  const maxSms = Math.max(...chartData.map(d => d.sms), 10)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Usage History (Last 30 Days)</h2>

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Voice Minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">SMS Sent</span>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-1">
        {chartData.map((day, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-16 text-xs text-gray-600 text-right">{day.date}</div>

            {/* Voice Bar */}
            <div className="flex-1">
              <div
                className="bg-blue-500 h-6 rounded transition-all"
                style={{ width: `${(day.minutes / maxMinutes) * 100}%` }}
                title={`${day.minutes} minutes`}
              >
                {day.minutes > 0 && (
                  <span className="text-xs text-white px-2 leading-6">{day.minutes}m</span>
                )}
              </div>
            </div>

            {/* SMS Bar */}
            <div className="flex-1">
              <div
                className="bg-green-500 h-6 rounded transition-all"
                style={{ width: `${(day.sms / maxSms) * 100}%` }}
                title={`${day.sms} messages`}
              >
                {day.sms > 0 && (
                  <span className="text-xs text-white px-2 leading-6">{day.sms} SMS</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
