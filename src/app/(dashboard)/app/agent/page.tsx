/**
 * Agent Configuration Page
 * Configure AI assistant personality, capabilities, FAQs
 */

import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgentConfigForm from '@/components/dashboard/AgentConfigForm'

export const dynamic = 'force-dynamic'

export default async function AgentConfigPage() {
  const supabase = createServiceClient()

  // Get current user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Get subscriber
  const subscriberResult = await supabase
    .from('subscribers')
    .select('id, business_name, billing_status')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (!subscriberResult.data || subscriberResult.error) {
    redirect('/onboarding')
  }

  const subscriberId = subscriberResult.data.id

  // Get agent configuration
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .maybeSingle()

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
