/**
 * Onboard/Intake Page
 * 5-question intake form before payment
 */

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STRIPE_PRICES } from '@/lib/stripe/products'

export const dynamic = 'force-dynamic'

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
    const timezone = formData.get('timezone') as string

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
          timezone: timezone,
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
      // After payment, Stripe will redirect to /welcome
      // Welcome page will redirect to /select-phone if no phone number
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
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-[#1B3A7D]">
                <path d="M12 8V4H8"></path>
                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                <path d="M2 14h2"></path>
                <path d="M20 14h2"></path>
                <path d="M15 13v2"></path>
                <path d="M9 13v2"></path>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">AgentOS</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#1B3A7D]/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#1B3A7D]">
                <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                <rect width="20" height="14" x="2" y="6" rx="2"></rect>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1B3A7D]">
                Tell Us About Your Business
              </h1>
              <p className="text-gray-600">
                Just 6 quick questions to customize your bot
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
              <span>Step 1 of 2</span>
              <span>Next: Payment</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#1B3A7D] h-2 rounded-full" style={{width: '50%'}}></div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question 1 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-bold text-[#1B3A7D] mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#1B3A7D] text-white rounded-full text-xs">1</span>
                  Business Name
                </span>
              </label>
              <input
                type="text"
                name="business_name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900 bg-white"
                placeholder="Acme Insurance Agency"
              />
            </div>

            {/* Question 2 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-bold text-[#1B3A7D] mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#1B3A7D] text-white rounded-full text-xs">2</span>
                  Business Type
                </span>
              </label>
              <select
                name="business_type"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900 bg-white"
              >
                <option value="">Select your industry...</option>
                <option value="insurance">Insurance</option>
                <option value="cpa">CPA / Accounting</option>
                <option value="law">Law / Legal</option>
                <option value="realestate">Real Estate</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Question 3 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-bold text-[#1B3A7D] mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#1B3A7D] text-white rounded-full text-xs">3</span>
                  Business Phone Number
                </span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900 bg-white"
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Question 4 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-bold text-[#1B3A7D] mb-4">
                <span className="inline-flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#1B3A7D] text-white rounded-full text-xs">4</span>
                  Biggest Pain Point
                </span>
              </label>
              <div className="space-y-3">
                {[
                  'Missing calls after hours',
                  'Too many leads to follow up',
                  'Appointment scheduling takes too long',
                  'Need help with customer service',
                  'Want to automate social media',
                ].map((option) => (
                  <label key={option} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1B3A7D] cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="pain_point"
                      value={option}
                      required
                      className="w-4 h-4 text-[#1B3A7D] border-gray-300 focus:ring-[#1B3A7D]"
                    />
                    <span className="ml-3 text-sm text-gray-700 group-hover:text-[#1B3A7D] font-medium">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 5 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-bold text-[#1B3A7D] mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#1B3A7D] text-white rounded-full text-xs">5</span>
                  Your Timezone
                </span>
              </label>
              <select
                name="timezone"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900 bg-white"
              >
                <option value="">Select your timezone...</option>
                <optgroup label="US Timezones">
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Phoenix">Arizona (MST - No DST)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                </optgroup>
                <optgroup label="International">
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Paris (CET/CEST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                All appointment times will be shown in your timezone
              </p>
            </div>

            {/* Question 6 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-bold text-[#1B3A7D] mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#1B3A7D] text-white rounded-full text-xs">6</span>
                  Bot Name (Optional)
                </span>
              </label>
              <input
                type="text"
                name="bot_name"
                defaultValue="Jordan"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900 bg-white"
                placeholder="Jordan"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                This is what your customers will hear
              </p>
            </div>

            {/* Pricing Summary */}
            <div className="bg-gradient-to-br from-[#1B3A7D] to-[#0F2347] rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-medium text-white/60 mb-1">Your Plan</div>
                  <div className="text-4xl font-bold">
                    $97<span className="text-lg font-normal text-white/80">/month</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <path d="M12 8V4H8"></path>
                    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                    <path d="M2 14h2"></path>
                    <path d="M20 14h2"></path>
                    <path d="M15 13v2"></path>
                    <path d="M9 13v2"></path>
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                Cancel anytime • $15 phone setup fee • Full refund within 30 days
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C7181F] hover:bg-[#A01419] text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Continue to Payment
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-sm text-white/60 mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Secure checkout powered by Stripe</span>
        </div>
      </div>
    </div>
  )
}
