/**
 * Rep Phone Registration Page
 * Allows reps to register their mobile phone to trigger demos via SMS
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function RegisterPhonePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentPhone, setCurrentPhone] = useState<string | null>(null)
  const [phone, setPhone] = useState('')

  // Load current phone on mount
  useEffect(() => {
    async function loadCurrentPhone() {
      try {
        const response = await fetch('/api/rep/phone')
        if (response.ok) {
          const data = await response.json()
          setCurrentPhone(data.rep_phone)
        }
      } catch (err) {
        console.error('Error loading current phone:', err)
      }
    }
    loadCurrentPhone()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/rep/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register phone')
      }

      setSuccess(true)
      setCurrentPhone(result.rep_phone)
      setPhone('')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: '#1B3A7D' }}>
              Register Phone
            </h1>
            <Link
              href="/rep"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white border rounded-xl p-8">

          {/* Intro */}
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-2">
              SMS Demo Trigger
            </h2>
            <p className="text-sm text-gray-600">
              Register your mobile phone to trigger demos via text message. Once
              registered, you can send demos on the go without logging into the portal.
            </p>
          </div>

          {/* Current Phone */}
          {currentPhone && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Current Registered Phone
                  </p>
                  <p className="text-lg font-mono text-blue-700 mt-1">
                    {currentPhone}
                  </p>
                </div>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                Phone registered successfully! You can now trigger demos via SMS.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Your Mobile Phone
              </label>
              <input
                type="tel"
                required
                placeholder="+1 555-555-5555"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                US number only. This phone will be used to identify you when you text the demo number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1B3A7D' }}
            >
              {loading ? 'Registering...' : currentPhone ? 'Update Phone' : 'Register Phone'}
            </button>
          </form>

          {/* How It Works */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold text-sm mb-3">
              How SMS Demos Work
            </h3>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <div>
                  Text the demo number:{' '}
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+1 XXX-XXX-XXXX'}
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                Use this format:{' '}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded block mt-1">
                  DEMO John 5551234567 insurance
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                Jordan will text the prospect for consent and trigger the demo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                You'll get confirmation and the demo will appear in your dashboard
              </li>
            </ol>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Business types:</strong> insurance, cpa, law, realestate, other
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
