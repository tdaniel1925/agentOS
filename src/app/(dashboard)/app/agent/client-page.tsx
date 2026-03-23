'use client'

/**
 * Agent Configuration Page - Client Component
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AgentConfigForm from '@/components/dashboard/AgentConfigForm'

export default function AgentConfigClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscriberId, setSubscriberId] = useState<string | null>(null)
  const [agent, setAgent] = useState<any>(null)

  useEffect(() => {
    async function loadAgentData() {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('🤖 Agent: No user found')
          router.push('/login')
          return
        }

        console.log('🤖 Agent: Loading data for', user.email)

        // Get subscriber
        const subscriberResult: any = await (supabase as any)
          .from('subscribers')
          .select('id, business_name, billing_status')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (subscriberResult.error) {
          console.error('Agent page - subscriber query error:', subscriberResult.error)
          router.push('/onboard')
          return
        }

        if (!subscriberResult.data) {
          console.error('Agent page - no subscriber found for user:', user.id)
          router.push('/onboard')
          return
        }

        const subId = subscriberResult.data.id
        setSubscriberId(subId)

        // Get agent configuration
        const agentResult: any = await (supabase as any)
          .from('agents')
          .select('*')
          .eq('subscriber_id', subId)
          .maybeSingle()

        setAgent(agentResult.data || null)
        console.log('🤖 Agent: Data loaded')
      } catch (error) {
        console.error('🤖 Agent: Error', error)
      } finally {
        setLoading(false)
      }
    }

    loadAgentData()
  }, [router])

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
          <div className="text-gray-600">Loading agent configuration...</div>
        </div>
      </div>
    )
  }

  if (!subscriberId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Unable to load agent configuration</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Agent Configuration</h1>
          <p className="text-gray-600 mt-1">
            Configure how {agent?.agent_name || 'Jordan'} answers calls and interacts with customers
          </p>
        </div>

        {!agent && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Agent Not Configured
            </h3>
            <p className="text-yellow-800">
              Your AI agent hasn't been set up yet. Complete onboarding to provision your agent.
            </p>
          </div>
        )}

        {agent && (
          <AgentConfigForm agent={agent} subscriberId={subscriberId} />
        )}
      </div>
    </div>
  )
}
