/**
 * Process Campaigns Edge Function
 * Runs every hour via pg_cron
 * Finds due campaign emails and sends them via Resend
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const resend = new Resend(resendApiKey)

interface CampaignEmail {
  id: string
  campaign_id: string
  subscriber_id: string
  sequence_number: number
  subject: string
  body: string
  scheduled_at: string
  status: string
  campaigns: {
    id: string
    prospect_name: string
    prospect_email: string
    status: string
    interval_days: number
    emails_sent: number
    current_email_index: number
    unsubscribed: boolean
  }
  subscribers: {
    id: string
    bot_name: string
    business_name: string
    billing_status: string
    email: string
  }
}

serve(async (req) => {
  try {
    console.log('🚀 Process Campaigns Edge Function started')

    // Verify this is called from authorized source (pg_cron or service role)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Find all emails due to send
    const { data: dueEmails, error: fetchError } = await supabase
      .from('campaign_emails')
      .select(`
        *,
        campaigns (
          id,
          prospect_name,
          prospect_email,
          status,
          interval_days,
          emails_sent,
          current_email_index,
          unsubscribed
        ),
        subscribers (
          id,
          bot_name,
          business_name,
          billing_status,
          email
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(100) // Process 100 at a time

    if (fetchError) {
      console.error('Error fetching due emails:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch emails', details: fetchError }),
        { status: 500 }
      )
    }

    if (!dueEmails || dueEmails.length === 0) {
      console.log('✅ No emails due to send')
      return new Response(
        JSON.stringify({ message: 'No emails due', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Found ${dueEmails.length} emails due to send`)

    let sent = 0
    let failed = 0
    let skipped = 0

    // Process each due email
    for (const email of dueEmails as CampaignEmail[]) {
      try {
        // Pre-flight checks
        // 1. Campaign must still be active
        if (email.campaigns.status !== 'active') {
          console.log(`⏭️  Skipping email ${email.id} - campaign ${email.campaigns.status}`)
          skipped++
          continue
        }

        // 2. Subscriber must be active
        if (email.subscribers.billing_status !== 'active') {
          console.log(`⏭️  Skipping email ${email.id} - subscriber not active`)
          skipped++
          continue
        }

        // 3. Check feature flag
        const { data: featureFlag } = await supabase
          .from('feature_flags')
          .select('enabled')
          .eq('subscriber_id', email.subscriber_id)
          .eq('feature_name', 'campaigns')
          .single()

        if (!featureFlag?.enabled) {
          console.log(`⏭️  Skipping email ${email.id} - campaigns feature not enabled`)
          skipped++
          continue
        }

        // 4. Check not unsubscribed
        if (email.campaigns.unsubscribed) {
          console.log(`⏭️  Skipping email ${email.id} - prospect unsubscribed`)
          skipped++
          continue
        }

        // Send via Resend
        console.log(`📤 Sending email ${email.sequence_number} to ${email.campaigns.prospect_email}`)

        const { data: resendData, error: resendError } = await resend.emails.send({
          from: `${email.subscribers.bot_name} <jordan@hireyourbot.com>`,
          to: email.campaigns.prospect_email,
          subject: email.subject,
          html: formatEmailBody(email.body, email.campaigns.prospect_name, email.campaign_id),
          tags: [
            { name: 'campaign_id', value: email.campaign_id },
            { name: 'email_id', value: email.id },
            { name: 'sequence', value: email.sequence_number.toString() },
          ],
        })

        if (resendError) {
          throw resendError
        }

        // Update email status
        await supabase
          .from('campaign_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_email_id: resendData?.id || null,
          })
          .eq('id', email.id)

        // Update campaign counters
        const nextSendAt = calculateNextSendTime(
          email.campaigns.interval_days,
          email.sequence_number,
          (dueEmails as CampaignEmail[]).filter(
            (e) => e.campaign_id === email.campaign_id
          ).length
        )

        await supabase
          .from('campaigns')
          .update({
            emails_sent: email.campaigns.emails_sent + 1,
            current_email_index: email.sequence_number,
            next_send_at: nextSendAt,
          })
          .eq('id', email.campaign_id)

        // Log cost event
        await supabase.from('cost_events').insert({
          subscriber_id: email.subscriber_id,
          event_type: 'campaign_email_sent',
          skill_name: 'campaigns',
          provider: 'resend',
          units: 1,
          unit_type: 'email',
          cost_usd: 0.0008, // Resend cost per email
          markup_pct: 150,
          bill_amount: 0.002,
          billable: true,
          created_at: new Date().toISOString(),
        })

        sent++
        console.log(`✅ Email ${email.id} sent successfully`)
      } catch (error) {
        console.error(`❌ Failed to send email ${email.id}:`, error)

        // Mark as failed - will retry next hour
        await supabase
          .from('campaign_emails')
          .update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', email.id)

        failed++
      }
    }

    console.log(`✅ Process Campaigns complete: ${sent} sent, ${failed} failed, ${skipped} skipped`)

    return new Response(
      JSON.stringify({
        message: 'Processing complete',
        processed: dueEmails.length,
        sent: sent,
        failed: failed,
        skipped: skipped,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Process Campaigns error:', error)
    return new Response(
      JSON.stringify({
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

/**
 * Format email body with unsubscribe link
 */
function formatEmailBody(body: string, prospectName: string, campaignId: string): string {
  const unsubscribeUrl = `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/unsubscribe?c=${campaignId}`

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">
${body}
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
      <p>You're receiving this because you expressed interest in our services.</p>
      <p><a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe from this campaign</a></p>
    </div>
  </body>
</html>
`
}

/**
 * Calculate next send time for campaign
 */
function calculateNextSendTime(
  intervalDays: number,
  currentSequence: number,
  remainingInBatch: number
): string | null {
  if (remainingInBatch <= 1) {
    // This is the last one in current batch
    // Next send is interval_days from now
    const next = new Date()
    next.setDate(next.getDate() + intervalDays)
    return next.toISOString()
  }

  // More emails in this batch - next one sends in the next hour
  const next = new Date()
  next.setHours(next.getHours() + 1)
  return next.toISOString()
}
