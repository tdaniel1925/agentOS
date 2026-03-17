/**
 * Combined Signup + Onboarding Page
 * Single streamlined form with all required fields
 * No emojis, professional design
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { STRIPE_PRICES } from '@/lib/stripe/products'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const businessName = formData.get('business_name') as string
    const businessType = formData.get('business_type') as string
    const phone = formData.get('phone') as string
    const botName = formData.get('bot_name') as string || 'Jordan'

    try {
      // Call signup API route with all data
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          business_name: businessName,
          business_type: businessType,
          bot_name: botName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Sign the user in on the client side
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw new Error('Account created but sign-in failed. Please try logging in.')
      }

      // Create Stripe checkout session
      const checkoutResponse = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: data.subscriber_id,
          priceId: STRIPE_PRICES.AGENTOS_BASE,
        }),
      })

      const { url } = await checkoutResponse.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] flex items-center justify-center px-4 py-8">
      <div className="max-w-6xl w-full">
        {/* Logo */}
        <div className="text-center mb-6">
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

        {/* Main Card - Two Column Layout */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="grid md:grid-cols-3 gap-0">
            {/* Left Column - Form */}
            <div className="md:col-span-2 p-8 md:p-10">
              <h1 className="text-3xl font-bold text-[#1B3A7D] mb-2">
                Complete Setup
              </h1>
              <p className="text-gray-600 mb-6">
                Get your AI digital employee deployed in minutes
              </p>

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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Business Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900"
                    placeholder="john@yourcompany.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900"
                    placeholder="Min. 8 characters"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900"
                    placeholder="John Doe"
                  />
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900"
                    placeholder="Acme Insurance Agency"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    name="business_type"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900 bg-white"
                  >
                    <option value="">Select your industry...</option>
                    <option value="insurance">Insurance</option>
                    <option value="cpa">CPA / Accounting</option>
                    <option value="law">Law / Legal</option>
                    <option value="realestate">Real Estate</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Business Phone */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900"
                    placeholder="(555) 123-4567"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Used for customer communication</p>
                </div>

                {/* Bot Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Bot Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="bot_name"
                    defaultValue="Jordan"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900"
                    placeholder="Jordan"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">What your customers will hear</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C7181F] hover:bg-[#A01419] text-white font-bold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-6"
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
                      Complete Setup
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#1B3A7D] font-bold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Column - Pricing Summary (Sticky) */}
            <div className="bg-gradient-to-br from-[#1B3A7D] to-[#0F2347] p-8 md:p-10 text-white flex flex-col">
              <div className="sticky top-8">
                <h2 className="text-xl font-bold mb-6">Your Plan</h2>

                <div className="mb-8">
                  <div className="text-5xl font-bold mb-2">
                    $97
                    <span className="text-xl font-normal text-white/80">/mo</span>
                  </div>
                  <div className="text-sm text-white/70">
                    + $15 setup fee (one-time)
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5 text-white">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <div>
                      <div className="font-semibold">24/7 AI Assistant</div>
                      <div className="text-sm text-white/70">Never miss a call or lead</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5 text-white">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <div>
                      <div className="font-semibold">Dedicated Phone Number</div>
                      <div className="text-sm text-white/70">Professional business line</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5 text-white">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <div>
                      <div className="font-semibold">Industry-Trained AI</div>
                      <div className="text-sm text-white/70">Customized for your business</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5 text-white">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <div>
                      <div className="font-semibold">SMS & Voice Commands</div>
                      <div className="text-sm text-white/70">Control your bot via text</div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/20">
                  <div className="text-sm text-white/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <span>Secure checkout via Stripe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                      <span>Cancel anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                      <span>30-day money-back guarantee</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-white/10 rounded-lg">
                  <div className="text-sm font-semibold mb-1">Today's Total</div>
                  <div className="text-3xl font-bold">$112</div>
                  <div className="text-xs text-white/70 mt-1">$97 + $15 setup fee, then $97/month</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white/60 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
