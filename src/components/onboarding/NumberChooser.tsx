'use client'

/**
 * Number Chooser - Simple and Clean
 * Shows available numbers, user picks one, done.
 */

import { useState, useEffect } from 'react'
import type { AvailableNumber } from '@/lib/phone-numbers/provision'

interface NumberChooserProps {
  subscriberId: string
  onComplete: () => void
}

export function NumberChooser({ subscriberId, onComplete }: NumberChooserProps) {
  const [numbers, setNumbers] = useState<AvailableNumber[]>([])
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentAreaCode, setCurrentAreaCode] = useState<string>('415')

  // Load numbers on mount - try multiple area codes until we find some
  useEffect(() => {
    loadAvailableNumbers()
  }, [])

  async function loadAvailableNumbers(): Promise<void> {
    setIsLoading(true)
    setError(null)
    setSelectedNumber(null)

    // Try area codes in order until we find numbers
    const areaCodesToTry = ['415', '212', '310', '312', '713', '305', '404', '214', '602', '480']

    for (const areaCode of areaCodesToTry) {
      try {
        const res = await fetch(`/api/phone-numbers/search?areaCode=${areaCode}&limit=20`)
        const data = await res.json()

        if (res.ok && data.numbers && data.numbers.length > 0) {
          setNumbers(data.numbers)
          setCurrentAreaCode(areaCode)
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.error(`Failed to load from ${areaCode}:`, err)
        // Continue to next area code
      }
    }

    // If we get here, no numbers found in any area code
    setError('No numbers available right now. Please try again in a few minutes.')
    setIsLoading(false)
  }

  async function handleProvision(): Promise<void> {
    if (!selectedNumber) return

    setIsProvisioning(true)
    setError(null)

    try {
      const res = await fetch('/api/phone-numbers/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId,
          phoneNumber: selectedNumber,
          areaCode: currentAreaCode
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          throw new Error('Payment failed. Please update your payment method.')
        }
        throw new Error(data.error || 'Provisioning failed')
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provisioning failed')
    } finally {
      setIsProvisioning(false)
    }
  }

  function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Choose Your Business Phone Number</h1>
          <p className="text-gray-600 text-sm mb-3">
            This is your <strong>customer-facing number</strong>. Customers will call this number and Jordan (your AI) will answer.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
            <strong>💡 Pro Tip:</strong> Area code doesn't matter - you can forward calls from your existing business number to this one.
            Just pick any number you like!
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A7D]"></div>
            <p className="mt-2 text-gray-600">Loading available numbers...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 mb-4">
            {error}
          </div>
        )}

        {/* Number List */}
        {!isLoading && numbers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Available Numbers - Area Code ({currentAreaCode})
            </h2>

            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {numbers.map((number) => (
                <label
                  key={number.phoneNumber}
                  className={`
                    block border-2 rounded-lg p-4 cursor-pointer transition
                    ${selectedNumber === number.phoneNumber
                      ? 'border-[#1B3A7D] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <input
                    type="radio"
                    name="phone"
                    value={number.phoneNumber}
                    checked={selectedNumber === number.phoneNumber}
                    onChange={() => setSelectedNumber(number.phoneNumber)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">
                        {formatPhoneNumber(number.phoneNumber)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {number.locality}, {number.region}
                      </div>
                    </div>
                    {selectedNumber === number.phoneNumber && (
                      <span className="text-2xl">✅</span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleProvision}
              disabled={!selectedNumber || isProvisioning}
              className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-[#152d63] transition-colors"
            >
              {isProvisioning ? 'Provisioning...' : 'Get This Number ($15)'}
            </button>

            <div className="mt-3 text-xs text-gray-600 text-center">
              💳 One-time $15 setup fee • Includes 200 minutes + 500 SMS/month
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
