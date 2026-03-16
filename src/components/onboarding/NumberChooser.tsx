'use client'

/**
 * Number Chooser - Simple search like Twilio
 */

import { useState } from 'react'
import type { AvailableNumber } from '@/lib/phone-numbers/provision'

interface NumberChooserProps {
  subscriberId: string
  onComplete: () => void
}

export function NumberChooser({ subscriberId, onComplete }: NumberChooserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [numbers, setNumbers] = useState<AvailableNumber[]>([])
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(): Promise<void> {
    if (!searchQuery.trim()) {
      setError('Enter an area code (e.g., 415) or digit pattern')
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedNumber(null)

    try {
      // If 3 digits, treat as area code
      const isAreaCode = /^\d{3}$/.test(searchQuery.trim())
      const url = isAreaCode
        ? `/api/phone-numbers/search?areaCode=${searchQuery.trim()}&limit=50`
        : `/api/phone-numbers/search?contains=${searchQuery.trim()}&limit=50`

      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok || !data.numbers || data.numbers.length === 0) {
        setError(`No numbers found matching "${searchQuery}". Try a different search.`)
        setNumbers([])
      } else {
        setNumbers(data.numbers)
      }
    } catch (err) {
      setError('Search failed. Please try again.')
      setNumbers([])
    } finally {
      setIsLoading(false)
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
          subscriberId,
          phoneNumber: selectedNumber,
          areaCode: selectedNumber.substring(2, 5) // Extract from +1XXXYYYZZZZ
        })
      })

      const data = await res.json()

      if (!res.ok) {
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
          </div>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Search by area code or pattern
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="415 or 800-FLOWERS"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#1B3A7D] focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 bg-[#1B3A7D] text-white rounded-lg font-medium hover:bg-[#152d63] disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Try: 415, 212, 800, or any digit pattern you want
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 mb-4">
            {error}
          </div>
        )}

        {/* Number List */}
        {numbers.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-3">
              {numbers.length} numbers available
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
