/**
 * Payment Method Alert Component
 * Shows when trial user hasn't added payment method yet
 */

'use client'

import { useState } from 'react'

interface PaymentMethodAlertProps {
  checkoutSessionUrl?: string | null
  subscriberId: string
}

export default function PaymentMethodAlert({ checkoutSessionUrl, subscriberId }: PaymentMethodAlertProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleAddPaymentMethod = async () => {
    setIsLoading(true)

    // If we have a checkout session URL from signup, use it
    if (checkoutSessionUrl) {
      window.location.href = checkoutSessionUrl
      return
    }

    // Otherwise, create a new checkout session
    try {
      const response = await fetch('/api/billing/setup-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriber_id: subscriberId }),
      })

      const data = await response.json()

      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        alert('Failed to create payment setup session. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error creating payment setup:', error)
      alert('Failed to create payment setup session. Please try again.')
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('payment-alert-dismissed', 'true')
  }

  if (isDismissed) {
    return null
  }

  return (
    <div className="relative bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg">
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
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
            </div>

            <div className="flex-1">
              <p className="font-bold text-lg">Add payment method to secure your trial</p>
              <p className="text-sm text-white/90">
                No charge today! Add your card now so service continues seamlessly when your trial ends.
              </p>
            </div>
          </div>

          {/* Right: CTA and Dismiss */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddPaymentMethod}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-yellow-600 font-bold rounded-lg hover:bg-white/90 transition-all shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
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
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                  Add Payment Method
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
          </div>
        </div>
      </div>
    </div>
  )
}
