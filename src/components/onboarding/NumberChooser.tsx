'use client'

/**
 * Number Chooser Component
 *
 * Allows subscriber to:
 * 1. Enter ZIP code
 * 2. Search for available numbers
 * 3. Select a number
 * 4. Provision it (charges $15)
 */

import { useState } from 'react'
import type { AvailableNumber } from '@/lib/phone-numbers/provision'

interface NumberChooserProps {
  subscriberId: string
  onComplete: () => void
}

export function NumberChooser({ subscriberId, onComplete }: NumberChooserProps) {
  const [zipCode, setZipCode] = useState('')
  const [numbers, setNumbers] = useState<AvailableNumber[]>([])
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(): Promise<void> {
    if (zipCode.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code')
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const res = await fetch(`/api/phone-numbers/search?zipCode=${zipCode}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search numbers')
      }

      setNumbers(data.numbers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
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
          subscriberId: subscriberId,
          phoneNumber: selectedNumber,
          areaCode: numbers[0]?.areaCode
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          throw new Error('Payment failed. Please update your payment method.')
        }
        throw new Error(data.error || 'Provisioning failed')
      }

      // Success!
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
      <div className="max-w-2xl w-full">
        {/* Step 1: ZIP Code Input */}
        {numbers.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-2">Get Your Business Number</h1>
            <p className="text-gray-600 mb-6">
              Choose a local phone number for your business. We'll find available numbers in your area.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your ZIP Code
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && zipCode.length === 5) {
                    handleSearch()
                  }
                }}
                placeholder="94102"
                maxLength={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A7D]"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              onClick={handleSearch}
              disabled={zipCode.length !== 5 || isSearching}
              className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-[#152d63] transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search Available Numbers'}
            </button>

            <div className="mt-4 text-sm text-gray-600">
              💡 One-time setup fee: $15 • Includes 200 minutes and 500 SMS/month
            </div>
          </div>
        )}

        {/* Step 2: Number Selection */}
        {numbers.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <button
              onClick={() => {
                setNumbers([])
                setSelectedNumber(null)
                setError(null)
              }}
              className="text-[#1B3A7D] text-sm mb-4 hover:underline"
            >
              ← Change ZIP Code
            </button>

            <h2 className="text-xl font-bold mb-4">
              Choose Your Number (Area Code {numbers[0]?.areaCode})
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              onClick={handleProvision}
              disabled={!selectedNumber || isProvisioning}
              className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-[#152d63] transition-colors"
            >
              {isProvisioning ? 'Provisioning...' : 'Continue'}
            </button>

            <div className="mt-4 text-sm text-gray-600 text-center">
              💳 $15 setup fee will be charged to your card on file
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
