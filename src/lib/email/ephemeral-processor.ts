/**
 * Ephemeral Email Processor
 * Analyzes emails with Claude and immediately deletes full content
 * Only stores metadata and AI-generated summaries
 *
 * Privacy-first: Full email content never touches the database
 */

import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface EmailData {
  from: string
  fromName: string
  subject: string
  textBody: string
  htmlBody: string
  strippeTextBody: string
  receivedAt: string
  messageId: string
}

interface ProcessEmailParams {
  subscriber: any
  emailData: EmailData
}

interface EmailAnalysis {
  category: 'urgent' | 'client' | 'lead' | 'admin' | 'junk'
  summary: string
  actionNeeded: boolean
  sentiment: 'positive' | 'neutral' | 'negative'
}

/**
 * Process inbound email ephemerally
 * IMPORTANT: Email content is NEVER stored - only metadata and AI summary
 */
export async function processInboundEmail(params: ProcessEmailParams): Promise<void> {
  const { subscriber, emailData } = params
  const supabase = createServiceClient()

  try {
    console.log('🔍 [Ephemeral] Step 1: Analyzing email with Claude...')

    // Step 1: Analyze email with Claude (ephemeral - in memory only)
    const analysis = await analyzeEmailWithClaude(emailData, subscriber)

    console.log('✅ [Ephemeral] Analysis complete:', {
      category: analysis.category,
      actionNeeded: analysis.actionNeeded,
      sentiment: analysis.sentiment
    })

    // Step 2: Store ONLY metadata (no full content)
    console.log('💾 [Ephemeral] Step 2: Storing metadata only (no content)...')

    await (supabase as any).from('email_inbound_log').insert({
      subscriber_id: subscriber.id,
      from_address: emailData.from,
      subject: emailData.subject,
      received_at: emailData.receivedAt,
      category: analysis.category,
      processed_at: new Date().toISOString(),
      summary_sent: false,
    })

    console.log('✅ [Ephemeral] Metadata stored')

    // Step 3: Send SMS summary to user
    console.log('📱 [Ephemeral] Step 3: Sending SMS summary...')

    const smsMessage = buildSMSSummary(emailData, analysis)

    await sendSMS({
      to: subscriber.control_phone,
      body: smsMessage,
    })

    console.log('✅ [Ephemeral] SMS summary sent')

    // Step 4: Update log
    await (supabase as any)
      .from('email_inbound_log')
      .update({ summary_sent: true })
      .eq('subscriber_id', subscriber.id)
      .eq('from_address', emailData.from)
      .eq('subject', emailData.subject)

    // Step 5: Log command
    await (supabase as any).from('commands_log').insert({
      subscriber_id: subscriber.id,
      channel: 'email',
      sender_identifier: emailData.from,
      intent: 'EMAIL_RECEIVED',
      raw_message: `Email from ${emailData.fromName}: ${emailData.subject}`,
      executed: true,
      response_sent: true,
    })

    console.log('✅ [Ephemeral] Email processed successfully - full content deleted')

    // NOTE: emailData goes out of scope here and is garbage collected
    // Full email content is NEVER persisted to database

  } catch (error) {
    console.error('❌ [Ephemeral] Processing error:', error)

    // Even on error, we don't store full email content
    // Send error notification to user
    try {
      await sendSMS({
        to: subscriber.control_phone,
        body: `⚠️ Had trouble processing an email from ${emailData.fromName}. I'll try again.`,
      })
    } catch (smsError) {
      console.error('❌ [Ephemeral] Failed to send error SMS:', smsError)
    }

    throw error
  }
}

/**
 * Analyze email with Claude
 * Returns category, summary, and action needed
 */
async function analyzeEmailWithClaude(
  emailData: EmailData,
  subscriber: any
): Promise<EmailAnalysis> {
  try {
    const emailBody = emailData.strippeTextBody || emailData.textBody || '(empty email)'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `You are analyzing an email for ${subscriber.business_name || subscriber.name}, a ${subscriber.business_type || 'business'}.

From: ${emailData.fromName} <${emailData.from}>
Subject: ${emailData.subject}
Body:
${emailBody.substring(0, 2000)} ${emailBody.length > 2000 ? '...(truncated)' : ''}

Analyze this email and respond with JSON only:
{
  "category": "urgent" | "client" | "lead" | "admin" | "junk",
  "summary": "One sentence summary (max 100 chars)",
  "actionNeeded": true | false,
  "sentiment": "positive" | "neutral" | "negative"
}

Categories:
- urgent: Complaints, time-sensitive, angry tone, needs immediate attention
- client: Existing client questions, updates, requests
- lead: New business inquiry, prospect reaching out
- admin: Receipts, newsletters, notifications, internal
- junk: Spam, irrelevant, marketing

Be accurate and helpful.`
        }
      ]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }

    // Fallback
    return {
      category: 'client',
      summary: `Email from ${emailData.fromName}`,
      actionNeeded: false,
      sentiment: 'neutral'
    }

  } catch (error) {
    console.error('❌ [Claude] Analysis failed:', error)

    // Fallback categorization
    return {
      category: 'client',
      summary: `Email from ${emailData.fromName}: ${emailData.subject}`,
      actionNeeded: false,
      sentiment: 'neutral'
    }
  }
}

/**
 * Build SMS summary message
 */
function buildSMSSummary(emailData: EmailData, analysis: EmailAnalysis): string {
  const icon = getCategoryIcon(analysis.category)
  const urgentFlag = analysis.category === 'urgent' ? '🚨 ' : ''

  return `${urgentFlag}${icon} Email from ${emailData.fromName}

Subject: ${emailData.subject}
${analysis.summary}

${analysis.actionNeeded ? '📋 Action needed' : '📬 FYI'}

Reply "DRAFT ${emailData.from.split('@')[0]}" to write a response`
}

/**
 * Get emoji icon for category
 */
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    urgent: '🔴',
    client: '👤',
    lead: '🎯',
    admin: '📋',
    junk: '🗑️'
  }
  return icons[category] || '📧'
}
