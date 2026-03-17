/**
 * Update Agent Configuration
 * Updates AI agent settings and syncs to VAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const VAPI_API_KEY = process.env.VAPI_API_KEY
const VAPI_BASE_URL = 'https://api.vapi.ai'

export async function POST(req: NextRequest) {
  try {
    const { agentId, subscriberId, config }: any = await req.json()

    if (!agentId || !subscriberId || !config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify agent belongs to subscriber
    const { data: agent, error: agentError }: any = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('subscriber_id', subscriberId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Update agent record
    const { error: updateError }: any = await (supabase as any)
      .from('agents')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)

    if (updateError) {
      console.error('Failed to update agent:', updateError)
      return NextResponse.json(
        { error: 'Failed to update agent' },
        { status: 500 }
      )
    }

    // If agent has VAPI assistant, update it
    if (agent.vapi_assistant_id && VAPI_API_KEY) {
      try {
        // Build VAPI system prompt from config
        let systemPrompt = `You are ${config.agent_name}, the AI assistant for ${config.business_description || 'this business'}.

Your personality: ${config.personality}

You are capable of: ${config.capabilities.join(', ')}

`

        // Add FAQs
        if (config.faqs && config.faqs.length > 0) {
          systemPrompt += `\nFrequently asked questions you can answer:\n`
          config.faqs.forEach((faq: { question: string; answer: string }, i: number) => {
            systemPrompt += `${i + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n\n`
          })
        }

        // Add transfer info
        if (config.transfer_number) {
          systemPrompt += `\nIf a caller needs to speak to a person, transfer them to: ${config.transfer_number}\n`
        }

        systemPrompt += `\nOpening greeting: "${config.opening_greeting}"\n`

        systemPrompt += `\nRULES:
- Be natural, warm, and ${config.personality}
- Never claim to be human if directly asked
- Always capture caller name + phone for any lead inquiry
- If you cannot answer a question, offer to take a message
- Block calls from 1-800 numbers and robocall patterns immediately
`

        // Update VAPI assistant
        const vapiResponse = await fetch(`${VAPI_BASE_URL}/assistant/${agent.vapi_assistant_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: config.agent_name,
            model: {
              provider: 'openai',
              model: 'gpt-4',
              messages: [{
                role: 'system',
                content: systemPrompt
              }]
            },
            firstMessage: config.opening_greeting
          })
        })

        if (!vapiResponse.ok) {
          console.error('VAPI assistant update failed:', await vapiResponse.text())
          // Don't fail the whole request - config is saved in DB
        }

      } catch (vapiError) {
        console.error('VAPI sync error:', vapiError)
        // Don't fail the whole request
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Agent configuration updated'
    })

  } catch (error) {
    console.error('Agent update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
