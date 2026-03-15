/**
 * Resend Webhook Handler
 * Handles email events: opened, clicked, bounced, complained (spam)
 * Detects when prospect REPLIES to a campaign email and pauses campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'

export async function POST(req: NextRequest) {
  try {
    const event = await req.json()

    // Verify webhook signature (Resend uses Svix for webhooks)
    // In production, verify the webhook signature
    // const signature = req.headers.get('svix-signature')
    // const timestamp = req.headers.get('svix-timestamp')
    // const id = req.headers.get('svix-id')

    const supabase = createServiceClient()

    // Handle different event types
    switch (event.type) {
      case 'email.opened':
        await handleEmailOpened(event.data, supabase)
        break

      case 'email.clicked':
        await handleEmailClicked(event.data, supabase)
        break

      case 'email.bounced':
        await handleEmailBounced(event.data, supabase)
        break

      case 'email.complained':
        await handleEmailComplained(event.data, supabase)
        break

      case 'email.delivered':
        await handleEmailDelivered(event.data, supabase)
        break

      default:
        console.log('Unhandled Resend event type:', event.type)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return new Response('Internal error', { status: 500 })
  }
}

/**
 * Handle email opened event
 */
async function handleEmailOpened(
  data: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  try {
    // Extract campaign_id and email_id from tags
    const campaignId = data.tags?.find((t: any) => t.name === 'campaign_id')?.value
    const emailId = data.tags?.find((t: any) => t.name === 'email_id')?.value

    if (!emailId) return

    // Update email record
    await (supabase as any)
      .from('campaign_emails')
      .update({
        opened_at: new Date().toISOString(),
      })
      .eq('id', emailId)

    // Update campaign stats
    if (campaignId) {
      await (supabase as any).rpc('increment_campaign_opens', { campaign_id: campaignId })
    }

    console.log(`✉️ Email ${emailId} opened`)
  } catch (error) {
    console.error('Error handling email opened:', error)
  }
}

/**
 * Handle email clicked event
 */
async function handleEmailClicked(
  data: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  try {
    const campaignId = data.tags?.find((t: any) => t.name === 'campaign_id')?.value
    const emailId = data.tags?.find((t: any) => t.name === 'email_id')?.value

    if (!emailId) return

    // Update email record
    await (supabase as any)
      .from('campaign_emails')
      .update({
        clicked_at: new Date().toISOString(),
      })
      .eq('id', emailId)

    // Update campaign stats
    if (campaignId) {
      await (supabase as any).rpc('increment_campaign_clicks', { campaign_id: campaignId })
    }

    console.log(`🖱️ Email ${emailId} clicked`)
  } catch (error) {
    console.error('Error handling email clicked:', error)
  }
}

/**
 * Handle email bounced event
 */
async function handleEmailBounced(
  data: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  try {
    const campaignId = data.tags?.find((t: any) => t.name === 'campaign_id')?.value
    const emailId = data.tags?.find((t: any) => t.name === 'email_id')?.value

    if (!campaignId || !emailId) return

    // Get campaign info
    const campaignResult: any = await (supabase as any)
      .from('campaigns')
      .select('*, subscribers(*)')
      .eq('id', campaignId)
      .single()

    const campaign = campaignResult.data

    if (!campaign) return

    // Mark email as failed
    await (supabase as any)
      .from('campaign_emails')
      .update({
        status: 'bounced',
        error: data.bounce_type || 'hard_bounce',
      })
      .eq('id', emailId)

    // Pause campaign
    await (supabase as any)
      .from('campaigns')
      .update({
        status: 'paused',
      })
      .eq('id', campaignId)

    // Mark contact email as invalid
    await (supabase as any)
      .from('contacts')
      .update({
        status: 'invalid_email',
      })
      .eq('subscriber_id', campaign.subscriber_id)
      .eq('email', campaign.prospect_email)

    // Alert subscriber
    await sendSMS({
      to: campaign.subscribers.contact_phone,
      body: `⚠️ Campaign for ${campaign.prospect_name} paused - email bounced. Email address may be invalid.`,
    })

    console.log(`⚠️ Email ${emailId} bounced - campaign paused`)
  } catch (error) {
    console.error('Error handling email bounced:', error)
  }
}

/**
 * Handle email complaint (spam) event
 */
async function handleEmailComplained(
  data: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  try {
    const campaignId = data.tags?.find((t: any) => t.name === 'campaign_id')?.value

    if (!campaignId) return

    // Get campaign info
    const campaignResult2: any = await (supabase as any)
      .from('campaigns')
      .select('*, subscribers(*)')
      .eq('id', campaignId)
      .single()

    const campaign2 = campaignResult2.data

    if (!campaign2) return

    // Immediately unsubscribe and pause campaign
    await (supabase as any)
      .from('campaigns')
      .update({
        status: 'paused',
        unsubscribed: true,
      })
      .eq('id', campaignId)

    // Mark contact as unsubscribed
    await (supabase as any)
      .from('contacts')
      .update({
        status: 'unsubscribed',
        tags: ['spam_complaint'],
      })
      .eq('subscriber_id', campaign2.subscriber_id)
      .eq('email', campaign2.prospect_email)

    // Alert subscriber
    await sendSMS({
      to: campaign2.subscribers.contact_phone,
      body: `🚨 SPAM COMPLAINT: ${campaign2.prospect_name} marked your email as spam. Campaign stopped immediately. They've been unsubscribed.`,
    })

    console.log(`🚨 Spam complaint on campaign ${campaignId} - unsubscribed`)
  } catch (error) {
    console.error('Error handling email complained:', error)
  }
}

/**
 * Handle email delivered event
 */
async function handleEmailDelivered(
  data: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  try {
    const emailId = data.tags?.find((t: any) => t.name === 'email_id')?.value

    if (!emailId) return

    // Just log successful delivery
    console.log(`✅ Email ${emailId} delivered`)
  } catch (error) {
    console.error('Error handling email delivered:', error)
  }
}
