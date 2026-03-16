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

  const selectedNumberData = filteredNumbers.find(n => n.phoneNumber === selectedNumber)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Choose Your Business Phone Number</h1>
          <p className="text-gray-600 text-sm">
            Customers will call this number and Jordan (your AI) will answer.
            {!selectedNumber && " Can't find your area code? No problem - this is just a forwarding number."}
          </p>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN - Numbers List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
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

            {/* Scrollable Numbers List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
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
          </div>

          {/* RIGHT COLUMN - Purchase Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-lg font-bold mb-4">Selected Number</h2>

              {selectedNumberData ? (
                <>
                  <div className="bg-blue-50 border-2 border-[#1B3A7D] rounded-lg p-4 mb-4">
                    <div className="text-2xl font-bold text-[#1B3A7D] mb-1">
                      {formatPhoneNumber(selectedNumberData.phoneNumber)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedNumberData.locality}, {selectedNumberData.region}
                    </div>
                  </div>

                  <button
                    onClick={handleProvision}
                    disabled={isProvisioning}
                    className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-[#152d63] mb-3"
                  >
                    {isProvisioning ? 'Provisioning...' : 'Get This Number ($15)'}
                  </button>

                  <div className="text-xs text-gray-600 text-center mb-4">
                    💳 One-time $15 setup fee
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-600 mb-2 font-semibold">What's included:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>✓ 200 minutes/month</li>
                      <li>✓ 500 SMS messages/month</li>
                      <li>✓ AI assistant (Jordan)</li>
                      <li>✓ Voicemail transcription</li>
                      <li>✓ Call recording</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">☎️</div>
                  <p className="text-sm">Select a number from the list</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
