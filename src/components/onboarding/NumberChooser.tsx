'use client'

import { useState, useEffect } from 'react'
import type { AvailableNumber } from '@/lib/phone-numbers/provision'

interface NumberChooserProps {
  subscriberId: string
  onComplete: () => void
}

export function NumberChooser({ subscriberId, onComplete }: NumberChooserProps) {
  const [allNumbers, setAllNumbers] = useState<AvailableNumber[]>([])
  const [filteredNumbers, setFilteredNumbers] = useState<AvailableNumber[]>([])
  const [filterText, setFilterText] = useState('')
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load numbers on mount
  useEffect(() => {
    loadNumbers()
  }, [])

  // Filter numbers when filter text changes
  useEffect(() => {
    if (!filterText) {
      setFilteredNumbers(allNumbers)
    } else {
      const filtered = allNumbers.filter(num =>
        num.phoneNumber.includes(filterText) ||
        num.locality.toLowerCase().includes(filterText.toLowerCase()) ||
        num.region.toLowerCase().includes(filterText.toLowerCase())
      )
      setFilteredNumbers(filtered)
    }
  }, [filterText, allNumbers])

  async function loadNumbers() {
    setIsLoading(true)
    try {
      // Just get 100 numbers from any area code
      const res = await fetch('/api/phone-numbers/search?areaCode=415&limit=100')
      const data = await res.json()

      if (data.numbers && data.numbers.length > 0) {
        setAllNumbers(data.numbers)
        setFilteredNumbers(data.numbers)
      } else {
        setError('No numbers available right now')
      }
    } catch (err) {
      setError('Failed to load numbers')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleProvision() {
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
          areaCode: selectedNumber.substring(2, 5)
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

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
    if (match) return `(${match[1]}) ${match[2]}-${match[3]}`
    return phone
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A7D] mb-4"></div>
          <p className="text-gray-600">Loading available numbers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Choose Your Business Phone Number</h1>
            <p className="text-gray-600 text-sm">
              Customers will call this number and Jordan (your AI) will answer.
            </p>
          </div>

          {/* Filter */}
          <div className="mb-4">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter by area code, city, or digits..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#1B3A7D] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {filteredNumbers.length} of {allNumbers.length} numbers
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Numbers List */}
          <div className="space-y-2 mb-6 max-h-[500px] overflow-y-auto">
            {filteredNumbers.map((number) => (
              <label
                key={number.phoneNumber}
                className={`block border-2 rounded-lg p-4 cursor-pointer transition ${
                  selectedNumber === number.phoneNumber
                    ? 'border-[#1B3A7D] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
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

          {/* Buy Button */}
          <button
            onClick={handleProvision}
            disabled={!selectedNumber || isProvisioning}
            className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-[#152d63]"
          >
            {isProvisioning ? 'Provisioning...' : 'Get This Number ($15)'}
          </button>

          <div className="mt-3 text-xs text-gray-600 text-center">
            💳 One-time $15 setup fee • Includes 200 minutes + 500 SMS/month
          </div>
        </div>
      </div>
    </div>
  )
}
