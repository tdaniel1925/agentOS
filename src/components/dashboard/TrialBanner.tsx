/**
 * Trial Banner Component
 * Shows trial countdown and upgrade prompt at top of dashboard
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TrialBannerProps {
  trialEndsAt: string
  businessName: string
  botName: string
}

export default function TrialBanner({ trialEndsAt, businessName, botName }: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState<number>(0)
  const [hoursLeft, setHoursLeft] = useState<number>(0)
  const [isDismissed, setIsDismissed] = useState<boolean>(false)

  useEffect(() => {
    // Check if banner was dismissed in session storage
    const dismissed = sessionStorage.getItem('trial-banner-dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }

    // Calculate time remaining
    const calculateTimeLeft = () => {
      const now = new Date()
      const trialEnd = new Date(trialEndsAt)
      const diffMs = trialEnd.getTime() - now.getTime()

      if (diffMs <= 0) {
        setDaysLeft(0)
        setHoursLeft(0)
        return
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      setDaysLeft(days)
      setHoursLeft(hours)
    }

    calculateTimeLeft()

    // Update countdown every minute
    const interval = setInterval(calculateTimeLeft, 60000)

    return () => clearInterval(interval)
  }, [trialEndsAt])

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('trial-banner-dismissed', 'true')
  }

  if (isDismissed) {
    return null
  }

  // Determine urgency level
  const isUrgent = daysLeft <= 2
  const isExpired = daysLeft === 0 && hoursLeft === 0

  return (
    <div
      className={`relative ${
        isExpired
          ? 'bg-gradient-to-r from-red-600 to-red-700'
          : isUrgent
          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
          : 'bg-gradient-to-r from-[#1B3A7D] to-[#2A4A8D]'
      } text-white shadow-lg`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon and Message */}
          <div className="flex items-center gap-4 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0">
              {isExpired ? (
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="12"></line>
                  <line x1="12" x2="12.01" y1="16" y2="16"></line>
                </svg>
              ) : (
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              )}
            </div>

            {/* Message */}
            <div className="flex-1">
              {isExpired ? (
                <div>
                  <p className="font-bold text-lg">Your trial has ended</p>
                  <p className="text-sm text-white/90">
                    Upgrade now to reactivate {botName} for {businessName}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-lg">
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in your trial
                  </p>
                  <p className="text-sm text-white/90">
                    Your {botName} trial ends on{' '}
                    {new Date(trialEndsAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Countdown Timer */}
            {!isExpired && (
              <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold">{daysLeft}</div>
                  <div className="text-xs text-white/70">
                    {daysLeft === 1 ? 'day' : 'days'}
                  </div>
                </div>
                <div className="text-2xl text-white/50">:</div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{hoursLeft}</div>
                  <div className="text-xs text-white/70">
                    {hoursLeft === 1 ? 'hour' : 'hours'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: CTA and Dismiss */}
          <div className="flex items-center gap-3">
            <Link
              href="/app/billing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1B3A7D] font-bold rounded-lg hover:bg-white/90 transition-all shadow-lg whitespace-nowrap"
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
                <path d="m5 12 7-7 7 7"></path>
                <path d="M12 19V5"></path>
              </svg>
              Upgrade Now
            </Link>

            {!isExpired && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss banner"
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
