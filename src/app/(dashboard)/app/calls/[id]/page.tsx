/**
 * Call Detail Page
 * View full transcript and AI analysis for a single call
 */

import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CallDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  // Get current user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Get subscriber
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single()

  if (!subscriber) {
    redirect('/onboarding')
  }

  // Get call details
  const { data: call } = await supabase
    .from('calls')
    .select('*')
    .eq('id', id)
    .eq('subscriber_id', subscriber.id)
    .single()

  if (!call) {
    redirect('/app/calls')
  }

  const duration = call.duration_seconds
    ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
    : 'N/A'

  const statusColor = call.status === 'completed' ? 'bg-green-100 text-green-800' :
    call.status === 'failed' ? 'bg-red-100 text-red-800' :
    call.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
    'bg-gray-100 text-gray-800'

  const sentimentColor = call.ai_sentiment === 'positive' ? 'bg-green-100 text-green-800' :
    call.ai_sentiment === 'negative' ? 'bg-red-100 text-red-800' :
    call.ai_sentiment === 'urgent' ? 'bg-orange-100 text-orange-800' :
    call.ai_sentiment === 'frustrated' ? 'bg-red-100 text-red-800' :
    'bg-gray-100 text-gray-800'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/app/calls"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Call Logs
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {call.contact_name || call.caller_number || call.callee_number || 'Unknown Contact'}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}>
                  {call.status?.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  call.direction === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {call.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                </span>
                {call.ai_sentiment && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${sentimentColor}`}>
                    {call.ai_sentiment}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Duration</div>
              <div className="text-xl font-bold text-gray-900">{duration}</div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-sm font-semibold text-gray-600">Started</div>
              <div className="text-gray-900">
                {call.started_at
                  ? new Date(call.started_at).toLocaleString()
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">Ended</div>
              <div className="text-gray-900">
                {call.ended_at
                  ? new Date(call.ended_at).toLocaleString()
                  : 'N/A'}
              </div>
            </div>
            {call.caller_number && (
              <div>
                <div className="text-sm font-semibold text-gray-600">Caller</div>
                <div className="text-gray-900">{call.caller_number}</div>
              </div>
            )}
            {call.callee_number && (
              <div>
                <div className="text-sm font-semibold text-gray-600">Called</div>
                <div className="text-gray-900">{call.callee_number}</div>
              </div>
            )}
          </div>

          {/* Outcomes */}
          {(call.lead_captured || call.appointment_booked || call.transferred || call.message_taken) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-600 mb-2">Outcomes</div>
              <div className="flex gap-2">
                {call.lead_captured && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    Lead Captured
                  </span>
                )}
                {call.appointment_booked && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                    Appointment Booked
                  </span>
                )}
                {call.transferred && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    Transferred
                  </span>
                )}
                {call.message_taken && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                    Message Taken
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">AI Analysis</h2>

          <div className="space-y-4">
            {call.ai_intent && (
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Intent</div>
                <div className="text-gray-900">{call.ai_intent}</div>
              </div>
            )}

            {call.ai_summary && (
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Summary</div>
                <div className="text-gray-900">{call.ai_summary}</div>
              </div>
            )}

            {call.ai_action_taken && (
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Action Taken</div>
                <div className="text-gray-900">{call.ai_action_taken}</div>
              </div>
            )}

            {call.ai_next_step && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-900 mb-1">Recommended Next Step</div>
                <div className="text-blue-800">{call.ai_next_step}</div>
              </div>
            )}
          </div>
        </div>

        {/* Transcript */}
        {call.transcript && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Transcript</h2>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-800 whitespace-pre-wrap">
              {call.transcript}
            </div>
          </div>
        )}

        {/* Recording */}
        {call.recording_url && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recording</h2>
            <audio controls className="w-full">
              <source src={call.recording_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  )
}
