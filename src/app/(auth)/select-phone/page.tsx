/**
 * Phone Number Selection Page
 * Allows user to search and select their dedicated Jordan number
 * Charges $15 setup fee and provisions the number
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AvailableNumber {
  phoneNumber: string
  friendlyName: string
  locality: string
  region: string
  areaCode: string
}

export default function SelectPhonePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [subscriber, setSubscriber] = useState<any>(null)
  const [zipCode, setZipCode] = useState('')
  const [areaCode, setAreaCode] = useState('')
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([])
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriber()
  }, [])

  async function loadSubscriber() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const result: any = await (supabase as any)
        .from('subscribers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (result.error) throw result.error

      const sub = result.data

      // Check if already has active subscription
      if (sub.stripe_subscription_status !== 'active') {
        router.push('/onboard')
        return
      }

      // Check if already has a phone number
      const phoneResult: any = await (supabase as any)
        .from('subscriber_phone_numbers')
        .select('*')
        .eq('subscriber_id', sub.id)
        .eq('status', 'active')
        .single()

      if (phoneResult.data) {
        // Already has a phone number, redirect to welcome
        router.push('/welcome')
        return
      }

      setSubscriber(sub)
      setLoading(false)

    } catch (err: any) {
      console.error('Load subscriber error:', err)
      setError('Failed to load account information')
      setLoading(false)
    }
  }

  async function handleSearch() {
    if (!zipCode && !areaCode) {
      setError('Please enter a zip code or area code')
      return
    }

    setSearching(true)
    setError(null)
    setAvailableNumbers([])
    setSelectedNumber(null)

    try {
      const params = new URLSearchParams({
        subscriberId: subscriber.id,
        limit: '10'
      })

      if (zipCode) {
        params.append('zipCode', zipCode)
      } else {
        params.append('areaCode', areaCode)
      }

      const response = await fetch(`/api/phone-numbers/search?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      if (data.numbers.length === 0) {
        setError('No available numbers found in this area. Try a different zip code or area code.')
        return
      }

      setAvailableNumbers(data.numbers)

    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message || 'Failed to search for numbers')
    } finally {
      setSearching(false)
    }
  }

  async function handleProvision() {
    if (!selectedNumber) {
      setError('Please select a phone number')
      return
    }

    setProvisioning(true)
    setError(null)

    try {
      const response = await fetch('/api/phone-numbers/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: subscriber.id,
          phoneNumber: selectedNumber,
          areaCode: availableNumbers.find(n => n.phoneNumber === selectedNumber)?.areaCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle payment required
        if (response.status === 402 && data.requiresPayment) {
          throw new Error('Payment authentication required. Please update your payment method.')
        }
        throw new Error(data.error || 'Provisioning failed')
      }

      // Success! Redirect to welcome
      router.push('/welcome')

    } catch (err: any) {
      console.error('Provision error:', err)
      setError(err.message || 'Failed to provision phone number')
      setProvisioning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] py-12 px-4">
      <div className="max-w-4xl mx-auto">
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

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1B3A7D]/10 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#1B3A7D]">
                <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#1B3A7D] mb-2">
              Choose Your {subscriber?.bot_name || 'Jordan'} Number
            </h1>
            <p className="text-gray-600">
              Select a dedicated phone number for your AI assistant
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
              <span>Step 2 of 2</span>
              <span>Almost done!</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#1B3A7D] h-2 rounded-full" style={{width: '75%'}}></div>
            </div>
          </div>

          {/* Setup Fee Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <div>
                <p className="text-sm font-bold text-blue-900 mb-1">One-time setup fee: $15</p>
                <p className="text-xs text-blue-800">
                  Includes 200 voice minutes + 500 SMS per month. Overage: $0.40/min, $0.02/SMS
                </p>
              </div>
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

          {/* Search Form */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-bold text-[#1B3A7D] mb-4">Search by Location</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => {
                    setZipCode(e.target.value)
                    if (e.target.value) setAreaCode('')
                  }}
                  placeholder="94102"
                  maxLength={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Area Code
                </label>
                <input
                  type="text"
                  value={areaCode}
                  onChange={(e) => {
                    setAreaCode(e.target.value)
                    if (e.target.value) setZipCode('')
                  }}
                  placeholder="415"
                  maxLength={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900 bg-white"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || (!zipCode && !areaCode)}
              className="w-full bg-[#1B3A7D] hover:bg-[#0F2347] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                  Search Available Numbers
                </>
              )}
            </button>
          </div>

          {/* Available Numbers */}
          {availableNumbers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#1B3A7D] mb-4">Available Numbers</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableNumbers.map((number) => (
                  <label
                    key={number.phoneNumber}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedNumber === number.phoneNumber
                        ? 'border-[#1B3A7D] bg-[#1B3A7D]/5'
                        : 'border-gray-200 hover:border-[#1B3A7D]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="phoneNumber"
                        value={number.phoneNumber}
                        checked={selectedNumber === number.phoneNumber}
                        onChange={() => setSelectedNumber(number.phoneNumber)}
                        className="w-5 h-5 text-[#1B3A7D] border-gray-300 focus:ring-[#1B3A7D]"
                      />
                      <div>
                        <div className="text-lg font-bold text-gray-900">{number.phoneNumber}</div>
                        <div className="text-sm text-gray-600">
                          {number.locality}, {number.region}
                        </div>
                      </div>
                    </div>
                    {selectedNumber === number.phoneNumber && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#1B3A7D]">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Provision Button */}
          {availableNumbers.length > 0 && (
            <button
              onClick={handleProvision}
              disabled={!selectedNumber || provisioning}
              className="w-full bg-[#C7181F] hover:bg-[#A01419] text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-lg"
            >
              {provisioning ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Provisioning Number...
                </>
              ) : (
                <>
                  Complete Setup ($15)
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-sm text-white/60 mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>
    </div>
  )
}
