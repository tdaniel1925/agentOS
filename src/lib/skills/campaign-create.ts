/**
 * Campaign Create Skill
 * Creates multi-email nurture campaigns with AI-generated content
 * Uses Claude Opus for research and email generation
 */

import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend/client'
import { sendSMS } from '@/lib/twilio/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface CreateCampaignParams {
  prospectName: string
  prospectEmail: string
  prospectPhone?: string
  industry?: string
  goal: string
  sequenceLength?: number
  intervalDays?: number
  subscriber: any
}

interface CampaignResult {
  success: boolean
  message: string
  campaignId?: string
}

/**
 * Create a nurture campaign (async operation)
 * Sends immediate acknowledgment, then processes in background
 */
export async function createCampaign(
  params: CreateCampaignParams
): Promise<CampaignResult> {
  const {
    prospectName,
    prospectEmail,
    prospectPhone,
    industry,
    goal,
    sequenceLength = 45,
    intervalDays = 4,
    subscriber,
  } = params

  const supabase = createServiceClient()

  try {
    // Validate email format
    if (!isValidEmail(prospectEmail)) {
      return {
        success: false,
        message: `${prospectEmail} doesn't look like a valid email. Can you double-check it?`,
      }
    }

    // Check if subscriber has campaigns feature
    const { data: feature } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('subscriber_id', subscriber.id)
      .eq('feature_name', 'campaigns')
      .single()

    if (!feature?.enabled) {
      return {
        success: false,
        message: 'Email campaigns require the Nurture Campaigns skill ($49/mo). Want to add it? Reply YES.',
      }
    }

    // Send immediate acknowledgment
    await sendSMS({
      to: subscriber.contact_phone,
      body: `Creating ${prospectName}'s campaign now. This takes about 60 seconds — I'll text you preview #1 when ready.`,
    })

    // Process campaign asynchronously
    // In production, this would be a background job/queue
    // For now, we'll process it immediately
    processCampaignCreation({
      prospectName,
      prospectEmail,
      prospectPhone,
      industry: industry || subscriber.business_type,
      goal,
      sequenceLength,
      intervalDays,
      subscriber,
    }).catch((error) => {
      console.error('Campaign creation failed:', error)
      // Send error notification to subscriber
      sendSMS({
        to: subscriber.contact_phone,
        body: `I ran into an issue creating ${prospectName}'s campaign. I've logged it and will try again.`,
      })
    })

    return {
      success: true,
      message: 'Processing started', // User already got SMS acknowledgment
    }
  } catch (error) {
    console.error('Campaign creation error:', error)
    return {
      success: false,
      message: "I ran into an issue setting up that campaign. I've logged it.",
    }
  }
}

/**
 * Process campaign creation (async background task)
 */
async function processCampaignCreation(params: CreateCampaignParams): Promise<void> {
  const supabase = createServiceClient()

  try {
    // Step 1: Research prospect
    const research = await researchProspect({
      prospectName: params.prospectName,
      prospectEmail: params.prospectEmail,
      industry: params.industry!,
      goal: params.goal,
    })

    // Step 2: Generate email sequence
    const emails = await generateEmailSequence({
      prospectName: params.prospectName,
      prospectIndustry: params.industry!,
      subscriberIndustry: params.subscriber.business_type,
      subscriberName: params.subscriber.business_name,
      subscriberBotName: params.subscriber.bot_name,
      goal: params.goal,
      research: research,
      sequenceLength: params.sequenceLength!,
    })

    // Step 3: Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        subscriber_id: params.subscriber.id,
        prospect_name: params.prospectName,
        prospect_email: params.prospectEmail,
        prospect_phone: params.prospectPhone,
        industry: params.industry,
        goal: params.goal,
        sequence_length: params.sequenceLength,
        interval_days: params.intervalDays,
        status: 'preview',
        current_email_index: 0,
        emails_sent: 0,
      })
      .select()
      .single()

    if (campaignError) throw campaignError

    // Step 4: Insert all campaign emails
    const emailRecords = emails.map((email, index) => ({
      campaign_id: campaign.id,
      subscriber_id: params.subscriber.id,
      sequence_number: index + 1,
      subject: email.subject,
      body: email.body,
      status: 'pending',
      // Scheduled times will be set when campaign is approved
      scheduled_at: null,
    }))

    const { error: emailsError } = await supabase
      .from('campaign_emails')
      .insert(emailRecords)

    if (emailsError) throw emailsError

    // Step 5: Send preview email to subscriber
    const previewHtml = buildPreviewEmail({
      subscriberName: params.subscriber.contact_name,
      prospectName: params.prospectName,
      email: emails[0],
      totalEmails: emails.length,
      intervalDays: params.intervalDays!,
    })

    await sendEmail({
      to: params.subscriber.email,
      subject: `[Preview] Campaign for ${params.prospectName} — Approve to launch`,
      html: previewHtml,
    })

    // Step 6: Log campaign creation
    await supabase.from('commands_log').insert({
      subscriber_id: params.subscriber.id,
      channel: 'sms',
      sender_identifier: params.subscriber.contact_phone,
      intent: 'CREATE_CAMPAIGN',
      raw_message: `Campaign for ${params.prospectName}`,
      executed: true,
      response_sent: true,
      created_at: new Date().toISOString(),
    })

    // Step 7: Log costs
    // Claude Opus research + generation (estimate ~10k tokens)
    await supabase.from('cost_events').insert({
      subscriber_id: params.subscriber.id,
      event_type: 'campaign_created',
      skill_name: 'campaign-create',
      provider: 'anthropic',
      model: 'claude-opus-4-6',
      units: 10000,
      unit_type: 'tokens',
      cost_usd: 0.15, // Opus pricing estimate
      markup_pct: 100,
      bill_amount: 0.30,
      billable: true,
      created_at: new Date().toISOString(),
    })

    // Step 8: Send notification SMS
    await sendSMS({
      to: params.subscriber.contact_phone,
      body: `Campaign for ${params.prospectName} ready!\nCheck your email for preview #1.\nReply YES to launch all ${emails.length} emails (every ${params.intervalDays} days)\nOr reply EDIT to change something.`,
    })
  } catch (error) {
    console.error('Campaign processing error:', error)
    throw error
  }
}

/**
 * Research prospect using Claude Opus + web search
 */
async function researchProspect(params: {
  prospectName: string
  prospectEmail: string
  industry: string
  goal: string
}): Promise<string> {
  try {
    const systemPrompt = `You are an expert business researcher. Your job is to research a prospect and provide insights for creating a personalized email nurture campaign.

Research the following:
1. Common pain points for professionals in their industry/role
2. Why they might need the service being offered
3. Best messaging approach for this demographic
4. Relevant industry trends or challenges

Provide a concise research summary (200-400 words) that will be used to write personalized emails.`

    const userPrompt = `Research this prospect:
Name: ${params.prospectName}
Email: ${params.prospectEmail}
Industry: ${params.industry}
Campaign Goal: ${params.goal}

Provide research insights for creating a personalized nurture campaign.`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return content.text
  } catch (error) {
    console.error('Research error:', error)
    // Return basic fallback research
    return `${params.prospectName} works in ${params.industry}. Goal: ${params.goal}`
  }
}

/**
 * Generate full email sequence using Claude Opus
 */
async function generateEmailSequence(params: {
  prospectName: string
  prospectIndustry: string
  subscriberIndustry: string
  subscriberName: string
  subscriberBotName: string
  goal: string
  research: string
  sequenceLength: number
}): Promise<Array<{ subject: string; body: string }>> {
  try {
    const systemPrompt = `You are an expert email copywriter specializing in nurture campaigns for professional services.

Write a ${params.sequenceLength}-email nurture sequence with these requirements:

QUALITY STANDARDS:
- Each email 150-300 words
- Sound like a real person, not AI
- Personally relevant to prospect's background
- Different angle/topic in each email
- Clear but soft call to action
- No hype or sales-y language
- Professional and trustworthy tone

SEQUENCE STRATEGY:
- Email 1-5: Provide value, build trust
- Email 6-15: Share insights, case studies
- Email 16-30: Address objections, demonstrate expertise
- Email 31-45: Gentle CTAs, relationship building

Return ONLY a JSON array of emails:
[
  {
    "subject": "Subject line",
    "body": "Email body in plain text"
  },
  ...
]`

    const userPrompt = `Create ${params.sequenceLength} nurture emails for:

PROSPECT:
- Name: ${params.prospectName}
- Industry: ${params.prospectIndustry}
- Goal: ${params.goal}

SENDER:
- Business: ${params.subscriberName}
- Industry: ${params.subscriberIndustry}
- Signing as: ${params.subscriberBotName}

RESEARCH:
${params.research}

Generate the complete email sequence as JSON array.`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 16000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }

    const emails = JSON.parse(jsonMatch[0])

    // Validate we got the right number of emails
    if (emails.length !== params.sequenceLength) {
      console.warn(
        `Expected ${params.sequenceLength} emails, got ${emails.length}`
      )
    }

    return emails
  } catch (error) {
    console.error('Email generation error:', error)
    // Generate fallback emails
    return generateFallbackEmails(params)
  }
}

/**
 * Generate fallback emails if Claude fails
 */
function generateFallbackEmails(params: {
  prospectName: string
  subscriberName: string
  subscriberBotName: string
  goal: string
  sequenceLength: number
}): Array<{ subject: string; body: string }> {
  const emails: Array<{ subject: string; body: string }> = []

  for (let i = 0; i < params.sequenceLength; i++) {
    emails.push({
      subject: `Following up - ${params.subscriberName}`,
      body: `Hi ${params.prospectName},

I wanted to follow up regarding ${params.goal}.

I'd love to discuss how we can help.

Best regards,
${params.subscriberBotName}
${params.subscriberName}`,
    })
  }

  return emails
}

/**
 * Build preview email HTML
 */
function buildPreviewEmail(params: {
  subscriberName: string
  prospectName: string
  email: { subject: string; body: string }
  totalEmails: number
  intervalDays: number
}): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1B3A7D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">Campaign Preview</h1>
      <p style="margin: 10px 0 0 0;">Email 1 of ${params.totalEmails} for ${params.prospectName}</p>
    </div>

    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 16px;">Hi ${params.subscriberName},</p>

      <p>Here's a preview of the first email in your ${params.totalEmails}-email nurture campaign for ${params.prospectName}. Emails will send every ${params.intervalDays} days after you approve.</p>

      <div style="background-color: white; border-left: 4px solid #C7181F; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <strong style="color: #1B3A7D;">Subject:</strong> ${params.email.subject}
        </div>
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">${params.email.body}</div>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>Next Steps:</strong>
        <ul style="margin: 10px 0;">
          <li>Reply <strong>YES</strong> via text to launch this campaign</li>
          <li>Reply <strong>EDIT</strong> to request changes</li>
          <li>Campaign will send every ${params.intervalDays} days starting tomorrow</li>
        </ul>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        This is an automated preview from your AgentOS assistant. The actual emails will be sent from your business email address.
      </p>
    </div>
  </body>
</html>`
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Approve campaign (called when subscriber replies YES)
 */
export async function approveCampaign(campaignId: string): Promise<void> {
  const supabase = createServiceClient()

  try {
    const now = new Date()
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*, campaign_emails(*)')
      .eq('id', campaignId)
      .single()

    if (!campaign) throw new Error('Campaign not found')

    // Calculate scheduled times
    const intervalMs = campaign.interval_days * 24 * 60 * 60 * 1000
    const emails = campaign.campaign_emails

    for (let i = 0; i < emails.length; i++) {
      const scheduledAt = new Date(now.getTime() + i * intervalMs)

      await supabase
        .from('campaign_emails')
        .update({ scheduled_at: scheduledAt.toISOString() })
        .eq('id', emails[i].id)
    }

    // Update campaign status
    const firstEmailScheduled = new Date(now.getTime() + intervalMs)

    await supabase
      .from('campaigns')
      .update({
        status: 'active',
        approved_at: now.toISOString(),
        next_send_at: firstEmailScheduled.toISOString(),
      })
      .eq('id', campaignId)
  } catch (error) {
    console.error('Campaign approval error:', error)
    throw error
  }
}
