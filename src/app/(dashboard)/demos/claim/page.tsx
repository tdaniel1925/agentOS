/**
 * Manual Claim Page
 * Allows reps to manually claim prospects they've met
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ManualClaimPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    prospect_name: '',
    prospect_phone: '',
    prospect_email: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/demo/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim prospect')
      }

      // Success — redirect to rep dashboard
      router.push('/rep?claimed=true')

    } catch (err: any) {
      setError(err.message)
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
              Claim Prospect
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
              Claim Attribution
            </h2>
            <p className="text-sm text-gray-600">
              Manually claim a prospect you've met in person, at a conference, or via
              another channel. If they sign up within 90 days using the same phone or
              email, you'll get credit.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Prospect Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Prospect Name
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={formData.prospect_name}
                onChange={(e) => setFormData({...formData, prospect_name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* Prospect Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Prospect Phone (optional)
              </label>
              <input
                type="tel"
                placeholder="+1 555-555-5555"
                value={formData.prospect_phone}
                onChange={(e) => setFormData({...formData, prospect_phone: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                If they sign up with this phone number, you'll get credit.
              </p>
            </div>

            {/* Prospect Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Prospect Email (optional)
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={formData.prospect_email}
                onChange={(e) => setFormData({...formData, prospect_email: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                If they sign up with this email, you'll get credit.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (!formData.prospect_phone && !formData.prospect_email)}
              className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1B3A7D' }}
            >
              {loading ? 'Claiming...' : 'Claim Prospect'}
            </button>

            {(!formData.prospect_phone && !formData.prospect_email) && (
              <p className="text-xs text-red-600 mt-2 text-center">
                You must provide at least a phone number or email.
              </p>
            )}

          </form>

          {/* How It Works */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold text-sm mb-3">
              How Manual Claims Work
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                Your claim is valid for 90 days
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                If the prospect signs up with the same phone or email, you get credit
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                This is a safety net for offline conversations (conferences, calls, etc.)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                You can still send them a demo or share your signup link for better tracking
              </li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  )
}
