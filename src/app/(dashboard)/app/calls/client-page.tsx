'use client'

/**
 * Call Logs Page - Client Component
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CallLogsClientPage() {
  const [loading, setLoading] = useState(true)
  const [subscriber, setSubscriber] = useState<any>(null)
  const [calls, setCalls] = useState<any[]>([])

  useEffect(() => {
    async function loadCallsData() {
      try {
        const supabase = createClient()

        // Small delay to ensure session is ready
        await new Promise(resolve => setTimeout(resolve, 100))

        // Get current user (layout already verified auth)
        let user = null
        let attempts = 0
        const maxAttempts = 3

        while (!user && attempts < maxAttempts) {
          attempts++
          const { data: { user: fetchedUser } } = await supabase.auth.getUser()
          user = fetchedUser

          if (!user && attempts < maxAttempts) {
            console.log(`📞 Calls: No user found, retrying... (attempt ${attempts}/${maxAttempts})`)
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }

        if (!user) {
          console.error('📞 Calls: No user found after retries')
          setLoading(false)
          return
        }

        console.log('📞 Calls: Loading data for', user.email)

        // Get subscriber
        const subscriberResult: any = await (supabase as any)
          .from('subscribers')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()

        if (subscriberResult.error) {
          console.error('Calls page - subscriber query error:', subscriberResult.error)
          setLoading(false)
          return
        }

        if (!subscriberResult.data) {
          console.error('Calls page - no subscriber found for user:', user.id)
          setLoading(false)
          return
        }

        const subscriberData = subscriberResult.data
        setSubscriber(subscriberData)

        // Get all calls
        const callsResult: any = await (supabase as any)
          .from('calls')
          .select('*')
          .eq('subscriber_id', subscriberData.id)
          .order('created_at', { ascending: false })
          .limit(100)

        setCalls(callsResult.data || [])
        console.log('📞 Calls: Data loaded')
      } catch (error) {
        console.error('📞 Calls: Error', error)
      } finally {
        setLoading(false)
      }
    }

    loadCallsData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="text-gray-600">Loading calls...</div>
        </div>
      </div>
    )
  }

  if (!subscriber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Unable to load calls data</p>
        </div>
      </div>
    )
  }

  // Calculate stats
  const totalCalls = calls?.length || 0
  const completedCalls = calls?.filter((c: any) => c.status === 'completed').length || 0
  const leadsGenerated = calls?.filter((c: any) => c.lead_captured).length || 0
  const appointmentsBooked = calls?.filter((c: any) => c.appointment_booked).length || 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-gray-600 mt-1">
            View all calls with transcripts and AI analysis
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-600 mb-1">Total Calls</div>
            <div className="text-3xl font-bold text-gray-900">{totalCalls}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-600 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-600">{completedCalls}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-600 mb-1">Leads Captured</div>
            <div className="text-3xl font-bold text-blue-600">{leadsGenerated}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-600 mb-1">Appointments</div>
            <div className="text-3xl font-bold text-purple-600">{appointmentsBooked}</div>
          </div>
        </div>

        {/* Call List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Calls</h2>
          </div>

          {calls && calls.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {calls.map((call: any) => {
                const duration = call.duration_seconds
                  ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}`
                  : '-'

                const statusColor = call.status === 'completed' ? 'text-green-600' :
                  call.status === 'failed' ? 'text-red-600' :
                  call.status === 'in_progress' ? 'text-blue-600' :
                  'text-gray-600'

                const sentimentColor = call.ai_sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                  call.ai_sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                  call.ai_sentiment === 'urgent' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'

                return (
                  <Link
                    key={call.id}
                    href={`/app/calls/${call.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Direction icon */}
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            call.direction === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {call.direction === 'inbound' ? '← Inbound' : '→ Outbound'}
                          </div>

                          {/* Contact */}
                          <div className="font-semibold text-gray-900">
                            {call.contact_name || call.caller_number || call.callee_number || 'Unknown'}
                          </div>

                          {/* Sentiment */}
                          {call.ai_sentiment && (
                            <div className={`px-2 py-1 rounded text-xs font-semibold ${sentimentColor}`}>
                              {call.ai_sentiment}
                            </div>
                          )}

                          {/* Badges */}
                          {call.lead_captured && (
                            <div className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                              Lead
                            </div>
                          )}
                          {call.appointment_booked && (
                            <div className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                              Appointment
                            </div>
                          )}
                        </div>

                        {/* Summary */}
                        {call.ai_summary && (
                          <p className="text-gray-600 text-sm mb-2">{call.ai_summary}</p>
                        )}

                        {/* Intent */}
                        {call.ai_intent && (
                          <p className="text-gray-500 text-sm">
                            <span className="font-semibold">Intent:</span> {call.ai_intent}
                          </p>
                        )}

                        {/* Next Step */}
                        {call.ai_next_step && call.ai_next_step !== 'No action required' && (
                          <p className="text-blue-600 text-sm mt-2">
                            <span className="font-semibold">Next:</span> {call.ai_next_step}
                          </p>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className={`text-sm font-semibold ${statusColor}`}>
                          {call.status?.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{duration}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(call.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <p>No calls yet. Your AI agent will log calls here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
