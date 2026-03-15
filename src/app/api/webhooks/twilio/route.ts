/**
 * Twilio Inbound SMS Webhook
 * Handles all incoming SMS messages to the control number
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyTwilioSignature, sendSMS } from '@/lib/twilio/client'
import { createServiceClient } from '@/lib/supabase/server'
import { parseSMSIntent } from '@/lib/skills/sms-parser'
import { executeSkill } from '@/lib/skills/executor'

export async function POST(req: NextRequest) {
  try {
    // 1. Parse form data (Twilio sends application/x-www-form-urlencoded)
    const formData = await req.formData()
    const From = formData.get('From') as string
    const Body = formData.get('Body') as string
    const To = formData.get('To') as string

    if (!From || !Body) {
      return new Response('Missing required fields', { status: 400 })
    }

    // 2. Verify Twilio signature
    const signature = req.headers.get('X-Twilio-Signature')
    if (!signature) {
      return new Response('Missing signature', { status: 401 })
    }

    const url = req.url
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const isValid = verifyTwilioSignature(signature, url, params)
    if (!isValid) {
      console.error('Invalid Twilio signature')
      return new Response('Unauthorized', { status: 401 })
    }

    // 3. Identify subscriber by phone number
    const supabase = createServiceClient()
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('contact_phone', From)
      .single()

    if (subError || !subscriber) {
      // Unknown number - ask to identify
      await sendSMS({
        to: From,
        body: "I don't recognize this number. What's the email address on your account?",
      })

      // Log unknown request
      await supabase.from('unknown_requests').insert({
        channel: 'sms',
        sender_identifier: From,
        raw_message: Body,
        suggested_feature: 'phone_number_lookup',
      })

      return new Response('OK')
    }

    // 4. Check billing gate
    const billingStatus = await checkBillingGate(subscriber.id, supabase)
    if (billingStatus.blocked) {
      await sendSMS({
        to: From,
        body: billingStatus.message,
      })
      return new Response('OK')
    }

    // 5. Load full subscriber context
    const context = await loadSubscriberContext(subscriber.id, supabase)

    // 5.5. Check for simple approval/edit responses
    const simplifiedBody = Body.trim().toUpperCase()
    if (simplifiedBody === 'YES' || simplifiedBody === 'APPROVE') {
      // Check for pending campaign approval
      const { data: pendingCampaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('subscriber_id', subscriber.id)
        .eq('status', 'preview')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (pendingCampaign) {
        // Approve the campaign
        const { approveCampaign } = await import('@/lib/skills/campaign-create')
        await approveCampaign(pendingCampaign.id)

        await sendSMS({
          to: From,
          body: `Campaign for ${pendingCampaign.prospect_name} approved! First email sends in ${pendingCampaign.interval_days} days. I'll handle the rest.`,
        })

        return new Response('OK')
      }

      // Check for pending social post approval
      const { data: pendingPost } = await supabase
        .from('pending_approvals')
        .select('*')
        .eq('subscriber_id', subscriber.id)
        .eq('approval_type', 'social_post')
        .is('approved_at', null)
        .is('rejected_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (pendingPost) {
        // Approve the social post
        const { approveSocialPost } = await import('@/lib/skills/social-post')
        await approveSocialPost(subscriber.id, pendingPost.id)

        return new Response('OK')
      }
    }

    // 6. Parse the command using SMS intent parser
    const intent = await parseSMSIntent(Body, context)

    // 7. Log the command
    await supabase.from('commands_log').insert({
      subscriber_id: subscriber.id,
      channel: 'sms',
      raw_message: Body,
      skill_triggered: intent.intent,
      success: true, // Will update after execution
      created_at: new Date().toISOString(),
    })

    // 8. Execute the skill
    const result = await executeSkill(intent, context, subscriber)

    // 9. Send response
    if (result.message) {
      await sendSMS({
        to: From,
        body: result.message,
      })
    }

    return new Response('OK')
  } catch (error) {
    console.error('Twilio webhook error:', error)
    return new Response('Internal error', { status: 500 })
  }
}

/**
 * Check if subscriber's billing is current
 */
async function checkBillingGate(
  subscriberId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<{ blocked: boolean; message: string }> {
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('stripe_subscription_status, status')
    .eq('id', subscriberId)
    .single()

  if (!subscriber) {
    return { blocked: true, message: 'Account not found.' }
  }

  // Hard pause - no subscription or past_due
  if (
    subscriber.stripe_subscription_status === 'past_due' ||
    subscriber.stripe_subscription_status === 'unpaid' ||
    subscriber.stripe_subscription_status === 'canceled'
  ) {
    return {
      blocked: true,
      message: `Your subscription needs attention. Please visit ${process.env.NEXT_PUBLIC_APP_URL}/app/billing to update your payment method.`,
    }
  }

  return { blocked: false, message: '' }
}

/**
 * Load full subscriber context for command execution
 */
async function loadSubscriberContext(
  subscriberId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<any> {
  // Get subscriber
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('*')
    .eq('id', subscriberId)
    .single()

  // Get active features
  const { data: features } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .eq('enabled', true)

  // Get control state
  const { data: controlState } = await supabase
    .from('control_states')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .single()

  // Get recent calls (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentCalls } = await supabase
    .from('call_summaries')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  // Get recent commands (last 24 hours)
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const { data: recentCommands } = await supabase
    .from('commands_log')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  // Get pending campaigns (awaiting approval)
  const { data: pendingCampaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .eq('status', 'preview')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    subscriber,
    features: features || [],
    controlState,
    recentCalls: recentCalls || [],
    recentCommands: recentCommands || [],
    pendingCampaigns: pendingCampaigns || [],
  }
}
