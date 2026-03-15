/**
 * Onboard/Intake Page
 * 5-question intake form before payment
 */

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STRIPE_PRICES } from '@/lib/stripe/products'

export default function OnboardPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const businessName = formData.get('business_name') as string
    const businessType = formData.get('business_type') as string
    const phone = formData.get('phone') as string
    const painPoint = formData.get('pain_point') as string
    const botName = formData.get('bot_name') as string || 'Jordan'

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update subscriber with intake info
      // Using untyped query to bypass TypeScript inference issue
      const updateResult: any = await (supabase as any)
        .from('subscribers')
        .update({
          business_name: businessName,
          business_type: businessType,
          phone,
          bot_name: botName,
        })
        .eq('auth_user_id', user.id)
        .select()
        .single()

      const { data: subscriber, error: updateError } = updateResult
      if (updateError) throw updateError

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: subscriber.id,
          priceId: STRIPE_PRICES.AGENTOS_BASE,
        }),
      })

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }

    } catch (err: any) {
      setError(err.message || 'Onboarding failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-[#1B3A7D] mb-2">
          Tell Us About Your Business
        </h1>
        <p className="text-gray-600 mb-8">
          Just 5 quick questions to customize your bot
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Business Name
            </label>
            <input
              type="text"
              name="business_name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-transparent"
              placeholder="Acme Insurance Agency"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Business Type
            </label>
            <select
              name="business_type"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-transparent"
            >
              <option value="">Select your industry...</option>
              <option value="insurance">Insurance</option>
              <option value="cpa">CPA / Accounting</option>
              <option value="law">Law / Legal</option>
              <option value="realestate">Real Estate</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. Business Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4. Biggest Pain Point
            </label>
            <div className="space-y-2">
              {[
                'Missing calls after hours',
                'Too many leads to follow up',
                'Appointment scheduling takes too long',
                'Need help with customer service',
                'Want to automate social media',
              ].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="pain_point"
                    value={option}
                    required
                    className="mr-2"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              5. Bot Name (Optional)
            </label>
            <input
              type="text"
              name="bot_name"
              defaultValue="Jordan"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-transparent"
              placeholder="Jordan"
            />
            <p className="text-sm text-gray-500 mt-1">
              This is what your customers will hear
            </p>
          </div>

          <div className="border-t pt-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-2xl font-bold text-[#1B3A7D]">
                  $97<span className="text-base font-normal text-gray-600">/month</span>
                </div>
                <div className="text-sm text-gray-600">
                  Cancel anytime
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C7181F] hover:bg-[#A01419] text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
