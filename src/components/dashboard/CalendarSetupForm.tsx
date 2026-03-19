'use client'

/**
 * Calendar Setup Form Component
 * Handles CalDAV calendar URL input and timezone selection
 */

import { useState } from 'react'
import { COMMON_TIMEZONES } from '@/lib/calendar/timezone'

interface CalendarSetupFormProps {
  subscriber: {
    id: string
    business_name: string
    timezone: string | null
    google_calendar_connected: boolean
    microsoft_calendar_connected: boolean
    calendar_type: string | null
    calendar_url: string | null
  }
}

export default function CalendarSetupForm({ subscriber }: CalendarSetupFormProps) {
  const [calendarUrl, setCalendarUrl] = useState(subscriber.calendar_url || '')
  const [calendarType, setCalendarType] = useState<'google' | 'outlook' | 'other'>(
    (subscriber.calendar_type as 'google' | 'outlook' | 'other') || 'google'
  )
  const [timezone, setTimezone] = useState(subscriber.timezone || 'America/Chicago')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState('')

  const handleTestConnection = async () => {
    if (!calendarUrl) {
      setMessage('Please enter a calendar URL first')
      return
    }

    setTesting(true)
    setMessage('')

    try {
      const res = await fetch('/api/calendar/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarUrl })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ Connection successful! Found ${data.eventCount} upcoming events`)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveCalendar = async () => {
    if (!calendarUrl) {
      setMessage('Please enter a calendar URL')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/calendar/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarUrl,
          calendarType,
          timezone
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('✅ Calendar settings saved successfully!')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to save calendar settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your calendar?')) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/calendar/disconnect', {
        method: 'POST'
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Calendar disconnected successfully!')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Failed to disconnect calendar')
    } finally {
      setSaving(false)
    }
  }

  const isConnected = !!subscriber.calendar_url

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('❌') || message.includes('Error')
            ? 'bg-red-50 text-red-800'
            : 'bg-green-50 text-green-800'
        }`}>
          {message}
        </div>
      )}

      {/* Calendar URL Setup */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar Connection</h2>

        {isConnected && (
          <div className="mb-4 p-4 bg-green-50 rounded-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-green-900">Calendar Connected</p>
                <p className="text-sm text-green-700 break-all">{subscriber.calendar_url}</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calendar Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCalendarType('google')}
                className={`p-3 border-2 rounded-lg text-center transition ${
                  calendarType === 'google'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-6 h-6 mx-auto mb-1" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarType('outlook')}
                className={`p-3 border-2 rounded-lg text-center transition ${
                  calendarType === 'outlook'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-6 h-6 mx-auto mb-1" viewBox="0 0 24 24">
                  <path fill="#0078D4" d="M22 3H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 15H6V6h8v12zm8 0h-6v-5h6v5zm0-7h-6V6h6v5z"/>
                </svg>
                <span className="text-sm font-medium">Outlook</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarType('other')}
                className={`p-3 border-2 rounded-lg text-center transition ${
                  calendarType === 'other'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"></line>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"></line>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"></line>
                </svg>
                <span className="text-sm font-medium">Other</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="calendarUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Calendar iCal URL
            </label>
            <input
              type="url"
              id="calendarUrl"
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste your calendar's public iCal/CalDAV URL. <a href="#instructions" className="text-blue-600 hover:underline">How to find it?</a>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testing || !calendarUrl}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              onClick={handleSaveCalendar}
              disabled={saving || !calendarUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Calendar'}
            </button>
          </div>
        </div>
      </div>

      {/* Timezone Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Timezone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set your timezone so appointments are scheduled correctly
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Select Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div id="instructions" className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">How to get your calendar URL</h3>

        <div className="space-y-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-2">For Google Calendar:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Open Google Calendar settings</li>
              <li>Select the calendar you want to share</li>
              <li>Scroll to "Integrate calendar"</li>
              <li>Copy the "Secret address in iCal format" URL</li>
            </ol>
          </div>

          <div>
            <p className="font-medium mb-2">For Outlook/Office 365:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Open Outlook Calendar</li>
              <li>Click "Share" → "Publish Calendar"</li>
              <li>Copy the ICS link provided</li>
            </ol>
          </div>

          <p className="text-xs mt-4 text-blue-700">
            💡 Make sure the calendar is set to "Public" or the URL won't work
          </p>
        </div>
      </div>
    </div>
  )
}
