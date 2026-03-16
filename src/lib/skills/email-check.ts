/**
 * Email Check Skill
 * Reads subscriber's connected email inbox and provides summary
 * SIMPLIFIED VERSION - Provides foundation for full implementation
 */

import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'
import { sendEmail } from '@/lib/resend/client'
import { checkEmailConnection } from './email-connect'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface CheckEmailParams {
  subscriber: any
}

interface CheckResult {
  success: boolean
  message: string
}

interface EmailCategory {
  urgent: number
  client: number
  lead: number
  admin: number
  junk: number
}

/**
 * Check email inbox (async operation)
 */
export async function checkEmail(params: CheckEmailParams): Promise<CheckResult> {
  const { subscriber } = params
  const supabase = createServiceClient()

  try {
    console.log('📧 [Email Check] Starting for subscriber:', subscriber.id)

    // Check if email is connected
    const connection = await checkEmailConnection(subscriber.id)
    console.log('📧 [Email Check] Connection:', {
      connected: connection.connected,
      provider: connection.provider,
      has_access_token: !!connection.encrypted_access_token
    })

    if (!connection.connected) {
      console.log('📧 [Email Check] Not connected')
      return {
        success: false,
        message: "Your email isn't connected yet. Reply CONNECT EMAIL to set it up.",
      }
    }

    console.log('📧 [Email Check] Sending acknowledgment to:', subscriber.control_phone)

    // Send acknowledgment
    await sendSMS({
      to: subscriber.control_phone,
      body: 'Checking your inbox now... I\'ll text you the summary in 30 seconds.',
    })

    console.log('📧 [Email Check] Starting async processing...')

    // Process email check asynchronously
    processEmailCheck({
      subscriber,
      connection,
    }).catch((error) => {
      console.error('❌ [Email Check] Async processing failed:', error)
      console.error('❌ [Email Check] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      sendSMS({
        to: subscriber.control_phone,
        body: `I ran into an issue checking your email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    })

    return {
      success: true,
      message: 'Processing started',
    }
  } catch (error) {
    console.error('❌ [Email Check] Top-level error:', error)
    console.error('❌ [Email Check] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack'
    })
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: `I ran into an issue: ${errorMsg}`,
    }
  }
}

/**
 * Process email check (async background task)
 */
async function processEmailCheck(params: {
  subscriber: any
  connection: any
}): Promise<void> {
  const supabase = createServiceClient()

  try {
    console.log('📧 [Process] Step 1: Fetching emails...')

    // Step 1: Fetch emails
    const emails = await fetchEmails(params.connection)
    console.log(`📧 [Process] Step 1 complete: ${emails.length} emails fetched`)

    console.log('📧 [Process] Step 2: Categorizing emails...')

    // Step 2: Categorize emails
    const categories = await categorizeEmails(emails, params.subscriber)
    console.log('📧 [Process] Step 2 complete:', categories)

    console.log('📧 [Process] Step 3: Building summary...')

    // Step 3: Generate summary
    const summary = buildEmailSummary(categories)
    console.log('📧 [Process] Step 3 complete')

    console.log('📧 [Process] Step 4: Storing in database...')

    // Step 4: Store summary in database
    const insertResult = await (supabase as any).from('email_summaries').insert({
      subscriber_id: params.subscriber.id,
      summary_date: new Date().toISOString().split('T')[0],
      total_unread: categories.urgent + categories.client + categories.lead + categories.admin,
      urgent_count: categories.urgent,
      client_count: categories.client,
      lead_count: categories.lead,
      admin_count: categories.admin,
      summary_text: summary,
      created_at: new Date().toISOString(),
    })

    if (insertResult.error) {
      console.error('❌ [Process] Database insert error:', insertResult.error)
    } else {
      console.log('📧 [Process] Step 4 complete')
    }

    console.log('📧 [Process] Step 5: Sending SMS summary...')

    // Step 5: Send SMS summary
    await sendSMS({
      to: params.subscriber.control_phone,
      body: summary,
    })
    console.log('📧 [Process] Step 5 complete')

    console.log('📧 [Process] Step 6: Logging command...')

    // Step 6: Log command execution
    await (supabase as any).from('commands_log').insert({
      subscriber_id: params.subscriber.id,
      channel: 'sms',
      sender_identifier: params.subscriber.control_phone,
      intent: 'CHECK_EMAIL',
      raw_message: 'Check email',
      executed: true,
      response_sent: true,
      created_at: new Date().toISOString(),
    })

    console.log('✅ [Process] Email check complete!')
  } catch (error) {
    console.error('❌ [Process] Error:', error)
    console.error('❌ [Process] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack'
    })
    throw error
  }
}

/**
 * Fetch emails from provider
 */
async function fetchEmails(connection: any): Promise<any[]> {
  const supabase = createServiceClient()

  try {
    console.log('📧 [Fetch] Provider:', connection.provider)

    if (connection.provider === 'outlook') {
      console.log('📧 [Fetch] Importing Microsoft Graph functions...')

      // Import Microsoft Graph functions
      const { getMicrosoftUnreadEmails, refreshMicrosoftToken, decryptToken, encryptToken } = await import('@/lib/email/microsoft')

      console.log('📧 [Fetch] Decrypting access token...')

      // Decrypt the access token
      let accessToken = decryptToken(connection.encrypted_access_token)
      console.log('📧 [Fetch] Access token decrypted successfully')

      // Check if token is expired
      const tokenExpiresAt = new Date(connection.token_expires_at)
      const now = new Date()
      console.log('📧 [Fetch] Token expires at:', tokenExpiresAt.toISOString())
      console.log('📧 [Fetch] Current time:', now.toISOString())
      console.log('📧 [Fetch] Token expired?', now >= tokenExpiresAt)

      if (now >= tokenExpiresAt) {
        console.log('📧 [Fetch] Token expired, refreshing...')

        // Decrypt refresh token
        const refreshToken = decryptToken(connection.encrypted_refresh_token)

        console.log('📧 [Fetch] Calling Microsoft token refresh...')

        // Refresh the token
        const newTokens = await refreshMicrosoftToken(refreshToken)

        // Update access token
        accessToken = newTokens.access_token

        console.log('📧 [Fetch] Re-encrypting and storing new tokens...')

        // Re-encrypt and store new tokens
        const newEncryptedAccessToken = encryptToken(newTokens.access_token)
        const newEncryptedRefreshToken = encryptToken(newTokens.refresh_token)
        const newExpiresAt = new Date(Date.now() + (newTokens.expires_in * 1000))

        await (supabase as any)
          .from('email_connections')
          .update({
            encrypted_access_token: newEncryptedAccessToken,
            encrypted_refresh_token: newEncryptedRefreshToken,
            token_expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', connection.id)

        console.log('✅ [Fetch] Token refreshed successfully')
      }

      console.log('📧 [Fetch] Calling Microsoft Graph API...')

      // Fetch unread emails from Microsoft Graph
      const emails = await getMicrosoftUnreadEmails(accessToken, 50)

      console.log(`✅ [Fetch] Fetched ${emails.length} unread emails from Outlook`)

      // Filter to last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentEmails = emails.filter((email: any) => {
        const receivedDate = new Date(email.receivedDateTime)
        return receivedDate >= yesterday
      })

      console.log(`✅ [Fetch] ${recentEmails.length} emails from last 24 hours`)

      return recentEmails

    } else if (connection.provider === 'gmail') {
      console.log('📧 [Fetch] Gmail not yet implemented')
      return []
    }

    console.log('📧 [Fetch] Unknown provider, returning empty')
    return []
  } catch (error: unknown) {
    console.error('❌ [Fetch] Error:', error)
    console.error('❌ [Fetch] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack',
      name: error instanceof Error ? error.name : 'Unknown'
    })

    const errorMessage = error instanceof Error ? error.message : String(error)

    // If it's an auth error, mark connection as failed
    if (errorMessage.includes('401') || errorMessage.includes('token')) {
      console.log('📧 [Fetch] Marking connection as error due to auth issue')
      await (supabase as any)
        .from('email_connections')
        .update({
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id)
    }

    throw error
  }
}

/**
 * Categorize emails using Claude
 */
async function categorizeEmails(
  emails: any[],
  subscriber: any
): Promise<EmailCategory> {
  // If no emails, return zeros
  if (emails.length === 0) {
    return {
      urgent: 0,
      client: 0,
      lead: 0,
      admin: 0,
      junk: 0,
    }
  }

  try {
    // Prepare email data for Claude
    const emailSummaries = emails.map((email: any, index: number) => {
      return `Email ${index + 1}:
From: ${email.from?.emailAddress?.name || 'Unknown'} <${email.from?.emailAddress?.address || 'unknown'}>
Subject: ${email.subject || '(no subject)'}
Preview: ${email.bodyPreview || '(no preview)'}
---`
    }).join('\n\n')

    // Use Claude to categorize
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `You are analyzing emails for ${subscriber.business_name || subscriber.name}, a ${subscriber.business_type || 'business'}.

Categorize these ${emails.length} emails into:
- URGENT: Needs immediate attention (complaints, time-sensitive requests, angry clients)
- CLIENT: Existing client communication (questions, updates, requests)
- LEAD: Potential new business (inquiries, prospects)
- ADMIN: Administrative/internal (receipts, newsletters, notifications)
- JUNK: Spam or irrelevant

${emailSummaries}

Return ONLY a JSON object with counts:
{"urgent": 0, "client": 0, "lead": 0, "admin": 0, "junk": 0}`
        }
      ]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      // Parse Claude's response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const categories = JSON.parse(jsonMatch[0])
        console.log('Email categories:', categories)
        return categories
      }
    }

    // Fallback: if parsing fails, return default categorization
    console.warn('Failed to parse Claude categorization, using fallback')
    return {
      urgent: 0,
      client: emails.length,
      lead: 0,
      admin: 0,
      junk: 0,
    }

  } catch (error) {
    console.error('Error categorizing emails with Claude:', error)

    // Fallback categorization
    return {
      urgent: 0,
      client: emails.length,
      lead: 0,
      admin: 0,
      junk: 0,
    }
  }
}

/**
 * Build email summary message
 */
function buildEmailSummary(categories: EmailCategory): string {
  const total =
    categories.urgent + categories.client + categories.lead + categories.admin

  if (total === 0) {
    return 'Inbox summary (last 24hrs):\nAll clear! No new emails.'
  }

  let summary = 'Inbox summary (last 24hrs):\n'

  if (categories.urgent > 0) {
    summary += `🔴 ${categories.urgent} urgent (reply URGENT to see)\n`
  }
  if (categories.client > 0) {
    summary += `👤 ${categories.client} client emails\n`
  }
  if (categories.lead > 0) {
    summary += `🎯 ${categories.lead} potential lead${categories.lead > 1 ? 's' : ''}\n`
  }
  if (categories.admin > 0) {
    summary += `📋 ${categories.admin} admin emails\n`
  }

  summary += '\nWant me to draft replies to any?'

  return summary
}
