/**
 * Feature Request Report Edge Function
 * Runs every Monday at 7am via pg_cron
 * Emails BotMakers a ranked list of requested features
 * from the unknown_requests table
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const botmakersAdminEmail = Deno.env.get('BOTMAKERS_ADMIN_EMAIL')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    console.log('📊 Feature Request Report Edge Function started')

    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response('Unauthorized', { status: 401 })
    }

    // ── Get unknown requests from last 7 days ────────
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: requests, error: fetchError } = await supabase
      .from('unknown_requests')
      .select('suggested_feature, subscriber_id')
      .gte('created_at', sevenDaysAgo.toISOString())
      .not('suggested_feature', 'is', null)

    if (fetchError) {
      console.error('Error fetching unknown requests:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch requests' }),
        { status: 500 }
      )
    }

    if (!requests || requests.length === 0) {
      console.log('No unknown requests this week')
      return new Response(
        JSON.stringify({ message: 'No requests this week', sent: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ── Count and rank features ──────────────────────
    const counts: Record<string, Set<string>> = {}

    requests.forEach((r) => {
      if (!counts[r.suggested_feature]) {
        counts[r.suggested_feature] = new Set()
      }
      counts[r.suggested_feature].add(r.subscriber_id)
    })

    // Convert to array and sort by unique subscriber count
    const ranked = Object.entries(counts)
      .map(([feature, subscriberSet]) => ({
        feature,
        count: subscriberSet.size
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    if (ranked.length === 0) {
      console.log('No rankable features this week')
      return new Response(
        JSON.stringify({ message: 'No rankable features', sent: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ── Build report ─────────────────────────────────
    const weekOf = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    const report = [
      'AGENTOS FEATURE REQUESTS',
      `Week of ${weekOf}`,
      '─────────────────────────────────────────',
      '',
      'TOP REQUESTS THIS WEEK:',
      ...ranked.map((item, i) =>
        `${i + 1}. "${item.feature}" — ${item.count} subscriber${item.count > 1 ? 's' : ''}`
      ),
      '',
      '─────────────────────────────────────────',
      `Total unique requests: ${requests.length}`,
      `Total unique subscribers: ${new Set(requests.map(r => r.subscriber_id)).size}`,
      '',
      'TOP BUILD RECOMMENDATION:',
      `→ "${ranked[0].feature}" requested by ${ranked[0].count} subscriber${ranked[0].count > 1 ? 's' : ''}`,
      '',
      'NEXT STEPS:',
      '1. Review technical feasibility of top requests',
      '2. Estimate development effort for each feature',
      '3. Calculate potential revenue impact',
      '4. Prioritize based on subscriber demand + revenue + effort',
      '',
      '─────────────────────────────────────────',
      'View all unknown requests:',
      'SELECT * FROM unknown_requests',
      'WHERE created_at >= NOW() - INTERVAL \'7 days\'',
      'ORDER BY created_at DESC;'
    ].join('\n')

    // ── Send email via Resend ────────────────────────
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AgentOS Reports <reports@hireyourbot.com>',
        to: botmakersAdminEmail,
        subject: `AgentOS Feature Requests — Week of ${weekOf}`,
        text: report
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send email:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorText }),
        { status: 500 }
      )
    }

    console.log(`✅ Feature request report sent to ${botmakersAdminEmail}`)

    return new Response(
      JSON.stringify({
        message: 'Report sent',
        total_requests: requests.length,
        unique_subscribers: new Set(requests.map(r => r.subscriber_id)).size,
        top_feature: ranked[0].feature,
        top_feature_count: ranked[0].count
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Feature request report error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
