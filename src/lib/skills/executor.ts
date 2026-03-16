/**
 * Skill Executor
 * Routes parsed intents to appropriate skill handlers
 */

import { SMSIntent } from './sms-parser'
import { createServiceClient } from '@/lib/supabase/server'
import { makeOutboundCall } from './outbound-call'
import { createCampaign, approveCampaign } from './campaign-create'
import { createSocialPost, approveSocialPost } from './social-post'
import { generateLeads } from './lead-generate'
import { connectEmail } from './email-connect'
import { checkEmail } from './email-check'

export interface ExecutionResult {
  success: boolean
  message: string
  data?: any
}

/**
 * Execute skill based on parsed intent
 */
export async function executeSkill(
  intent: SMSIntent,
  context: any,
  subscriber: any
): Promise<ExecutionResult> {
  const supabase = createServiceClient()

  try {
    // Route to appropriate skill handler
    switch (intent.intent) {
      // CALL RELATED
      case 'CHECK_MISSED_CALLS':
        return await handleCheckMissedCalls(context, supabase)

      case 'MAKE_OUTBOUND_CALL':
        return await handleMakeOutboundCall(intent, context, subscriber, supabase)

      case 'UPDATE_GREETING':
        return await handleUpdateGreeting(intent, subscriber, supabase)

      case 'PAUSE_CALLS':
      case 'RESUME_CALLS':
        return await handleCallControl(intent, subscriber, supabase)

      // CONTROL RELATED
      case 'PAUSE_BOT':
      case 'RESUME_BOT':
        return await handleBotControl(intent, subscriber, supabase)

      case 'CHECK_STATUS':
        return await handleCheckStatus(context, subscriber, supabase)

      // REPORT RELATED
      case 'WEEKLY_REPORT':
      case 'CALL_REPORT':
      case 'COST_REPORT':
        return await handleReport(intent, context, subscriber, supabase)

      // EMAIL RELATED
      case 'CONNECT_EMAIL':
      case 'CHECK_EMAIL':
      case 'SEND_EMAIL':
      case 'CREATE_CAMPAIGN':
      case 'PAUSE_CAMPAIGN':
      case 'CAMPAIGN_REPORT':
        return await handleEmailCommand(intent, context, subscriber, supabase)

      // SOCIAL RELATED
      case 'CREATE_POST':
      case 'SCHEDULE_POSTS':
      case 'SOCIAL_REPORT':
        return await handleSocialCommand(intent, context, subscriber, supabase)

      // LEAD RELATED
      case 'GENERATE_LEADS':
      case 'FOLLOW_UP_LEADS':
        return await handleLeadCommand(intent, context, subscriber, supabase)

      // APPOINTMENT RELATED
      case 'CHECK_SCHEDULE':
      case 'BOOK_APPOINTMENT':
      case 'CANCEL_APPOINTMENT':
        return await handleAppointmentCommand(intent, context, subscriber, supabase)

      // SKILL MANAGEMENT
      case 'ADD_SKILL':
      case 'REMOVE_SKILL':
        return await handleSkillManagement(intent, subscriber, supabase)

      // UNKNOWN
      case 'UNKNOWN':
      default:
        return await handleUnknownCommand(intent, subscriber, supabase)
    }
  } catch (error) {
    console.error('Skill execution error:', error)
    return {
      success: false,
      message: "I ran into an issue processing that. I've logged it and will try to do better.",
    }
  }
}

/**
 * Handle CHECK_MISSED_CALLS intent
 */
async function handleCheckMissedCalls(
  context: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<ExecutionResult> {
  const { recentCalls } = context

  if (!recentCalls || recentCalls.length === 0) {
    return {
      success: true,
      message: "You haven't missed any calls recently. All clear!",
    }
  }

  // Filter for today
  const today = new Date().toISOString().split('T')[0]
  const todaysCalls = recentCalls.filter((call: any) =>
    call.created_at.startsWith(today) && call.call_type === 'inbound'
  )

  if (todaysCalls.length === 0) {
    return {
      success: true,
      message: "No calls today. I'll let you know when someone reaches out!",
    }
  }

  // Build summary
  let summary = `You had ${todaysCalls.length} call${todaysCalls.length > 1 ? 's' : ''} today:\n\n`

  todaysCalls.forEach((call: any, index: number) => {
    const time = new Date(call.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
    summary += `${index + 1}. ${time} - ${call.caller_number || 'Unknown'}\n`
    if (call.summary) {
      summary += `   ${call.summary}\n`
    }
  })

  return {
    success: true,
    message: summary.trim(),
  }
}

/**
 * Handle MAKE_OUTBOUND_CALL intent
 */
async function handleMakeOutboundCall(
  intent: SMSIntent,
  context: any,
  subscriber: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<ExecutionResult> {
  const { contact_name, contact_number, task, tone } = intent.entities

  if (!contact_number || !task) {
    return {
      success: false,
      message: "I need a phone number and task to make the call. Try: 'Call John at 555-1234 about his renewal'",
    }
  }

  // Make the outbound call
  const result = await makeOutboundCall({
    contactName: contact_name,
    contactNumber: contact_number,
    task: task,
    tone: tone || 'professional',
    subscriber: subscriber,
    context: context,
  })

  return result
}

/**
 * Handle bot control (pause/resume/stop/inbound-only/vacation)
 */
async function handleBotControl(
  intent: SMSIntent,
  subscriber: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<ExecutionResult> {
  const { duration, reason, mode, feature, task } = intent.entities

  // PAUSE_BOT
  if (intent.intent === 'PAUSE_BOT') {
    // Detect if this is a specific mode request
    const rawMessage = intent.entities.raw_message?.toLowerCase() || ''

    // Inbound-only mode
    if (rawMessage.includes('meeting') || rawMessage.includes('inbound only')) {
      let modeExpiresAt = null
      if (duration) {
        modeExpiresAt = calculatePauseUntil(duration)
      }

      await (supabase as any).from('control_states').upsert({
        subscriber_id: subscriber.id,
        mode: 'inbound-only',
        mode_expires_at: modeExpiresAt,
        updated_at: new Date().toISOString(),
      })

      const message = modeExpiresAt
        ? `Inbound only mode on until ${new Date(modeExpiresAt).toLocaleTimeString()}. I'll answer calls but won't make any outbound moves.`
        : "Inbound only mode on. I'll answer calls but won't make any outbound moves. Text RESUME when ready."

      return { success: true, message }
    }

    // Vacation mode
    if (rawMessage.includes('vacation') || rawMessage.includes('away')) {
      let modeExpiresAt = null
      if (duration) {
        modeExpiresAt = calculatePauseUntil(duration)
      }

      await (supabase as any).from('control_states').upsert({
        subscriber_id: subscriber.id,
        mode: 'vacation',
        mode_expires_at: modeExpiresAt,
        updated_at: new Date().toISOString(),
      })

      const message = modeExpiresAt
        ? `Vacation mode on until ${new Date(modeExpiresAt).toLocaleDateString()}. I'll take messages and answer urgent calls only.`
        : "Vacation mode on. I'll take messages and answer urgent calls only. Text RESUME when you're back."

      return { success: true, message }
    }

    // Feature-specific pause
    if (feature) {
      // Get current control state
      const queryResult: any = await (supabase as any)
        .from('control_states')
        .select('paused_features')
        .eq('subscriber_id', subscriber.id)
        .single()

      const currentState = queryResult.data

      const pausedFeatures = currentState?.paused_features || []
      if (!pausedFeatures.includes(feature)) {
        pausedFeatures.push(feature)
      }

      await (supabase as any).from('control_states').upsert({
        subscriber_id: subscriber.id,
        paused_features: pausedFeatures,
        updated_at: new Date().toISOString(),
      })

      return {
        success: true,
        message: `${feature} paused. Resume with 'resume ${feature}'.`,
      }
    }

    // Emergency stop
    if (rawMessage.includes('stop everything') || rawMessage === 'stop') {
      await (supabase as any).from('control_states').upsert({
        subscriber_id: subscriber.id,
        mode: 'emergency_stop',
        paused_until: null,
        updated_at: new Date().toISOString(),
      })

      return {
        success: true,
        message: "EMERGENCY STOP activated. All tasks paused. Text RESUME when ready.",
      }
    }

    // Regular pause
    let pausedUntil = null
    if (duration) {
      pausedUntil = calculatePauseUntil(duration)
    }

    await (supabase as any).from('control_states').upsert({
      subscriber_id: subscriber.id,
      mode: 'paused',
      paused_until: pausedUntil,
      updated_at: new Date().toISOString(),
    })

    const message = pausedUntil
      ? `Paused until ${new Date(pausedUntil).toLocaleTimeString()}. Text RESUME to start earlier.`
      : "Paused. How long? Reply with '1 hour', '30 minutes', or BACK when done."

    return { success: true, message }
  }

  // RESUME_BOT
  if (intent.intent === 'RESUME_BOT') {
    // Check if resuming specific feature
    if (feature) {
      const queryResult: any = await (supabase as any)
        .from('control_states')
        .select('paused_features')
        .eq('subscriber_id', subscriber.id)
        .single()

      const currentState = queryResult.data

      const pausedFeatures = (currentState?.paused_features || []).filter(
        (f: string) => f !== feature
      )

      await (supabase as any).from('control_states').upsert({
        subscriber_id: subscriber.id,
        paused_features: pausedFeatures,
        updated_at: new Date().toISOString(),
      })

      return {
        success: true,
        message: `${feature} resumed!`,
      }
    }

    // Full resume
    await (supabase as any).from('control_states').upsert({
      subscriber_id: subscriber.id,
      mode: 'full',
      paused_until: null,
      paused_features: null,
      mode_expires_at: null,
      priority_task: null,
      updated_at: new Date().toISOString(),
    })

    return {
      success: true,
      message: "Back to full operation. I'm on it!",
    }
  }

  return { success: false, message: 'Unknown control command' }
}

/**
 * Handle CHECK_STATUS intent
 */
async function handleCheckStatus(
  context: any,
  subscriber: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<ExecutionResult> {
  const { controlState, recentCommands } = context

  let status = `Status: ${subscriber.status === 'active' ? '🟢 Active' : '🔴 Offline'}\n`

  if (controlState?.mode === 'paused') {
    status += `Mode: Paused\n`
  } else {
    status += `Mode: Full operation\n`
  }

  status += `\nLast 24 hours:\n`
  status += `- ${recentCommands.length} commands executed\n`
  status += `- ${context.recentCalls.length} calls handled\n`

  return { success: true, message: status }
}

/**
 * Handle unknown commands
 */
async function handleUnknownCommand(
  intent: SMSIntent,
  subscriber: any,
  supabase: ReturnType<typeof createServiceClient>
): Promise<ExecutionResult> {
  const rawMessage = intent.entities.raw_message || ''
  const messageLower = rawMessage.toLowerCase()

  // Detect if request maps to an available add-on
  const upgrade = detectUpgradeOpportunity(messageLower)

  // Check if they already have this feature
  if (upgrade) {
    const queryResult: any = await (supabase as any)
      .from('feature_flags')
      .select('feature_name')
      .eq('subscriber_id', subscriber.id)
      .eq('enabled', true)

    const activeFeatures = queryResult.data

    const hasFeature = activeFeatures?.some(
      (f: any) => f.feature_name.toLowerCase() === upgrade.featureName.toLowerCase()
    )

    if (hasFeature) {
      return {
        success: true,
        message: `You already have the ${upgrade.featureName} skill! Try asking me to use it.`,
      }
    }
  }

  // Log to unknown_requests
  await (supabase as any).from('unknown_requests').insert({
    subscriber_id: subscriber.id,
    channel: 'sms',
    sender_identifier: subscriber.contact_phone,
    raw_message: rawMessage,
    suggested_feature: upgrade?.featureName || intent.entities.requested_action || 'unknown',
    created_at: new Date().toISOString(),
  })

  // Build response based on upgrade availability
  let message = ''

  if (upgrade) {
    message = `I can learn how to do that! ${upgrade.featureName} is $${upgrade.price}/mo extra.\n\n`
    message += `Want me to upgrade myself? Reply YES to add ${upgrade.featureName}.`
  } else {
    message = "I may need my programming updated for that.\n\n"
    message += "What I CAN do right now:\n"
    message += "- Check your missed calls\n"
    message += "- Make business calls for you\n"
    message += "- Pause/resume my operations\n"
    message += "- Give you status reports\n\n"
    message += "Reply SUGGEST and I'll pass this to my team!"
  }

  return { success: true, message }
}

/**
 * Detect if unknown request maps to an available add-on
 */
function detectUpgradeOpportunity(
  message: string
): { featureName: string; price: number } | null {
  // Social media
  if (
    message.includes('post') ||
    message.includes('instagram') ||
    message.includes('facebook') ||
    message.includes('linkedin') ||
    message.includes('social')
  ) {
    return { featureName: 'Social Media', price: 49 }
  }

  // Lead generation
  if (
    message.includes('leads') ||
    message.includes('prospects') ||
    message.includes('find clients') ||
    message.includes('build list')
  ) {
    return { featureName: 'Lead Generation', price: 49 }
  }

  // Email campaigns
  if (
    message.includes('email campaign') ||
    message.includes('newsletter') ||
    message.includes('email blast') ||
    message.includes('drip campaign')
  ) {
    return { featureName: 'Nurture Campaigns', price: 49 }
  }

  // Review requests
  if (
    message.includes('review') ||
    message.includes('testimonial') ||
    message.includes('google review')
  ) {
    return { featureName: 'Review Requests', price: 19 }
  }

  // Referral campaigns
  if (
    message.includes('referral') ||
    message.includes('referral program')
  ) {
    return { featureName: 'Referral Campaigns', price: 29 }
  }

  // Analytics
  if (
    message.includes('analytics') ||
    message.includes('metrics') ||
    message.includes('roi') ||
    message.includes('performance report')
  ) {
    return { featureName: 'Analytics Dashboard', price: 19 }
  }

  return null
}

/**
 * Placeholder handlers for skills to be implemented
 */
async function handleUpdateGreeting(intent: SMSIntent, subscriber: any, supabase: any): Promise<ExecutionResult> {
  return { success: true, message: "Greeting update feature coming soon!" }
}

async function handleCallControl(intent: SMSIntent, subscriber: any, supabase: any): Promise<ExecutionResult> {
  return { success: true, message: "Call control feature coming soon!" }
}

async function handleReport(intent: SMSIntent, context: any, subscriber: any, supabase: any): Promise<ExecutionResult> {
  return { success: true, message: "Reports feature coming soon!" }
}

async function handleEmailCommand(intent: SMSIntent, context: any, subscriber: any, supabase: any): Promise<ExecutionResult> {
  const { prospect_name, prospect_email, prospect_phone, goal, duration, interval } = intent.entities

  // CREATE_CAMPAIGN
  if (intent.intent === 'CREATE_CAMPAIGN') {
    if (!prospect_name || !prospect_email || !goal) {
      return {
        success: false,
        message: "I need prospect name, email, and goal to create a campaign. Try: 'Create a 6 month campaign for John Smith at john@email.com about life insurance'",
      }
    }

    // Parse sequence length from duration (e.g., "6 months" -> 45 emails)
    let sequenceLength = 45 // default 6 months
    if (duration) {
      const monthMatch = duration.match(/(\d+)\s*month/i)
      if (monthMatch) {
        const months = parseInt(monthMatch[1])
        sequenceLength = Math.floor((months * 30) / 4) // Every 4 days
      }
    }

    // Parse interval from entities (e.g., "every 4 days")
    let intervalDays = 4 // default
    if (interval) {
      const dayMatch = interval.match(/(\d+)\s*day/i)
      if (dayMatch) {
        intervalDays = parseInt(dayMatch[1])
      }
    }

    const result = await createCampaign({
      prospectName: prospect_name,
      prospectEmail: prospect_email,
      prospectPhone: prospect_phone,
      industry: intent.entities.industry,
      goal: goal,
      sequenceLength: sequenceLength,
      intervalDays: intervalDays,
      subscriber: subscriber,
    })

    return result
  }

  // PAUSE_CAMPAIGN
  if (intent.intent === 'PAUSE_CAMPAIGN') {
    // Find active campaigns
    const queryResult: any = await (supabase as any)
      .from('campaigns')
      .select('id, prospect_name')
      .eq('subscriber_id', subscriber.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    const campaigns = queryResult.data

    if (!campaigns || campaigns.length === 0) {
      return {
        success: true,
        message: "You don't have any active campaigns running right now.",
      }
    }

    // Pause the most recent campaign (or specific one if name provided)
    let campaignToPause = campaigns[0]
    if (prospect_name) {
      const found = campaigns.find((c: any) =>
        c.prospect_name.toLowerCase().includes(prospect_name.toLowerCase())
      )
      if (found) campaignToPause = found
    }

    await supabase
      .from('campaigns')
      .update({ status: 'paused' })
      .eq('id', campaignToPause.id)

    return {
      success: true,
      message: `Campaign for ${campaignToPause.prospect_name} paused. Reply RESUME CAMPAIGN to continue.`,
    }
  }

  // CAMPAIGN_REPORT
  if (intent.intent === 'CAMPAIGN_REPORT') {
    const queryResult: any = await (supabase as any)
      .from('campaigns')
      .select('*')
      .eq('subscriber_id', subscriber.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const campaigns = queryResult.data

    if (!campaigns || campaigns.length === 0) {
      return {
        success: true,
        message: "You haven't created any campaigns yet. Want to start one?",
      }
    }

    let report = `Campaign Report:\n\n`
    campaigns.forEach((c: any) => {
      report += `${c.prospect_name}: ${c.emails_sent}/${c.sequence_length} sent, ${c.opens} opens, ${c.replies} replies (${c.status})\n`
    })

    return { success: true, message: report.trim() }
  }

  // CHECK_EMAIL - for inbox checking
  if (intent.intent === 'CHECK_EMAIL') {
    const result = await checkEmail({ subscriber: subscriber })
    return result
  }

  // CONNECT_EMAIL - OAuth flow
  if (intent.intent === 'CONNECT_EMAIL') {
    console.log('[Executor] CONNECT_EMAIL handler triggered', { subscriber_id: subscriber.id })

    const provider = (intent.entities.provider || 'outlook').toLowerCase()

    if (provider !== 'gmail' && provider !== 'outlook') {
      return {
        success: false,
        message: 'I can connect Gmail or Outlook. Which would you like?',
      }
    }

    const result = await connectEmail({
      provider: provider as 'gmail' | 'outlook',
      subscriber: subscriber,
    })

    console.log('[Executor] CONNECT_EMAIL result', result)
    return result
  }

  // SEND_EMAIL - one-off email
  if (intent.intent === 'SEND_EMAIL') {
    return { success: true, message: "One-off emails coming soon! For now, use campaigns for email outreach." }
  }

  return { success: true, message: "Email features require the Email Campaign skill ($49/mo). Want to add it? Reply YES." }
}

async function handleSocialCommand(intent: SMSIntent, context: any, subscriber: any, supabase: any): Promise<ExecutionResult> {
  const { topic, count, platform } = intent.entities

  // CREATE_POST
  if (intent.intent === 'CREATE_POST') {
    if (!topic) {
      return {
        success: false,
        message: "I need a topic to create posts about. Try: 'Create 3 posts about life insurance'",
      }
    }

    const postCount = count || 1
    const platforms = platform ? [platform] : ['facebook', 'instagram', 'linkedin']

    const result = await createSocialPost({
      topic: topic,
      count: postCount,
      platforms: platforms,
      subscriber: subscriber,
    })

    return result
  }

  // SCHEDULE_POSTS
  if (intent.intent === 'SCHEDULE_POSTS') {
    return {
      success: true,
      message: "Scheduled posting coming soon! For now, I'll create posts and you can approve them individually.",
    }
  }

  // SOCIAL_REPORT
  if (intent.intent === 'SOCIAL_REPORT') {
    const queryResult: any = await (supabase as any)
      .from('scheduled_posts')
      .select('*')
      .eq('subscriber_id', subscriber.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const posts = queryResult.data

    if (!posts || posts.length === 0) {
      return {
        success: true,
        message: "You haven't scheduled any social posts yet. Want to create some?",
      }
    }

    const scheduled = posts.filter((p: any) => p.status === 'scheduled').length
    const published = posts.filter((p: any) => p.status === 'published').length

    return {
      success: true,
      message: `Social Media Report:\n${scheduled} posts scheduled\n${published} posts published\nCheck your dashboard for engagement stats.`,
    }
  }

  return { success: true, message: "Social media features require the Social Media skill ($49/mo). Want to add it? Reply YES." }
}

async function handleLeadCommand(intent: SMSIntent, context: any, subscriber: any, supabase: any): Promise<ExecutionResult> {
  const { target_type, location, count, qualifier } = intent.entities

  // GENERATE_LEADS
  if (intent.intent === 'GENERATE_LEADS') {
    if (!target_type || !location) {
      return {
        success: false,
        message: "I need a target type and location. Try: 'Find 50 insurance agents in Dallas, TX'",
      }
    }

    const result = await generateLeads({
      targetType: target_type,
      location: location,
      count: count || 50,
      qualifier: qualifier,
      subscriber: subscriber,
    })

    return result
  }

  // FOLLOW_UP_LEADS
  if (intent.intent === 'FOLLOW_UP_LEADS') {
    // Get recent leads
    const queryResult: any = await (supabase as any)
      .from('contacts')
      .select('*')
      .eq('subscriber_id', subscriber.id)
      .eq('source', 'lead_generation')
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(10)

    const recentLeads = queryResult.data

    if (!recentLeads || recentLeads.length === 0) {
      return {
        success: true,
        message: "You don't have any new leads to follow up with. Want me to generate some?",
      }
    }

    return {
      success: true,
      message: `You have ${recentLeads.length} new leads waiting. Want me to create a campaign for all of them? Reply YES.`,
    }
  }

  return { success: true, message: "Lead generation requires the Lead Generation skill ($49/mo). Want to add it? Reply YES." }
}

async function handleAppointmentCommand(intent: SMSIntent, context: any, subscriber: any, supabase: any): Promise<ExecutionResult> {
  return { success: true, message: "Appointment features coming soon!" }
}

async function handleSkillManagement(intent: SMSIntent, subscriber: any, supabase: any): Promise<ExecutionResult> {
  return { success: true, message: "Skill management coming soon! For now, manage skills at theapexbots.com/app/skills" }
}

/**
 * Calculate pause_until timestamp from duration string
 */
function calculatePauseUntil(duration: string): string {
  const now = new Date()

  // Parse duration (e.g., "2 hours", "30 minutes", "1 hour")
  const match = duration.match(/(\d+)\s*(hour|minute|min|hr)s?/i)
  if (!match) {
    // Default to 1 hour if can't parse
    now.setHours(now.getHours() + 1)
    return now.toISOString()
  }

  const amount = parseInt(match[1])
  const unit = match[2].toLowerCase()

  if (unit.startsWith('h')) {
    now.setHours(now.getHours() + amount)
  } else if (unit.startsWith('m')) {
    now.setMinutes(now.getMinutes() + amount)
  }

  return now.toISOString()
}
