/**
 * Usage Dashboard Component
 * Displays real-time voice minutes, SMS usage, and spending
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UsageData {
  voice_minutes_used: number
  voice_minutes_remaining: number
  voice_minutes_included: number
  sms_messages_used: number
  sms_messages_remaining: number
  sms_messages_included: number
  voice_overage_charges: number
  sms_overage_charges: number
  total_charges: number
  monthly_base_fee: number
  spending_limit: number
  billing_period_start: string
  billing_period_end: string
}

interface UsageDashboardProps {
  subscriberId: string
}

export default function UsageDashboard({ subscriberId }: UsageDashboardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)

  useEffect(() => {
    loadUsage()

    // Refresh every 30 seconds
    const interval = setInterval(loadUsage, 30000)
    return () => clearInterval(interval)
  }, [subscriberId])

  async function loadUsage() {
    try {
      const supabase = createClient()

      // Get phone number
      const phoneResult: any = await (supabase as any)
        .from('subscriber_phone_numbers')
        .select('phone_number')
        .eq('subscriber_id', subscriberId)
        .eq('status', 'active')
        .single()

      if (phoneResult.data) {
        setPhoneNumber(phoneResult.data.phone_number)
      }

      // Get current billing period usage
      const usageResult: any = await (supabase as any)
        .from('subscriber_usage')
        .select('*')
        .eq('subscriber_id', subscriberId)
        .lte('billing_period_start', new Date().toISOString())
        .gte('billing_period_end', new Date().toISOString())
        .single()

      if (usageResult.data) {
        setUsage(usageResult.data)
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to load usage:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!usage) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <p className="text-gray-600">No usage data available yet. Make your first call to start tracking!</p>
      </div>
    )
  }

  const voicePercentUsed = (usage.voice_minutes_used / usage.voice_minutes_included) * 100
  const smsPercentUsed = (usage.sms_messages_used / usage.sms_messages_included) * 100
  const spendingPercentUsed = (usage.total_charges / usage.spending_limit) * 100

  const voiceOverage = Math.max(0, usage.voice_minutes_used - usage.voice_minutes_included)
  const smsOverage = Math.max(0, usage.sms_messages_used - usage.sms_messages_included)

  const billingPeriodEnd = new Date(usage.billing_period_end)
  const daysRemaining = Math.ceil((billingPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Phone Number Card */}
      {phoneNumber && (
        <div className="bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white/70 mb-1">Your Jordan Number</div>
              <div className="text-2xl font-bold">{phoneNumber}</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Usage Overview */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Monthly Usage</h3>
          <div className="text-sm text-gray-600">
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
          </div>
        </div>

        {/* Voice Minutes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#1B3A7D]">
                <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
              </svg>
              <span className="font-semibold text-gray-900">Voice Minutes</span>
            </div>
            <div className="text-sm">
              <span className={`font-bold ${voicePercentUsed > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                {usage.voice_minutes_used.toFixed(1)}
              </span>
              <span className="text-gray-500"> / {usage.voice_minutes_included}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${
                voicePercentUsed > 100 ? 'bg-red-500' :
                voicePercentUsed > 80 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(voicePercentUsed, 100)}%` }}
            />
          </div>
          {voiceOverage > 0 && (
            <p className="text-sm text-red-600 mt-2 font-medium">
              +{voiceOverage.toFixed(1)} overage minutes (${usage.voice_overage_charges.toFixed(2)})
            </p>
          )}
          {voicePercentUsed > 80 && voiceOverage === 0 && (
            <p className="text-sm text-yellow-600 mt-2 font-medium">
              ⚠️ {usage.voice_minutes_remaining.toFixed(1)} minutes remaining
            </p>
          )}
        </div>

        {/* SMS Messages */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#1B3A7D]">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span className="font-semibold text-gray-900">SMS Messages</span>
            </div>
            <div className="text-sm">
              <span className={`font-bold ${smsPercentUsed > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                {usage.sms_messages_used}
              </span>
              <span className="text-gray-500"> / {usage.sms_messages_included}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${
                smsPercentUsed > 100 ? 'bg-red-500' :
                smsPercentUsed > 80 ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(smsPercentUsed, 100)}%` }}
            />
          </div>
          {smsOverage > 0 && (
            <p className="text-sm text-red-600 mt-2 font-medium">
              +{smsOverage} overage messages (${usage.sms_overage_charges.toFixed(2)})
            </p>
          )}
          {smsPercentUsed > 80 && smsOverage === 0 && (
            <p className="text-sm text-yellow-600 mt-2 font-medium">
              ⚠️ {usage.sms_messages_remaining} messages remaining
            </p>
          )}
        </div>

        {/* Billing Summary */}
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base subscription</span>
              <span className="font-medium text-gray-900">${usage.monthly_base_fee.toFixed(2)}</span>
            </div>
            {usage.voice_overage_charges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Voice overage</span>
                <span className="font-medium text-red-600">+${usage.voice_overage_charges.toFixed(2)}</span>
              </div>
            )}
            {usage.sms_overage_charges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SMS overage</span>
                <span className="font-medium text-red-600">+${usage.sms_overage_charges.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span className="text-gray-900">Current month total</span>
              <span className={usage.total_charges > usage.monthly_base_fee ? 'text-red-600' : 'text-gray-900'}>
                ${usage.total_charges.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Spending Limit Warning */}
        {spendingPercentUsed > 80 && (
          <div className={`mt-4 p-4 rounded-lg ${
            spendingPercentUsed >= 100 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 flex-shrink-0 ${
                spendingPercentUsed >= 100 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" x2="12" y1="9" y2="13"></line>
                <line x1="12" x2="12.01" y1="17" y2="17"></line>
              </svg>
              <div>
                <p className={`text-sm font-bold ${
                  spendingPercentUsed >= 100 ? 'text-red-900' : 'text-yellow-900'
                }`}>
                  {spendingPercentUsed >= 100 ? 'Spending limit reached!' : 'Approaching spending limit'}
                </p>
                <p className={`text-xs mt-1 ${
                  spendingPercentUsed >= 100 ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {spendingPercentUsed >= 100
                    ? 'Your monthly spending limit has been reached. No additional charges will be applied.'
                    : `You've used ${spendingPercentUsed.toFixed(0)}% of your $${usage.spending_limit.toFixed(2)} monthly limit.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Info */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Pricing Details</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Base plan</span>
            <span>${usage.monthly_base_fee}/month</span>
          </div>
          <div className="flex justify-between">
            <span>Included minutes</span>
            <span>{usage.voice_minutes_included} minutes</span>
          </div>
          <div className="flex justify-between">
            <span>Included SMS</span>
            <span>{usage.sms_messages_included} messages</span>
          </div>
          <div className="flex justify-between">
            <span>Overage rate (voice)</span>
            <span>$0.40/minute</span>
          </div>
          <div className="flex justify-between">
            <span>Overage rate (SMS)</span>
            <span>$0.02/message</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Monthly spending cap</span>
            <span>${usage.spending_limit.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
