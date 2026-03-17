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
    console.log('[Twilio Webhook] Looking up subscriber by phone:', From)

    const subscriberResult: any = await (supabase as any)
      .from('subscribers')
      .select('*')
      .eq('control_phone', From)
      .single()

    const subscriber = subscriberResult.data
    const subError = subscriberResult.error

    console.log('[Twilio Webhook] Subscriber lookup result:', {
      found: !!subscriber,
      subscriber_id: subscriber?.id,
      error: subError?.message
    })

    if (subError || !subscriber) {
      // Unknown number - ask to identify
      console.log('[Twilio Webhook] Unknown number, sending identification prompt')
      await sendSMS({
        to: From,
        body: "I don't recognize this number. What's the email address on your account?",
      })

      // Log unknown request
      await (supabase as any).from('unknown_requests').insert({
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
      const pendingCampaignResult: any = await (supabase as any)
        .from('campaigns')
        .select('*')
        .eq('subscriber_id', subscriber.id)
        .eq('status', 'preview')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const pendingCampaign = pendingCampaignResult.data

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
      const pendingPostResult: any = await (supabase as any)
        .from('pending_approvals')
        .select('*')
        .eq('subscriber_id', subscriber.id)
        .eq('approval_type', 'social_post')
        .is('approved_at', null)
        .is('rejected_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const pendingPost = pendingPostResult.data

      if (pendingPost) {
        // Approve the social post
        const { approveSocialPost } = await import('@/lib/skills/social-post')
        await approveSocialPost(subscriber.id, pendingPost.id)

        return new Response('OK')
      }
    }

    // 6. Check if this is a Jordyn voice command (call someone, etc.)
    const lowerBody = Body.toLowerCase()
    const isCallCommand = lowerBody.includes('call') && (lowerBody.includes('back') || lowerBody.includes('about') || lowerBody.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/))

    if (isCallCommand) {
      // Handle via new SMS command system
      const executeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms-commands/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: subscriber.id,
          rawMessage: Body,
          fromNumber: From
        })
      })

      // Response is already sent by the execute endpoint
      return new Response('OK')
    }

    // 7. Parse the command using SMS intent parser (existing system)
    const intent = await parseSMSIntent(Body, context)

    // 8. Log the command
    await (supabase as any).from('commands_log').insert({
      subscriber_id: subscriber.id,
      channel: 'sms',
      raw_message: Body,
      skill_triggered: intent.intent,
      success: true, // Will update after execution
      created_at: new Date().toISOString(),
    })

    // 9. Execute the skill
    const result = await executeSkill(intent, context, subscriber)

    // 10. Send response
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
  const subscriberResult: any = await (supabase as any)
    .from('subscribers')
    .select('stripe_subscription_status, status')
    .eq('id', subscriberId)
    .single()

  const subscriber = subscriberResult.data

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
  const subscriberResult: any = await (supabase as any)
    .from('subscribers')
    .select('*')
    .eq('id', subscriberId)
    .single()

  const subscriber = subscriberResult.data

  // Get active features
  const featuresResult: any = await (supabase as any)
    .from('feature_flags')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .eq('enabled', true)

  const features = featuresResult.data

  // Get control state
  const controlStateResult: any = await (supabase as any)
    .from('control_states')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .single()

  const controlState = controlStateResult.data

  // Get recent calls (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentCallsResult: any = await (supabase as any)
    .from('call_summaries')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  const recentCalls = recentCallsResult.data

  // Get recent commands (last 24 hours)
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const recentCommandsResult: any = await (supabase as any)
    .from('commands_log')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  const recentCommands = recentCommandsResult.data

  // Get pending campaigns (awaiting approval)
  const pendingCampaignsResult: any = await (supabase as any)
    .from('campaigns')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .eq('status', 'preview')
    .order('created_at', { ascending: false })
    .limit(5)

  const pendingCampaigns = pendingCampaignsResult.data

  return {
    subscriber,
    features: features || [],
    controlState,
    recentCalls: recentCalls || [],
    recentCommands: recentCommands || [],
    pendingCampaigns: pendingCampaigns || [],
  }
}
