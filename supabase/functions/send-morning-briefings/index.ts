/**
 * Send Morning Briefings Edge Function
 * Runs daily at 6am CST via pg_cron
 * Sends personalized morning brief to each active subscriber
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    console.log('🌅 Morning Briefing Edge Function started')

    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get all active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('status', 'active')
      .eq('billing_status', 'active')

    if (subError) {
      console.error('Error fetching subscribers:', subError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscribers' }),
        { status: 500 }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No active subscribers found')
      return new Response(
        JSON.stringify({ message: 'No active subscribers', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Sending briefings to ${subscribers.length} subscribers`)

    let sent = 0
    let failed = 0

    for (const subscriber of subscribers) {
      try {
        // Generate personalized briefing
        const briefing = await generateBriefing(subscriber)

        // Send via SMS
        await sendSMS(subscriber.contact_phone, briefing)

        sent++
        console.log(`✅ Briefing sent to ${subscriber.contact_name}`)
      } catch (error) {
        console.error(`❌ Failed to send briefing to ${subscriber.contact_name}:`, error)
        failed++
      }
    }

    console.log(`✅ Morning Briefings complete: ${sent} sent, ${failed} failed`)

    return new Response(
      JSON.stringify({
        message: 'Briefings sent',
        total: subscribers.length,
        sent: sent,
        failed: failed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Morning Briefing error:', error)
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
 * Generate personalized morning briefing
 */
async function generateBriefing(subscriber: any): Promise<string> {
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })

  // Get yesterday's stats
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStart = yesterday.toISOString().split('T')[0]

  // Fetch yesterday's activity
  const { data: calls } = await supabase
    .from('call_summaries')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .gte('created_at', `${yesterdayStart}T00:00:00`)
    .lt('created_at', `${yesterdayStart}T23:59:59`)

  const { data: commands } = await supabase
    .from('commands_log')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .gte('created_at', `${yesterdayStart}T00:00:00`)
    .lt('created_at', `${yesterdayStart}T23:59:59`)

  const { data: emails } = await supabase
    .from('campaign_emails')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .eq('status', 'sent')
    .gte('sent_at', `${yesterdayStart}T00:00:00`)
    .lt('sent_at', `${yesterdayStart}T23:59:59`)

  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .eq('status', 'published')
    .gte('published_at', `${yesterdayStart}T00:00:00`)
    .lt('published_at', `${yesterdayStart}T23:59:59`)

  // Get today's scheduled items
  const todayStr = today.toISOString().split('T')[0]

  const { data: todaysCalls } = await supabase
    .from('scheduled_tasks')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .eq('task_type', 'outbound_call')
    .gte('scheduled_at', `${todayStr}T00:00:00`)
    .lt('scheduled_at', `${todayStr}T23:59:59`)

  // Get urgent items (from unknown_requests or campaigns needing attention)
  const { data: urgent } = await supabase
    .from('campaigns')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .in('status', ['preview', 'paused'])
    .limit(3)

  // Build briefing
  let briefing = `${subscriber.bot_name.toUpperCase()}'S MORNING BRIEF — ${dayName}, ${dateStr}\n\n`

  briefing += `Good morning ${subscriber.contact_name}!\n\n`

  // Overnight recap
  if (calls?.length || commands?.length || emails?.length || posts?.length) {
    briefing += `OVERNIGHT RECAP\n`
    if (calls?.length) {
      briefing += `📞 ${calls.length} call${calls.length > 1 ? 's' : ''} handled\n`
    }
    if (commands?.length) {
      briefing += `💬 ${commands.length} command${commands.length > 1 ? 's' : ''} executed\n`
    }
    if (emails?.length) {
      briefing += `📧 ${emails.length} campaign email${emails.length > 1 ? 's' : ''} sent\n`
    }
    if (posts?.length) {
      briefing += `📱 ${posts.length} social post${posts.length > 1 ? 's' : ''} published\n`
    }
    briefing += '\n'
  }

  // Today's schedule
  if (todaysCalls?.length) {
    briefing += `TODAY'S SCHEDULE\n`
    todaysCalls.forEach((task: any) => {
      const time = new Date(task.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
      briefing += `${time} - ${task.description}\n`
    })
    briefing += '\n'
  }

  // Needs attention
  if (urgent?.length) {
    briefing += `NEEDS YOUR ATTENTION\n`
    urgent.forEach((item: any) => {
      if (item.status === 'preview') {
        briefing += `🟡 Campaign for ${item.prospect_name} awaiting approval\n`
      } else if (item.status === 'paused') {
        briefing += `🟡 Campaign for ${item.prospect_name} is paused\n`
      }
    })
    briefing += '\n'
  }

  briefing += `Have a great ${dayName}. I've got everything else.\n`
  briefing += `— ${subscriber.bot_name}`

  return briefing
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(to: string, body: string): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`

  const formData = new URLSearchParams()
  formData.append('To', to)
  formData.append('From', twilioPhoneNumber)
  formData.append('Body', body)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Twilio error: ${error}`)
  }
}
