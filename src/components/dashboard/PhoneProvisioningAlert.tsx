/**
 * Phone Provisioning Alert Component
 * Shows when phone number provisioning failed during signup
 */

'use client'

import { useState } from 'react'

interface PhoneProvisioningAlertProps {
  subscriberId: string
  businessName: string
}

export default function PhoneProvisioningAlert({ subscriberId, businessName }: PhoneProvisioningAlertProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(false)
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const handleProvisionPhone = async () => {
    setIsProvisioning(true)
    setError(null)

    try {
      const response = await fetch('/api/subscribers/provision-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriber_id: subscriberId }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(data.error || 'Failed to provision phone number')
        setIsProvisioning(false)
      }
    } catch (error) {
      console.error('Error provisioning phone:', error)
      setError('Network error. Please try again.')
      setIsProvisioning(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('phone-alert-dismissed', 'true')
  }

  if (isDismissed || success) {
    return null
  }

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
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
                <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
              </svg>
            </div>

            <div className="flex-1">
              <p className="font-bold text-lg">Phone number setup incomplete</p>
              <p className="text-sm text-white/90">
                {error ? (
                  <span className="text-red-200">{error}</span>
                ) : (
                  `We're still getting your business phone number ready for ${businessName}. Click to retry.`
                )}
              </p>
            </div>
          </div>

          {/* Right: CTA and Dismiss */}
          <div className="flex items-center gap-3">
            {success ? (
              <div className="flex items-center gap-2 text-green-300">
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                <span className="font-bold">Success! Reloading...</span>
              </div>
            ) : (
              <>
                <button
                  onClick={handleProvisionPhone}
                  disabled={isProvisioning}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-white/90 transition-all shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProvisioning ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Provisioning...
                    </>
                  ) : (
                    <>
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
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
                      </svg>
                      Retry Setup
                    </>
                  )}
                </button>

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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
