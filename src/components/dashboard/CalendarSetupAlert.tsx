/**
 * Calendar Setup Alert Component
 * Prompts user to set up calendar if not connected
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CalendarSetupAlertProps {
  calendarConnected: boolean
}

export default function CalendarSetupAlert({ calendarConnected }: CalendarSetupAlertProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(false)

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('calendar-alert-dismissed', 'true')
  }

  // Don't show if calendar is already connected or user dismissed it
  if (calendarConnected || isDismissed) {
    return null
  }

  return (
    <div className="relative bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon and Message */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>

            <div className="flex-1">
              <p className="font-bold text-lg">Connect your calendar</p>
              <p className="text-sm text-white/90">
                Enable automatic appointment booking by connecting Google Calendar or Outlook
              </p>
            </div>
          </div>

          {/* Right: CTA and Dismiss */}
          <div className="flex items-center gap-3">
            <Link
              href="/app/calendar"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 font-bold rounded-lg hover:bg-white/90 transition-all shadow-lg whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Set Up Calendar
            </Link>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Dismiss alert"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
