'use client'

import { useState } from 'react'

interface UsageLimitsProps {
  currentLimit: number
  subscriberId: string
}

export function UsageLimits({ currentLimit, subscriberId }: UsageLimitsProps) {
  const [limit, setLimit] = useState(currentLimit)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    setIsSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/usage/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberId, spendingLimit: limit })
      })

      if (!res.ok) {
        throw new Error('Failed to update limit')
      }

      setMessage('✅ Spending limit updated')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to update limit')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Spending Limits</h2>

      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Spending Limit
        </label>

        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min={97}
                max={10000}
                step={50}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: $97 (base subscription)
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || limit === currentLimit}
            className="px-6 py-2 bg-[#1B3A7D] text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {message && (
          <div className="mt-3 text-sm">{message}</div>
        )}

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          💡 Services will pause automatically if you reach this limit to prevent unexpected charges.
        </div>
      </div>
    </div>
  )
}
