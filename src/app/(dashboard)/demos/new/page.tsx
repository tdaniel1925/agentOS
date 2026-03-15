/**
 * Send Demo Page
 * Rep back office form to trigger demos
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BUSINESS_TYPES = [
  { value: 'insurance', label: 'Insurance Agent' },
  { value: 'cpa', label: 'CPA / Tax Professional' },
  { value: 'law', label: 'Attorney / Law Firm' },
  { value: 'realestate', label: 'Real Estate Agent' },
  { value: 'other', label: 'Other' }
]

export default function SendDemoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    prospect_name: '',
    prospect_phone: '',
    prospect_business_type: 'insurance',
    prospect_note: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/demo/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send demo')
      }

      // Success — redirect to demo list
      router.push('/demos?success=true')

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
              Send Demo
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
              Trigger a Demo Call
            </h2>
            <p className="text-sm text-gray-600">
              Jordan will text your prospect asking for consent, then call them for a
              2-3 minute demo. After the call, Jordan sends a personalized email with
              your signup link.
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
                Prospect Phone
              </label>
              <input
                type="tel"
                required
                placeholder="+1 555-555-5555"
                value={formData.prospect_phone}
                onChange={(e) => setFormData({...formData, prospect_phone: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                US number only. Jordan will text and call this number.
              </p>
            </div>

            {/* Business Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Business Type
              </label>
              <select
                value={formData.prospect_business_type}
                onChange={(e) => setFormData({...formData, prospect_business_type: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              >
                {BUSINESS_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Jordan will customize the demo based on their industry.
              </p>
            </div>

            {/* Optional Note */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Note (optional)
              </label>
              <textarea
                placeholder="e.g., State Farm agent considering switch"
                value={formData.prospect_note}
                onChange={(e) => setFormData({...formData, prospect_note: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Internal context for your records (not shared with prospect).
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1B3A7D' }}
            >
              {loading ? 'Sending...' : 'Send Demo'}
            </button>

          </form>

          {/* How It Works */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold text-sm mb-3">
              How It Works
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                Jordan texts prospect asking for consent
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                If they reply YES, Jordan calls within 1 minute
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                After call, Jordan captures email and sends personalized summary
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                Email includes your unique signup link with attribution
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">5.</span>
                When they sign up, you automatically earn commission
              </li>
            </ol>
          </div>

        </div>
      </main>
    </div>
  )
}
